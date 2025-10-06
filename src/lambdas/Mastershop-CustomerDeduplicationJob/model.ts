import concurrency from "../../shared/services/concurrency";
import { b2bRequest } from "../../shared/services/httpRequest";
import { EnvironmentTypes } from "../../shared/types/database";
import Dao from "./dao";
import {
  countryPhoneCodes,
  Customer,
  CustomerDeduplicationEnvs,
  DuplicateGroup,
  MATCH_WEIGHTS,
  MATCHING_CONFIG,
  MatchResult
} from "./types";

class Model {
  private dao: Dao;
  private envs: CustomerDeduplicationEnvs;
  private environment: EnvironmentTypes;

  constructor(environment: EnvironmentTypes, envs: CustomerDeduplicationEnvs) {
    this.dao = new Dao(environment);
    this.envs = envs;
    this.environment = environment;
  }

  async processBatchDeduplication(): Promise<void> {
    console.log("Starting batch deduplication process");

    const allCustomers = await this.dao.getAllActiveCustomers();
    console.log(`Found ${allCustomers?.length || 0} active customers`);

    if (!allCustomers || allCustomers.length === 0) {
      console.log("No customers found, process completed");
      return;
    }

    const customersByBusiness = this.groupCustomersByBusiness(allCustomers);

    const businessTasks = Object.entries(customersByBusiness).map(
      ([businessId, customers]) =>
        () =>
          this.processBusiness(businessId, customers)
    );

    await concurrency.executeWithLimit({
      tasks: businessTasks,
      concurrencyLimit: 10
    });

    console.log("Batch deduplication process completed successfully");
  }

  private async processBusiness(
    businessId: string,
    customers: Customer[]
  ): Promise<void> {
    const duplicateGroups = this.findDuplicateGroups(customers);

    if (duplicateGroups.length > 0) {
      await this.sendDuplicateGroupsInChunks(businessId, duplicateGroups);
    }
  }

  private async sendDuplicateGroupsInChunks(
    businessId: string,
    duplicateGroups: DuplicateGroup[]
  ): Promise<void> {
    const chunks = this.createChunks(duplicateGroups, 10);
    const tasks = chunks.map(
      (chunk, index) => () =>
        this.sendChunk(businessId, chunk, index + 1, chunks.length)
    );

    await concurrency.executeWithLimit({
      tasks,
      concurrencyLimit: 10
    });
  }

  private createChunks<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async sendChunk(
    businessId: string,
    chunk: DuplicateGroup[],
    chunkIndex: number,
    totalChunks: number
  ): Promise<void> {
    await b2bRequest.post(
      `${this.environment}/api/b2b/customer/deduplication/enqueue`,
      {
        businessId: businessId,
        duplicateGroups: chunk
      }
    );
    console.log(
      `Sent chunk ${chunkIndex}/${totalChunks} with ${chunk.length} duplicate groups for business ${businessId}`
    );
  }

  private groupCustomersByBusiness(
    customers: Customer[]
  ): Record<string, Customer[]> {
    return customers.reduce(
      (groups, customer) => {
        const key = customer.idBussiness.toString();
        if (!groups[key]) groups[key] = [];
        groups[key].push(customer);
        return groups;
      },
      {} as Record<string, Customer[]>
    );
  }

  private findDuplicateGroups(customers: Customer[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<number>();

    const indices = this.buildHashIndices(customers);

    for (const customer of customers) {
      if (processed.has(customer.idCustomer)) continue;

      const candidates = this.findCandidates(customer, indices);
      const duplicates: Customer[] = [];

      for (const candidate of candidates) {
        if (
          processed.has(candidate.idCustomer) ||
          candidate.idCustomer === customer.idCustomer
        ) {
          continue;
        }

        const score = this.calculateMatchScore(customer, candidate);

        if (
          score.totalScore >= MATCHING_CONFIG.MIN_SCORE &&
          score.matches.length >= MATCHING_CONFIG.MIN_MATCHES
        ) {
          duplicates.push(candidate);
          processed.add(candidate.idCustomer);
        }
      }

      if (duplicates.length > 0) {
        const allInGroup = [customer, ...duplicates];
        const winner = this.selectWinner(allInGroup);

        const result = {
          winner,
          duplicates: allInGroup.filter(
            (c) => c.idCustomer !== winner.idCustomer
          )
        };

        console.log(
          `Match >>> Winner: ${winner.idCustomer}, Losers: [${allInGroup
            .filter((c) => c.idCustomer !== winner.idCustomer)
            .map((c) => c.idCustomer)
            .join(", ")}]`
        );

        groups.push(result);

        processed.add(customer.idCustomer);
      }
    }

    return groups;
  }

  private buildHashIndices(customers: Customer[]) {
    const phoneIndex = new Map<string, Customer[]>();
    const emailIndex = new Map<string, Customer[]>();
    const documentIndex = new Map<string, Customer[]>();
    const fullNameIndex = new Map<string, Customer[]>();
    const firstNameIndex = new Map<string, Customer[]>();
    const lastNameIndex = new Map<string, Customer[]>();
    const stateIndex = new Map<string, Customer[]>();
    const cityIndex = new Map<string, Customer[]>();

    for (const customer of customers) {
      const normalized = this.normalizeCustomerData(customer);

      // Phone index - must be > 6 characters and not "null"
      if (
        normalized.phone &&
        normalized.phone.length > 6 &&
        normalized.phone !== "null"
      ) {
        this.addToIndex(phoneIndex, normalized.phone, customer);
      }

      // Email index - must be > 7 characters and not "null"
      if (
        normalized.email &&
        normalized.email.length > 7 &&
        normalized.email !== "null"
      ) {
        this.addToIndex(emailIndex, normalized.email, customer);
      }

      // Document index - must be > 6 characters and not "null"
      if (
        normalized.document &&
        normalized.document.length > 6 &&
        normalized.document !== "null"
      ) {
        this.addToIndex(documentIndex, normalized.document, customer);
      }

      // Name indices - already filtered by normalizeNameText (removes < 3 chars)
      if (normalized.fullName && normalized.fullName.length > 0) {
        this.addToIndex(fullNameIndex, normalized.fullName, customer);
      }
      if (normalized.firstName && normalized.firstName.length > 0) {
        this.addToIndex(firstNameIndex, normalized.firstName, customer);
      }
      if (normalized.lastName && normalized.lastName.length > 0) {
        this.addToIndex(lastNameIndex, normalized.lastName, customer);
      }

      // Address indices
      const address = this.parseCustomerAddress(normalized.defaultAddress);
      if (address) {
        if (address.state && address.state !== "null") {
          const normalizedState = this.normalizeNameText(address.state);
          if (normalizedState && normalizedState.length > 3) {
            this.addToIndex(stateIndex, normalizedState, customer);
          }
        }
        if (address.city && address.city !== "null") {
          const normalizedCity = this.normalizeNameText(address.city);
          if (normalizedCity && normalizedCity.length > 3) {
            this.addToIndex(cityIndex, normalizedCity, customer);
          }
        }
      }
    }

    return {
      phoneIndex,
      emailIndex,
      documentIndex,
      fullNameIndex,
      firstNameIndex,
      lastNameIndex,
      stateIndex,
      cityIndex
    };
  }

  private addToIndex(
    index: Map<string, Customer[]>,
    key: string,
    customer: Customer
  ): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(customer);
  }

  private findCandidates(customer: Customer, indices: any): Set<Customer> {
    const candidateMatches = new Map<number, number>();
    const allCustomers = new Map<number, Customer>();
    const normalized = this.normalizeCustomerData(customer);

    const addMatches = (customers: Customer[]) => {
      customers.forEach((c) => {
        if (c.idCustomer !== customer.idCustomer) {
          candidateMatches.set(
            c.idCustomer,
            (candidateMatches.get(c.idCustomer) || 0) + 1
          );
          allCustomers.set(c.idCustomer, c);
        }
      });
    };

    // Primary fields first
    if (
      normalized.phone &&
      normalized.phone.length > 6 &&
      normalized.phone !== "null" &&
      indices.phoneIndex.has(normalized.phone)
    ) {
      addMatches(indices.phoneIndex.get(normalized.phone)!);
    }
    if (
      normalized.email &&
      normalized.email.length > 7 &&
      normalized.email !== "null" &&
      indices.emailIndex.has(normalized.email)
    ) {
      addMatches(indices.emailIndex.get(normalized.email)!);
    }
    if (
      normalized.document &&
      normalized.document.length > 6 &&
      normalized.document !== "null" &&
      indices.documentIndex.has(normalized.document)
    ) {
      addMatches(indices.documentIndex.get(normalized.document)!);
    }
    if (normalized.fullName && indices.fullNameIndex.has(normalized.fullName)) {
      addMatches(indices.fullNameIndex.get(normalized.fullName)!);
    }
    if (
      normalized.firstName &&
      indices.firstNameIndex.has(normalized.firstName)
    ) {
      addMatches(indices.firstNameIndex.get(normalized.firstName)!);
    }
    if (normalized.lastName && indices.lastNameIndex.has(normalized.lastName)) {
      addMatches(indices.lastNameIndex.get(normalized.lastName)!);
    }

    // Location fields only if we have primary matches
    if (candidateMatches.size > 0) {
      const address = this.parseCustomerAddress(normalized.defaultAddress);
      if (address) {
        if (address.state && address.state !== "null") {
          const normalizedState = this.normalizeNameText(address.state);
          if (
            normalizedState &&
            normalizedState.length > 3 &&
            indices.stateIndex.has(normalizedState)
          ) {
            addMatches(indices.stateIndex.get(normalizedState)!);
          }
        }
        if (address.city && address.city !== "null") {
          const normalizedCity = this.normalizeNameText(address.city);
          if (
            normalizedCity &&
            normalizedCity.length > 3 &&
            indices.cityIndex.has(normalizedCity)
          ) {
            addMatches(indices.cityIndex.get(normalizedCity)!);
          }
        }
      }
    }

    // Return only candidates with MIN_MATCHES or more
    const validCandidates = new Set<Customer>();
    candidateMatches.forEach((matchCount, customerId) => {
      if (matchCount >= MATCHING_CONFIG.MIN_MATCHES) {
        const candidate = allCustomers.get(customerId);
        if (candidate) validCandidates.add(candidate);
      }
    });

    return validCandidates;
  }

  private calculateMatchScore(
    customer1: Customer,
    customer2: Customer
  ): MatchResult {
    const normalized1 = this.normalizeCustomerData(customer1);
    const normalized2 = this.normalizeCustomerData(customer2);

    const matchResult: MatchResult = {
      matches: [],
      fuzzyMatches: [],
      totalScore: 0
    };

    this.processExactMatches(normalized1, normalized2, matchResult);
    this.processNameMatches(normalized1, normalized2, matchResult);
    this.processAddressMatches(normalized1, normalized2, matchResult);

    return matchResult;
  }

  private selectWinner(customers: Customer[]): Customer {
    const scores = customers.map((customer) => {
      let fieldCount = 0;
      if (customer.email) fieldCount++;
      if (customer.phone) fieldCount++;
      if (customer.document) fieldCount++;
      if (customer.defaultAddress) fieldCount++;
      if (customer.firstName) fieldCount++;
      if (customer.lastName) fieldCount++;
      return { customer, fieldCount };
    });

    scores.sort((a, b) => {
      if (a.fieldCount !== b.fieldCount) return b.fieldCount - a.fieldCount;
      return a.customer.idCustomer - b.customer.idCustomer;
    });

    return scores[0].customer;
  }

  private normalizeCustomerData(customer: Customer): Customer {
    const parsedAddress = this.parseCustomerAddress(customer.defaultAddress);
    const normalizedAddress = parsedAddress
      ? {
          ...parsedAddress,
          state: parsedAddress.state
            ? this.normalizeNameText(parsedAddress.state)
            : "",
          city: parsedAddress.city
            ? this.normalizeNameText(parsedAddress.city)
            : ""
        }
      : customer.defaultAddress;

    return {
      ...customer,
      fullName: this.normalizeNameText(customer.fullName),
      firstName: this.normalizeNameText(customer.firstName),
      lastName: this.normalizeNameText(customer.lastName || ""),
      email: customer.email ? this.normalizeEmail(customer.email) : null,
      phone: customer.phone ? this.normalizePhone(customer.phone) : "",
      document: customer.document ? this.normalizeText(customer.document) : "",
      defaultAddress: normalizedAddress
    };
  }

  private processExactMatches(
    customer1: Customer,
    customer2: Customer,
    matchResult: MatchResult
  ): void {
    if (this.exactMatch(customer1.phone, customer2.phone)) {
      matchResult.matches.push("phone");
      matchResult.totalScore += MATCH_WEIGHTS.PHONE;
    }

    if (this.exactMatch(customer1.email, customer2.email)) {
      matchResult.matches.push("email");
      matchResult.totalScore += MATCH_WEIGHTS.EMAIL;
    }

    if (this.exactMatch(customer1.document, customer2.document)) {
      matchResult.matches.push("document");
      matchResult.totalScore += MATCH_WEIGHTS.DOCUMENT;
    }
  }

  private processNameMatches(
    customer1: Customer,
    customer2: Customer,
    matchResult: MatchResult
  ): void {
    if (this.exactMatch(customer1.fullName, customer2.fullName)) {
      matchResult.matches.push("fullName");
      matchResult.totalScore += MATCH_WEIGHTS.FULL_NAME;
      return;
    }

    if (this.exactMatch(customer1.firstName, customer2.firstName)) {
      matchResult.matches.push("firstName");
      matchResult.totalScore += MATCH_WEIGHTS.FIRST_NAME;
    }

    if (this.exactMatch(customer1.lastName, customer2.lastName)) {
      matchResult.matches.push("lastName");
      matchResult.totalScore += MATCH_WEIGHTS.LAST_NAME;
    }
  }

  private processAddressMatches(
    customer1: Customer,
    customer2: Customer,
    matchResult: MatchResult
  ): void {
    if (!customer1.defaultAddress || !customer2.defaultAddress) return;

    const address1 = this.parseCustomerAddress(customer1.defaultAddress);
    const address2 = this.parseCustomerAddress(customer2.defaultAddress);

    if (!address1 || !address2) return;

    const state1 = this.normalizeNameText(address1.state || "");
    const state2 = this.normalizeNameText(address2.state || "");
    const city1 = this.normalizeNameText(address1.city || "");
    const city2 = this.normalizeNameText(address2.city || "");

    let isStateValid = false;

    if (state1 && state2 && state1 === state2) {
      isStateValid = true;
      matchResult.matches.push("address_state");
      matchResult.totalScore += MATCH_WEIGHTS.ADDRESS_STATE;
    }

    if (isStateValid && city1 && city2 && city1 === city2) {
      matchResult.matches.push("address_city");
      matchResult.totalScore += MATCH_WEIGHTS.ADDRESS_CITY;
    }
  }

  private parseCustomerAddress(defaultAddress: any): any {
    if (typeof defaultAddress === "string") {
      try {
        return JSON.parse(defaultAddress);
      } catch {
        return null;
      }
    }
    return defaultAddress;
  }

  private exactMatch(value1: any, value2: any): boolean {
    if (!value1 || !value2) return false;
    return value1.toString() === value2.toString();
  }

  private normalizeText(text: string): string {
    if (!text) return "";
    return text
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  private normalizeEmail(email: string): string {
    if (!email) return "";
    return email.toString().trim().toLowerCase();
  }

  private normalizeNameText(text: string): string {
    if (!text) return "";

    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z\s]/g, "") // Remove numbers and special chars
      .split(" ")
      .filter((word) => word.length >= 3) // Remove words < 3 chars
      .join("") // Join without spaces
      .trim();
  }

  private normalizePhone(phone: string): string {
    if (!phone) return "";
    let cleanPhone = phone.replace(/\D/g, "");
    for (const code of countryPhoneCodes) {
      if (cleanPhone.startsWith(code)) {
        cleanPhone = cleanPhone.substring(code.length);
        break;
      }
    }
    return cleanPhone;
  }
}

export default Model;
