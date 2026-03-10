import axios from "axios";
import FormData from "form-data";

import Database from "../../shared/databases/sequelize";
import {
  TicketStatus,
  UpdateProductValidationProcessParams,
  ValidationStatus
} from "./types";
import utils from "./utils";

class Dao {
  private db: Database;
  private environmentName: string;
  private msBaseUrl: string;
  private adminBaseUrl: string;
  private apiToken: string;
  private adminApiKey: string;
  private adminAppName: string;

  constructor(environment: string) {
    this.environmentName = environment;
    this.db = new Database(environment);
    this.msBaseUrl = process.env[`MS_BASE_URL_${environment.toUpperCase()}`]!;
    this.adminBaseUrl =
      process.env[`ADMIN_BASE_URL_${environment.toUpperCase()}`]!;
    this.apiToken = process.env[`API_TOKEN_${environment.toUpperCase()}`]!;
    this.adminApiKey = process.env["ADMIN_API_KEY"]!;
    this.adminAppName = process.env["ADMIN_APP_NAME"]!;
  }

  async updateProductValidationProcess(
    idTicket: number,
    params: UpdateProductValidationProcessParams
  ) {
    try {
      const fields: string[] = [];
      const replacements: any = { idTicket };

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = :${key}`);
          replacements[key] = ["validations", "suggestions"].includes(key)
            ? JSON.stringify(value)
            : value;
        }
      });

      const query = `UPDATE productValidationProcess SET ${fields.join(", ")} WHERE idTicket = :idTicket`;
      return this.db.update(query, {
        replacements
      });
    } catch (error: any) {
      throw new Error(
        `Dao.updateProductValidationProcess(idTicket: ${idTicket}): ${error.message}`
      );
    }
  }

  async updateProductStatus({
    idProduct,
    idUser,
    status,
    adminObservations
  }: {
    idProduct: number;
    idUser: number;
    status: ValidationStatus;
    adminObservations: string;
  }) {
    try {
      const payload = this.updateProductStatusPayload({
        idProduct,
        idUser,
        status,
        adminObservations
      });
      const result = await axios.put(
        `${this.msBaseUrl}/mastershop/products/${idProduct}`,
        payload,
        {
          headers: {
            "x-auth-id": this.apiToken,
            "x-api-key": this.adminApiKey,
            "x-app-name": this.adminAppName
          }
        }
      );

      if (result.status !== 200 || result.data.codeResponse !== 200) {
        throw new Error(JSON.stringify(result.data || {}));
      }

      return result.data.data;
    } catch (error: any) {
      throw new Error(
        `Dao.updateProductStatus(idProduct: ${idProduct}, status: ${status}): ${error.message}`
      );
    }
  }

  async updateTicket({
    idTicket,
    status,
    observations
  }: {
    idTicket: number;
    status: TicketStatus;
    observations: string;
  }) {
    try {
      const result = await axios.put(
        `${this.adminBaseUrl}/tickets/${idTicket}/status`,
        {
          idStatusCatalog: this.idStatusCatalog(status),
          observations
        },
        {
          headers: {
            "x-auth-id": this.apiToken,
            "x-api-key": this.adminApiKey,
            "x-app-name": this.adminAppName
          }
        }
      );

      if (result.status !== 200 || result.data.codeResponse !== 200) {
        throw new Error(JSON.stringify(result.data || {}));
      }

      return result;
    } catch (error: any) {
      throw new Error(
        `Dao.updateTicket(idTicket: ${idTicket}, status: ${status}): ${error.message}`
      );
    }
  }

  async changesModules({
    idProduct,
    idUser,
    status,
    outputResponse,
    observations
  }: {
    idProduct: number;
    idUser: number;
    status: ValidationStatus;
    outputResponse: any;
    observations: string;
  }) {
    try {
      const inputRequest = this.updateProductStatusPayload({
        idProduct,
        idUser,
        status,
        adminObservations: observations
      });

      const formData = new FormData();
      const data: Record<string, any> = {
        idUserbyPlatform: `mastershop-${idUser}`,
        idChange: `updateProduct-${idProduct}-${utils.generateId({})}`,
        inputRequest,
        outputResponse: outputResponse || {},
        observations
      };

      for (const key in data) {
        const saveToValue =
          typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
        formData.append(key, saveToValue);
      }

      const result = await axios.post(
        `${this.msBaseUrl}/changes-modules`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-auth-id": this.apiToken,
            "x-api-key": this.adminApiKey,
            "x-app-name": this.adminAppName
          }
        }
      );

      if (result.status !== 200 || result.data.codeResponse !== 200) {
        throw new Error(JSON.stringify(result.data || {}));
      }

      return result;
    } catch (error: any) {
      throw new Error(
        `Dao.changesModules(idProduct: ${idProduct}, status: ${status}): ${error.message}`
      );
    }
  }

  async updateProductCategory({
    idProduct,
    idProdFormat
  }: {
    idProduct: number;
    idProdFormat: number;
  }) {
    try {
      const query =
        "UPDATE product SET idProdFormat = :idProdFormat WHERE idProduct = :idProduct";
      return this.db.update(query, {
        replacements: { idProduct, idProdFormat }
      });
    } catch (error: any) {
      throw new Error(
        `Dao.updateProductCategory(idProduct: ${idProduct}, idProdFormat: ${idProdFormat}): ${error.message}`
      );
    }
  }

  async sendToSlack(payload: object): Promise<void> {
    try {
      const url = process.env["SLACK_URL"]!;
      const env =
        this.environmentName === "dev"
          ? "(dev)"
          : this.environmentName === "qa"
            ? "(qa)"
            : "";
      const origin = `MasterShop-ProductApproval-FinishValidation${env}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...payload, origin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
    } catch (error: any) {
      throw new Error(`Dao.sendToSlack(): ${error.message}`);
    }
  }

  private updateProductStatusPayload({
    idProduct,
    idUser,
    status,
    adminObservations
  }: {
    idProduct: number;
    idUser: number;
    status: ValidationStatus;
    adminObservations: string;
  }) {
    return {
      idProduct,
      idUser,
      oldState: 3,
      idState: this.idState(status),
      adminObservations
    };
  }

  private idState(status: ValidationStatus) {
    if (status === ValidationStatus.APPROVED) {
      return 1;
    } else if (status === ValidationStatus.REJECTED) {
      return 0;
    }
    throw new Error("Invalid status");
  }

  private idStatusCatalog(status: TicketStatus) {
    if (status === TicketStatus.ON_HOLD) {
      return 3;
    } else if (status === TicketStatus.COMPLETED) {
      return 4;
    }
    throw new Error("Invalid status");
  }
}
export default Dao;
