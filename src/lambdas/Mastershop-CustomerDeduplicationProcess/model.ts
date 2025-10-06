import { EnvironmentTypes } from "../../shared/types/database";
import Dao from "./dao";
import {
  countryPhoneCodes,
  Customer,
  CustomerDeduplicationEnvs,
  DuplicateGroup
} from "./types";

class Model {
  private dao: Dao;
  private envs: CustomerDeduplicationEnvs;

  constructor(environment: EnvironmentTypes, envs: CustomerDeduplicationEnvs) {
    this.dao = new Dao(environment);
    this.envs = envs;
  }

  async processRecords(records: any[]): Promise<void> {
    for (const record of records) {
      await Promise.all(
        record.duplicateGroups.map((group: any) =>
          this.mergeDuplicateGroup(group)
        )
      );
    }
  }

  async mergeDuplicateGroup(group: DuplicateGroup): Promise<void> {
    console.log(
      `Merging group: winner ${group.winner.idCustomer}, duplicates: ${group.duplicates.map((d) => d.idCustomer).join(", ")}`
    );

    const duplicateIds = group.duplicates.map((d) => d.idCustomer);

    await this.dao.batchCreateOrderReassignmentRecords(
      duplicateIds,
      group.winner.idCustomer
    );

    await this.dao.batchUpdateOrdersCustomer(
      duplicateIds,
      group.winner.idCustomer
    );

    await this.batchAddUniqueDataToWinner(group.winner, group.duplicates);

    await this.dao.batchDeactivateCustomers(duplicateIds);
  }

  private async batchAddUniqueDataToWinner(
    winner: Customer,
    duplicates: Customer[]
  ): Promise<void> {
    const phones: string[] = [];
    const emails: string[] = [];
    const addresses: any[] = [];

    for (const duplicate of duplicates) {
      if (
        duplicate.phone &&
        !this.phoneExistsInWinner(duplicate.phone, winner.phone)
      ) {
        phones.push(duplicate.phone);
      }

      if (
        duplicate.email &&
        !this.emailExistsInWinner(duplicate.email, winner.email)
      ) {
        emails.push(duplicate.email);
      }

      if (
        duplicate.defaultAddress &&
        !this.addressExistsInWinner(
          duplicate.defaultAddress,
          winner.defaultAddress
        )
      ) {
        addresses.push(duplicate.defaultAddress);
      }
    }

    const promises = [];
    if (phones.length > 0) {
      promises.push(
        this.dao.batchCreateCustomerPhones(winner.idCustomer, phones)
      );
    }
    if (emails.length > 0) {
      promises.push(
        this.dao.batchCreateCustomerEmails(winner.idCustomer, emails)
      );
    }
    if (addresses.length > 0) {
      promises.push(
        this.dao.batchCreateCustomerAddresses(winner.idCustomer, addresses)
      );
    }

    await Promise.all(promises);
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
      this.normalizeEmail(duplicateEmail) === this.normalizeEmail(winnerEmail)
    );
  }

  private addressExistsInWinner(
    duplicateAddress: any,
    winnerAddress: any
  ): boolean {
    if (!winnerAddress || !duplicateAddress) return false;

    const parsedDuplicate = this.parseCustomerAddress(duplicateAddress);
    const parsedWinner = this.parseCustomerAddress(winnerAddress);

    if (!parsedDuplicate || !parsedWinner) return false;

    const duplicateState = this.normalizeNameText(parsedDuplicate.state || "");
    const winnerState = this.normalizeNameText(parsedWinner.state || "");
    const duplicateCity = this.normalizeNameText(parsedDuplicate.city || "");
    const winnerCity = this.normalizeNameText(parsedWinner.city || "");

    return duplicateState === winnerState && duplicateCity === winnerCity;
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
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z\s]/g, "")
      .split(" ")
      .filter((word) => word.length >= 3)
      .join("")
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
