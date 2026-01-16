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
    await this.dao.updateTicket({ idTicket, status, observations });
  };

  getProductVariants = async ({ idProduct }: { idProduct: number }) => {
    return (await this.dao.getProductVariants({ idProduct })) || [];
  };

  getPublicProfileByBusiness = async ({
    idBusiness
  }: {
    idBusiness: number;
  }) => {
    return await this.dao.getPublicProfileByBusiness({ idBusiness });
  };

  getProductFormat = async ({ idProdFormat }: { idProdFormat: number }) => {
    return await this.dao.getProductFormat({ idProdFormat });
  };

  getOpenValidationProcess = async ({ idTicket }: { idTicket: number }) => {
    return await this.dao.getOpenValidationProcess({ idTicket });
  };

  createProductValidationProcess = async (
    params: CreateProductValidationProcessParams
  ) => {
    return await this.dao.createProductValidationProcess(params);
  };
}

export default Model;
