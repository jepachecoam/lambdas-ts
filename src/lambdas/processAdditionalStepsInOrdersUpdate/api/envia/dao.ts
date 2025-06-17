import { QueryTypes } from "sequelize";

import db from "../../database/config";

class Dao {
  private db = db;

  async updateShipmentUpdate({ idOrder }: { idOrder: number }) {
    try {
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
      const result = await this.db.query(query, {
        type: QueryTypes.INSERT,
        replacements: { idOrder }
      });

      return result[1] > 0;
    } catch (error) {
      console.error("Error in Dao updateShipmentUpdate =>>>", error);
      throw error;
    }
  }

  async updateReturnShipmentUpdate({ idOrderReturn }: { idOrderReturn: number }) {
    try {
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
      const result = await this.db.query(query, {
        type: QueryTypes.INSERT,
        replacements: { idOrderReturn }
      });

      return result[1] > 0;
    } catch (error) {
      console.error("Error in Dao updateShipmentUpdate =>>>", error);
      throw error;
    }
  }
}

export default Dao;
