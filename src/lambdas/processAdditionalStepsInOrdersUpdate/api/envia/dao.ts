import Database from "../../../../shared/databases/sequelize";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
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
}

export default Dao;
