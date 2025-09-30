import Fuse from "fuse.js";

import { EnvironmentTypes } from "../../shared/types/database";
import Dao from "./dao";
import {
  BatchDeduplicationResult,
  countryPhoneCodes,
  Customer,
  DuplicateGroup,
  MATCH_WEIGHTS,
  MATCHING_CONFIG,
  MatchResult
} from "./types";

class Model {
  private dao: Dao;

  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }

  async processBatchDeduplication(): Promise<BatchDeduplicationResult> {
    console.log("Starting batch deduplication process");

    const allCustomers = await this.dao.getAllActiveCustomers();
    console.log(`Found ${allCustomers?.length || 0} active customers`);

    if (!allCustomers || allCustomers.length === 0) {
      return { processedBusinesses: 0, duplicateGroups: 0, mergedCustomers: 0 };
    }

    const customersByBusiness = this.groupCustomersByBusiness(allCustomers);

    let totalDuplicateGroups = 0;
    let totalMergedCustomers = 0;

    for (const customers of Object.values(customersByBusiness)) {
      const duplicateGroups = this.findDuplicateGroups(customers);

      for (const group of duplicateGroups) {
        await this.mergeDuplicateGroup(group);

        totalMergedCustomers += group.duplicates.length;
      }
      totalDuplicateGroups += duplicateGroups.length;
    }

    console.log(
      `Batch deduplication completed: ${totalDuplicateGroups} groups, ${totalMergedCustomers} customers merged`
    );

    return {
      processedBusinesses: Object.keys(customersByBusiness).length,
      duplicateGroups: totalDuplicateGroups,
      mergedCustomers: totalMergedCustomers
    };
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

    for (let i = 0; i < customers.length; i++) {
      if (processed.has(customers[i].idCustomer)) continue;

      const duplicates: Customer[] = [];
      const mainCustomer = customers[i];

      for (let j = i + 1; j < customers.length; j++) {
        if (processed.has(customers[j].idCustomer)) continue;

        const score = this.calculateMatchScore(mainCustomer, customers[j]);

        if (
          score.totalScore >= MATCHING_CONFIG.MIN_SCORE &&
          score.matches.length >= MATCHING_CONFIG.MIN_MATCHES
        ) {
          duplicates.push(customers[j]);
          processed.add(customers[j].idCustomer);
        }
      }

      if (duplicates.length > 0) {
        const allInGroup = [mainCustomer, ...duplicates];
        const winner = this.selectWinner(allInGroup);

        groups.push({
          winner,
          duplicates: allInGroup.filter(
            (c) => c.idCustomer !== winner.idCustomer
          )
        });

        processed.add(mainCustomer.idCustomer);
      }
    }

    return groups;
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
      if (customer.externalId) fieldCount++;
      return { customer, fieldCount };
    });

    scores.sort((a, b) => {
      if (a.fieldCount !== b.fieldCount) return b.fieldCount - a.fieldCount;
      return a.customer.idCustomer - b.customer.idCustomer;
    });

    return scores[0].customer;
  }

  private async mergeDuplicateGroup(group: DuplicateGroup): Promise<void> {
    console.log(
      `Merging group: winner ${group.winner.idCustomer}, duplicates: ${group.duplicates.map((d) => d.idCustomer).join(", ")}`
    );

    for (const duplicate of group.duplicates) {
      await this.reassignOrdersToWinner(
        duplicate.idCustomer,
        group.winner.idCustomer
      );
    }

    await this.addUniqueDataToWinner(group.winner, group.duplicates);

    for (const duplicate of group.duplicates) {
      await this.dao.deactivateCustomer(duplicate.idCustomer);
    }
  }

  private async reassignOrdersToWinner(
    oldCustomerId: number,
    newCustomerId: number
  ): Promise<void> {
    const orders = await this.dao.getOrdersByCustomer(oldCustomerId);

    if (orders && orders.length > 0) {
      await this.dao.updateOrdersCustomer(oldCustomerId, newCustomerId);

      for (const order of orders) {
        await this.dao.createOrderReassignmentRecord(
          order.idOrder,
          oldCustomerId,
          newCustomerId
        );
      }
    }
  }

  private async addUniqueDataToWinner(
    winner: Customer,
    duplicates: Customer[]
  ): Promise<void> {
    for (const duplicate of duplicates) {
      if (
        duplicate.phone &&
        !this.phoneExistsInWinner(duplicate.phone, winner.phone)
      ) {
        await this.dao.createCustomerPhone(winner.idCustomer, duplicate.phone);
      }

      if (
        duplicate.email &&
        !this.emailExistsInWinner(duplicate.email, winner.email)
      ) {
        await this.dao.createCustomerEmail(winner.idCustomer, duplicate.email);
      }

      if (duplicate.externalId && duplicate.externalId !== winner.externalId) {
        await this.dao.createCustomerExternalKey(
          winner.idCustomer,
          duplicate.externalId
        );
      }

      if (
        duplicate.defaultAddress &&
        !this.addressExistsInWinner(
          duplicate.defaultAddress,
          winner.defaultAddress
        )
      ) {
        await this.dao.createCustomerAddress(
          winner.idCustomer,
          duplicate.defaultAddress
        );
      }
    }
  }

  private phoneExistsInWinner(
    duplicatePhone: string,
    winnerPhone: string | null
  ): boolean {
    if (!winnerPhone) return false;
    return (
      this.normalizePhone(duplicatePhone) === this.normalizePhone(winnerPhone)
    );
  }

  private emailExistsInWinner(
    duplicateEmail: string,
    winnerEmail: string | null | undefined
  ): boolean {
    if (!winnerEmail) return false;
    return (
      this.normalizeText(duplicateEmail) === this.normalizeText(winnerEmail)
    );
  }

  private addressExistsInWinner(
    duplicateAddress: any,
    winnerAddress: any
  ): boolean {
    if (!winnerAddress || !duplicateAddress) return false;

    const FUZZY_THRESHOLD = 0.3;
    const parsedDuplicate = this.parseCustomerAddress(duplicateAddress);
    const parsedWinner = this.parseCustomerAddress(winnerAddress);

    if (!parsedDuplicate || !parsedWinner) return false;

    const stateScore = this.fuzzySearch(
      this.normalizeText(parsedDuplicate.state || ""),
      this.normalizeText(parsedWinner.state || ""),
      FUZZY_THRESHOLD
    );
    const cityScore = this.fuzzySearch(
      this.normalizeText(parsedDuplicate.city || ""),
      this.normalizeText(parsedWinner.city || ""),
      FUZZY_THRESHOLD
    );

    return stateScore !== null && cityScore !== null;
  }

  private normalizeCustomerData(customer: Customer): Customer {
    const parsedAddress = this.parseCustomerAddress(customer.defaultAddress);
    const normalizedAddress = parsedAddress
      ? {
          ...parsedAddress,
          state: parsedAddress.state
            ? this.normalizeText(parsedAddress.state)
            : "",
          city: parsedAddress.city ? this.normalizeText(parsedAddress.city) : ""
        }
      : customer.defaultAddress;

    return {
      ...customer,
      fullName: this.normalizeText(customer.fullName),
      firstName: this.normalizeText(customer.firstName),
      lastName: this.normalizeText(customer.lastName || ""),
      email: customer.email ? this.normalizeText(customer.email) : null,
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

    if (this.exactMatch(customer1.externalId, customer2.externalId)) {
      matchResult.matches.push("externalId");
      matchResult.totalScore += MATCH_WEIGHTS.EXTERNAL_PLATFORM_ID;
    }
  }

  private processNameMatches(
    customer1: Customer,
    customer2: Customer,
    matchResult: MatchResult
  ): void {
    const NAME_THRESHOLD = 0.5;

    const fullNameScore = this.fuzzySearch(
      this.removeInitials(customer1.fullName),
      this.removeInitials(customer2.fullName),
      NAME_THRESHOLD
    );
    if (fullNameScore !== null) {
      matchResult.matches.push("fullName");
      matchResult.fuzzyMatches.push({
        field: "fullName",
        score: fullNameScore
      });
      matchResult.totalScore += MATCH_WEIGHTS.FULL_NAME;
      return;
    }

    const firstNameScore = this.fuzzySearch(
      this.removeInitials(customer1.firstName),
      this.removeInitials(customer2.firstName),
      NAME_THRESHOLD
    );
    if (firstNameScore !== null) {
      matchResult.matches.push("firstName");
      matchResult.fuzzyMatches.push({
        field: "firstName",
        score: firstNameScore
      });
      matchResult.totalScore += MATCH_WEIGHTS.FIRST_NAME;
    }

    const lastNameScore = this.fuzzySearch(
      this.removeInitials(customer1.lastName || ""),
      this.removeInitials(customer2.lastName || ""),
      NAME_THRESHOLD
    );
    if (lastNameScore !== null) {
      matchResult.matches.push("lastName");
      matchResult.fuzzyMatches.push({
        field: "lastName",
        score: lastNameScore
      });
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

    const STATE_THRESHOLD = 0.3;
    const CITY_THRESHOLD = 0.15;

    let isStateValid = false;

    const stateScore = this.fuzzySearch(
      address1.state,
      address2.state,
      STATE_THRESHOLD
    );
    if (stateScore !== null) {
      isStateValid = true;
      matchResult.matches.push("address_state");
      matchResult.fuzzyMatches.push({
        field: "address_state",
        score: stateScore
      });
      matchResult.totalScore += MATCH_WEIGHTS.ADDRESS_STATE;
    }

    if (isStateValid) {
      const cityScore = this.fuzzySearch(
        address1.city,
        address2.city,
        CITY_THRESHOLD
      );
      if (cityScore !== null) {
        matchResult.matches.push("address_city");
        matchResult.fuzzyMatches.push({
          field: "address_city",
          score: cityScore
        });
        matchResult.totalScore += MATCH_WEIGHTS.ADDRESS_CITY;
      }
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
    return (
      this.normalizeText(value1.toString()) ===
      this.normalizeText(value2.toString())
    );
  }

  private fuzzySearch(
    searchValue: string | null | undefined,
    targetValue: string | null | undefined,
    threshold: number
  ): number | null {
    if (!searchValue || !targetValue) return null;

    const normalizedSearch = this.normalizeText(searchValue);
    const normalizedTarget = this.normalizeText(targetValue);

    if (normalizedSearch.length < 3 || normalizedTarget.length < 3) return null;

    const fuse = new Fuse([normalizedTarget], { includeScore: true });
    const result = fuse.search(normalizedSearch);

    if (
      result.length > 0 &&
      result[0]?.score !== undefined &&
      result[0].score <= threshold
    ) {
      return result[0].score;
    }

    return null;
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

  private removeInitials(name: string | null | undefined): string {
    if (!name) return "";
    return this.normalizeText(name)
      .split(" ")
      .filter((part) => part.length > 1)
      .join(" ");
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
