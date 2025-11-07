import axios from "axios";

import Database from "../../shared/databases/sequelize";
import { CreateProductValidationProcessParams, TicketStatus } from "./types";

class Dao {
  private db: Database;
  private environmentName: string;
  private apiToken: string;

  constructor(environment: string) {
    this.environmentName = environment;
    this.db = new Database(environment);
    this.apiToken = process.env[`API_TOKEN_${environment.toUpperCase()}`]!;
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
      if (status === TicketStatus.IN_PROGRESS) {
        return 2;
      } else if (status === TicketStatus.ON_HOLD) {
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

  async getProductVariants({ idProduct }: { idProduct: number }) {
    const query = `
      SELECT v.*, COALESCE(wi.stock, 0) as stock
      FROM variant v
      LEFT JOIN warehouseInventory wi ON v.idVariant = wi.idVariant 
        AND wi.state = 1
      WHERE v.idProduct = :idProduct 
      AND v.isEnable = 1 
      AND v.isDeleted = 0
    `;
    return this.db.fetchMany(query, { replacements: { idProduct } });
  }

  async getPublicProfileByBusiness({ idBusiness }: { idBusiness: number }) {
    const query = `
      SELECT pp.*
      FROM publicProfile pp
      INNER JOIN bussiness b ON pp.idPublicProfile = b.idPublicProfile
      WHERE b.idBussiness = :idBusiness
    `;
    return this.db.fetchOne(query, { replacements: { idBusiness } });
  }

  async getProductFormat({ idProdFormat }: { idProdFormat: number }) {
    const query = `
      SELECT *
      FROM productFormat
      WHERE idProdFormat = :idProdFormat
    `;
    return this.db.fetchOne(query, { replacements: { idProdFormat } });
  }

  async getOpenValidationProcess({
    idProduct,
    idTicket
  }: {
    idProduct: number;
    idTicket: number;
  }) {
    const query = `
      SELECT *
      FROM productValidationProcess
      WHERE (idProduct = :idProduct OR idTicket = :idTicket)
      AND status IN ('processing', 'underReview')
      LIMIT 1
    `;
    return this.db.fetchOne(query, { replacements: { idProduct, idTicket } });
  }

  async createProductValidationProcess(
    params: CreateProductValidationProcessParams
  ) {
    const {
      idProduct,
      idTicket,
      lastValidator,
      status,
      validations,
      suggestions
    } = params;
    const query = `
      INSERT INTO productValidationProcess 
      (idProduct, idTicket, lastValidator, status, validations, suggestions)
      VALUES (:idProduct, :idTicket, :lastValidator, :status, :validations, :suggestions)
    `;
    return this.db.insert(query, {
      replacements: {
        idProduct,
        idTicket,
        lastValidator,
        status,
        validations: validations ? JSON.stringify(validations) : null,
        suggestions: suggestions ? JSON.stringify(suggestions) : null
      }
    });
  }
}
export default Dao;
