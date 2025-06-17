import { QueryTypes } from "sequelize";

import db from "../../database/config";

class Dao {
  private db = db;

  async updateCancelReason({ idOrder }: { idOrder: number }) {
    try {
      const query = `
        update \`order\` o set idCancelReason = 58 where idOrder = :idOrder
        `;
      const result = await this.db.query(query, {
        type: QueryTypes.INSERT,
        replacements: { idOrder }
      });

      return result[1] > 0;
    } catch (error) {
      console.error("Error in Dao updateCancelReason =>>>", error);
      throw error;
    }
  }
}

export default Dao;
