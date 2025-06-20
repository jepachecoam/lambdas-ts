import { EnvironmentTypes } from "../../shared/types/database";
import Dao from "./dao";
import Request from "./request";

class Model {
  private dao: Dao;
  private request: Request;

  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
    this.request = new Request(environment);
  }

  async blockEntities({ idUser, idBusiness, idBlacklistReason }: any) {
    console.log(`[blockEntities] Start: ${idUser}, business: ${idBusiness}`);

    try {
      await this.request.addUserToBlacklist({
        idBlacklistReason,
        idBusiness,
        idUser
      });

      console.log(`[blockEntities] Done: ${idUser}`);
    } catch (error) {
      console.error(`[blockEntities] Error: ${idUser}`, error);
      throw error;
    }
  }

  async getEntitiesToBlock({ idUser }: any) {
    console.log("starting process to get entities to block...");

    const entitiesToBlock: any = {
      accountNumbers: [],
      documentNumbers: [],
      phones: [],
      emails: []
    };
    const bankAccounts = await this.dao.getBankAccounts({ idUser });
    if (bankAccounts) {
      entitiesToBlock.accountNumbers.push(
        ...bankAccounts.map((account: any) => account.accountNumber)
      );
    }

    const idDocuments = await this.dao.getIdDocuments({ idUser });
    if (idDocuments) {
      entitiesToBlock.documentNumbers.push(
        ...idDocuments.map((document: any) => document.documentNumber)
      );
    }

    const phoneNumbers = await this.dao.getPhones({ idUser });
    if (phoneNumbers) {
      entitiesToBlock.phones.push(
        ...phoneNumbers.map((phoneData: any) => phoneData.phoneNumber)
      );
    }

    const emails = await this.dao.getEmails({ idUser });
    if (emails) {
      entitiesToBlock.emails.push(...emails.map((email: any) => email.email));
    }

    if (!bankAccounts && !idDocuments && !phoneNumbers && !emails) {
      console.log("No entities found to block for user:", idUser);
    }
    return entitiesToBlock;
  }

  async updateStatusEntities({
    idBusiness,
    newStatus,
    idBlacklistReason
  }: any) {
    const itemsBlacklist = await this.dao.getIdsBlacklistByReference({
      idBusiness,
      idBlacklistReason
    });

    if (!itemsBlacklist || itemsBlacklist.length === 0) {
      console.log("No items to update status for idReference:", idBusiness);
      return;
    }

    const ids = itemsBlacklist
      .map((item: any) => item.idBlacklist)
      .filter(Boolean);

    for (const idBlacklist of ids) {
      await this.request.updateItemToBlacklist({ idBlacklist, newStatus });
    }
  }
}

export default Model;
