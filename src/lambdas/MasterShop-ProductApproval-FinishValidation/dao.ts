import axios from "axios";

import Database from "../../shared/databases/sequelize";
import {
  TicketStatus,
  UpdateProductValidationProcessParams,
  ValidationStatus
} from "./types";

class Dao {
  private db: Database;
  private environmentName: string;
  private apiToken: string;

  constructor(environment: string) {
    this.environmentName = environment;
    this.db = new Database(environment);
    this.apiToken = process.env[`API_TOKEN_${environment.toUpperCase()}`]!;
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
    } catch (error) {
      console.error("Error in updateProductValidationProcess dao =>>>", error);
      throw error;
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
    const idState = (status: ValidationStatus) => {
      if (status === ValidationStatus.APPROVED) {
        return 1;
      } else if (status === ValidationStatus.REJECTED) {
        return 0;
      }

      throw new Error("Invalid status");
    };

    try {
      const result = await axios.put(
        `${process.env["BASE_URL"]}/${this.environmentName}/api/mastershop/products/${idProduct}`,
        {
          idUser,
          oldState: 3,
          idState: idState(status),
          adminObservations
        },
        {
          headers: {
            "id-token": this.apiToken
          }
        }
      );
      return result;
    } catch (error) {
      console.error("Error in updateProductStatus dao =>>>", error);
      throw error;
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
    const idStatusCatalog = (status: TicketStatus) => {
      if (status === TicketStatus.ON_HOLD) {
        return 3;
      } else if (status === TicketStatus.COMPLETED) {
        return 4;
      }

      throw new Error("Invalid status");
    };

    try {
      const result = await axios.put(
        `${process.env["BASE_URL"]}/${this.environmentName}/api/tickets/${idTicket}/status`,
        {
          idStatusCatalog: idStatusCatalog(status),
          observations
        },
        {
          headers: {
            "id-token": this.apiToken
          }
        }
      );
      return result;
    } catch (error) {
      console.error("Error in updateTicket dao =>>>", error);
      throw error;
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
    } catch (error) {
      console.error("Error in updateProductCategory dao =>>>", error);
      throw error;
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
    } catch (error) {
      console.error("Error in sendToSlack dao =>>>", error);
      throw error;
    }
  }
}
export default Dao;
