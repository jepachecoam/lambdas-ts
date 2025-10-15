import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;

  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async getAllActiveCustomers(): Promise<any[] | null> {
    const query = `
    select * from customer limit 100;
    `;
    return this.db.fetchMany(query) as Promise<any[] | null>;
  }
}

export default Dao;
