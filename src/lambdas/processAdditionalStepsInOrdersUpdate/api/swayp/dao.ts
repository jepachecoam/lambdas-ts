import Database from "../../../../shared/databases/sequelize";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
  }

  updateCancelReason = async ({ idOrder }: any) => {
    const query =
      "update `order` o set idCancelReason = 58 where idOrder = :idOrder";

    return this.db.update(query, { replacements: { idOrder } });
  };
}

export default Dao;
