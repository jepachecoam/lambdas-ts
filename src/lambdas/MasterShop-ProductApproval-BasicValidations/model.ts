import Dao from "./dao";
import { CreateProductValidationProcessParams, TicketStatus } from "./types";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  updateTicket = async ({
    idTicket,
    status,
    observations
  }: {
    idTicket: number;
    status: TicketStatus;
    observations: string;
  }) => {
    try {
      await this.dao.updateTicket({ idTicket, status, observations });
    } catch (error) {
      console.error("Error in updateTicket model =>>>", error);
      throw error;
    }
  };

  getProductVariants = async ({ idProduct }: { idProduct: number }) => {
    try {
      return (await this.dao.getProductVariants({ idProduct })) || [];
    } catch (error) {
      console.error("Error in getProductVariants model =>>>", error);
      throw error;
    }
  };

  getPublicProfileByBusiness = async ({
    idBusiness
  }: {
    idBusiness: number;
  }) => {
    try {
      return await this.dao.getPublicProfileByBusiness({ idBusiness });
    } catch (error) {
      console.error("Error in getPublicProfileByBusiness model =>>>", error);
      throw error;
    }
  };

  getProductFormat = async ({ idProdFormat }: { idProdFormat: number }) => {
    try {
      return await this.dao.getProductFormat({ idProdFormat });
    } catch (error) {
      console.error("Error in getProductFormat model =>>>", error);
      throw error;
    }
  };

  getOpenValidationProcess = async ({
    idProduct,
    idTicket
  }: {
    idProduct: number;
    idTicket: number;
  }) => {
    try {
      return await this.dao.getOpenValidationProcess({ idProduct, idTicket });
    } catch (error) {
      console.error("Error in getOpenValidationProcess model =>>>", error);
      throw error;
    }
  };

  createProductValidationProcess = async (
    params: CreateProductValidationProcessParams
  ) => {
    try {
      return await this.dao.createProductValidationProcess(params);
    } catch (error) {
      console.error(
        "Error in createProductValidationProcess model =>>>",
        error
      );
      throw error;
    }
  };
}

export default Model;
