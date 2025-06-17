import db from "../../conf/db";

const updateShipmentUpdate = async ({ idOrder }: any) => {
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

  return db.update(query, { replacements: { idOrder } });
};

const updateReturnShipmentUpdate = async ({ idOrderReturn }: any) => {
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

  return db.update(query, { replacements: { idOrderReturn } });
};

export default {
  updateShipmentUpdate,
  updateReturnShipmentUpdate
};
