import { QueryTypes } from "sequelize";

import db from "../database/config";

const updateShipmentUpdate = async ({ idOrder }: any) => {
  try {
    const query = `
        update orderShipmentUpdateHistory osuh
        set status       = 'RESOLVED',
            solution     = 'AUTOMATIC',
            userSolution = 'Inhouse-Envia',
            dateSolution = now(),
            comments     = 'Solucionada automáticamente por el inhouse de Envia'
        where idOrder = ${idOrder}
        and status = 'PENDING'
        `;
    const result = await db.query(query, {
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error in Dao updateShipmentUpdate =>>>", error);
    throw error;
  }
};

const updateReturnShipmentUpdate = async ({ idOrderReturn }: any) => {
  try {
    const query = `
        update orderReturnShipmentUpdateHistory osuh
        set status       = 'RESOLVED',
            solution     = 'AUTOMATIC',
            userSolution = 'Inhouse-Envia',
            dateSolution = now(),
            comments     = 'Solucionada automáticamente por el inhouse de Envia'
        where idOrderReturn = ${idOrderReturn}
        and status = 'PENDING';
          `;
    const result = await db.query(query, {
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error in Dao updateShipmentUpdate =>>>", error);
    throw error;
  }
};

export default {
  updateShipmentUpdate,
  updateReturnShipmentUpdate
};
