import Database from "../../../../shared/databases/sequelize";
import { b2bClientCarriers } from "../../utils/request";

class Dao {
  private db: Database;
  private environment: string;
  constructor(environment: string) {
    this.db = new Database(environment);
    this.environment = environment;
  }

  updateShipmentUpdate = async ({ idOrder }: any) => {
    const query = `
        update orderShipmentUpdateHistory osuh
        set status       = 'RESOLVED',
            solution     = 'AUTOMATIC',
            userSolution = 'Inhouse-Envia',
            dateSolution = now(),
            comments     = 'Solucionada automáticamente por el inhouse de Envia'
        where idOrder = :idOrder
        and status = 'PENDING'
        `;

    return this.db.update(query, { replacements: { idOrder } });
  };

  updateReturnShipmentUpdate = async ({ idOrderReturn }: any) => {
    const query = `
        update orderReturnShipmentUpdateHistory osuh
        set status       = 'RESOLVED',
            solution     = 'AUTOMATIC',
            userSolution = 'Inhouse-Envia',
            dateSolution = now(),
            comments     = 'Solucionada automáticamente por el inhouse de Envia'
        where idOrderReturn = :idOrderReturn
        and status = 'PENDING';
          `;

    return this.db.update(query, { replacements: { idOrderReturn } });
  };

  getStatusGuide = async ({
    carrierTrackingCode
  }: {
    carrierTrackingCode: string;
  }) => {
    try {
      const url = `/${this.environment}/b2b/api/envia/statusGuide/${carrierTrackingCode}`;
      const response = await b2bClientCarriers.get(url);
      return response.data.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  sendToUpdateOrderQueue = async (payload: any) => {
    try {
      const response = await b2bClientCarriers.post(
        `/${this.environment}/b2b/api/UpdateOrder`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };
}

export default Dao;
