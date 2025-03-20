import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";
import Request from "./request";
import { statusType } from "./types/types";

class Model {
  private dao: Dao;
  private request: Request;

  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
    this.request = new Request(environment);
  }

  async blockEntities({ idUser, idBusiness, idBlacklistReason }: any) {
    console.log("starting process to block entities...");

    await this.updateStatusEntities({
      idBusiness,
      idBlacklistReason,
      newStatus: statusType.ACTIVE
    });

    const entitiesToBlock = await this.getEntitiesToBlock({ idUser });

    const entityTypeMap = {
      accountNumbers: 7,
      documentNumbers: 3,
      phones: 6,
      emails: 8
    };

    for (const [entityType, idBlacklistEntityType] of Object.entries(
      entityTypeMap
    )) {
      const entities = entitiesToBlock[entityType]?.filter(Boolean) || [];
      for (const idEntity of entities) {
        await this.request.addItemToBlacklist({
          idBlacklistEntityType,
          idEntity,
          idReference: idBusiness,
          idBlacklistReason
        });
      }
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
