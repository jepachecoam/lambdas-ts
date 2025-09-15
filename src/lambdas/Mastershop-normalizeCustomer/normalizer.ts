import { Customer, NormalizedResult } from "./types";

export class CustomerNormalizer {
  private readonly WEIGHTS = {
    DOCUMENT: 40,
    EMAIL: 30,
    PHONE: 25,
    FULL_NAME: 15,
    ADDRESS1: 10,
    ADDRESS_PHONE: 20,
    OTHER_ADDRESS: 5
  };

  private readonly THRESHOLD = 50;

  normalize(customers: Customer[]): NormalizedResult[] {
    const groups: Customer[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < customers.length; i++) {
      if (processed.has(i)) continue;

      const group = [customers[i]];
      processed.add(i);

      for (let j = i + 1; j < customers.length; j++) {
        if (processed.has(j)) continue;

        const probability = this.calculateProbability(
          customers[i],
          customers[j]
        );
        if (probability >= this.THRESHOLD) {
          group.push(customers[j]);
          processed.add(j);
        }
      }

      groups.push(group);
    }

    return groups.map((group) => this.mergeGroup(group));
  }

  private calculateProbability(c1: Customer, c2: Customer): number {
    // Check for exact matches in critical fields first
    if (this.hasValue(c1.document) && this.hasValue(c2.document)) {
      if (this.normalizeText(c1.document) === this.normalizeText(c2.document)) {
        return 100;
      }
    }

    if (this.hasValue(c1.email) && this.hasValue(c2.email)) {
      if (this.normalizeText(c1.email!) === this.normalizeText(c2.email!)) {
        return 100;
      }
    }

    if (this.hasValue(c1.phone) && this.hasValue(c2.phone)) {
      if (this.normalizePhone(c1.phone) === this.normalizePhone(c2.phone)) {
        return 100;
      }
    }

    // If no exact match, calculate weighted probability
    let score = 0;
    let maxScore = 0;

    // Document comparison
    if (this.hasValue(c1.document) || this.hasValue(c2.document)) {
      maxScore += this.WEIGHTS.DOCUMENT;
      if (this.hasValue(c1.document) && this.hasValue(c2.document)) {
        if (
          this.normalizeText(c1.document) === this.normalizeText(c2.document)
        ) {
          score += this.WEIGHTS.DOCUMENT;
        }
      }
    }

    // Email comparison
    if (this.hasValue(c1.email) || this.hasValue(c2.email)) {
      maxScore += this.WEIGHTS.EMAIL;
      if (this.hasValue(c1.email) && this.hasValue(c2.email)) {
        if (this.normalizeText(c1.email!) === this.normalizeText(c2.email!)) {
          score += this.WEIGHTS.EMAIL;
        }
      }
    }

    // Phone comparison
    if (this.hasValue(c1.phone) || this.hasValue(c2.phone)) {
      maxScore += this.WEIGHTS.PHONE;
      if (this.hasValue(c1.phone) && this.hasValue(c2.phone)) {
        if (this.normalizePhone(c1.phone) === this.normalizePhone(c2.phone)) {
          score += this.WEIGHTS.PHONE;
        }
      }
    }

    // Full name comparison
    if (this.hasValue(c1.fullName) || this.hasValue(c2.fullName)) {
      maxScore += this.WEIGHTS.FULL_NAME;
      if (this.hasValue(c1.fullName) && this.hasValue(c2.fullName)) {
        if (
          this.normalizeText(c1.fullName) === this.normalizeText(c2.fullName)
        ) {
          score += this.WEIGHTS.FULL_NAME;
        }
      }
    }

    // Address comparison
    const addr1 = c1.defaultAddress;
    const addr2 = c2.defaultAddress;

    if (this.hasValue(addr1?.address1) || this.hasValue(addr2?.address1)) {
      maxScore += this.WEIGHTS.ADDRESS1;
      if (this.hasValue(addr1?.address1) && this.hasValue(addr2?.address1)) {
        if (
          this.normalizeText(addr1.address1) ===
          this.normalizeText(addr2.address1)
        ) {
          score += this.WEIGHTS.ADDRESS1;
        }
      }
    }

    if (this.hasValue(addr1?.phone) || this.hasValue(addr2?.phone)) {
      maxScore += this.WEIGHTS.ADDRESS_PHONE;
      if (this.hasValue(addr1?.phone) && this.hasValue(addr2?.phone)) {
        if (
          this.normalizePhone(addr1.phone) === this.normalizePhone(addr2.phone)
        ) {
          score += this.WEIGHTS.ADDRESS_PHONE;
        }
      }
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  private mergeGroup(group: Customer[]): NormalizedResult {
    const sortedByDate = group.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const merged = this.mergeCustomers(sortedByDate);
    const avgProbability = this.calculateGroupProbability(group);

    return {
      numberOfRepeated: group.length,
      result: {
        probability: avgProbability,
        data: merged
      },
      sourceRecords: group
    };
  }

  private mergeCustomers(customers: Customer[]): Customer {
    const base = { ...customers[0] };

    for (const customer of customers.slice(1)) {
      if (!this.hasValue(base.email) && this.hasValue(customer.email)) {
        base.email = customer.email;
      }
      if (!this.hasValue(base.phone) && this.hasValue(customer.phone)) {
        base.phone = customer.phone;
      }
      if (!this.hasValue(base.document) && this.hasValue(customer.document)) {
        base.document = customer.document;
      }

      // Merge address fields
      const addr = base.defaultAddress;
      const custAddr = customer.defaultAddress;

      if (!this.hasValue(addr.address1) && this.hasValue(custAddr.address1)) {
        addr.address1 = custAddr.address1;
      }
      if (!this.hasValue(addr.phone) && this.hasValue(custAddr.phone)) {
        addr.phone = custAddr.phone;
      }
    }

    // Normalize final data
    base.fullName = this.normalizeText(base.fullName);
    base.firstName = this.normalizeText(base.firstName);
    base.lastName = this.normalizeText(base.lastName);
    if (base.email) base.email = this.normalizeText(base.email);
    base.phone = this.normalizePhone(base.phone);
    base.document = this.normalizeText(base.document);

    return base;
  }

  private calculateGroupProbability(group: Customer[]): number {
    if (group.length === 1) return 100;

    let totalProb = 0;
    let comparisons = 0;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        totalProb += this.calculateProbability(group[i], group[j]);
        comparisons++;
      }
    }

    return Math.round(totalProb / comparisons);
  }

  private hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== "";
  }

  private normalizeText(text: string): string {
    return text?.toString().trim().toLowerCase() || "";
  }

  private normalizePhone(phone: string): string {
    if (!phone) return "";

    // Remove all non-digits
    let normalized = phone.toString().replace(/\D/g, "");

    // LATAM country codes
    const latamCodes = [
      "1",
      "52",
      "53",
      "54",
      "55",
      "56",
      "57",
      "58",
      "591",
      "592",
      "593",
      "594",
      "595",
      "596",
      "597",
      "598",
      "502",
      "503",
      "504",
      "505",
      "506",
      "507",
      "508",
      "509"
    ];

    for (const code of latamCodes) {
      if (normalized.startsWith(code) && normalized.length > code.length + 7) {
        normalized = normalized.substring(code.length);
        break;
      }
    }

    return normalized;
  }
}
