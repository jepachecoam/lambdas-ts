import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
  }
  getCustomers = async () => {
    const query = `
    select *
    from customer
    where idBussiness = 101428
    order by firstName ,createdAt desc
    limit 300;
    `;
    return this.db.fetchMany(query);
  };
}

export default Dao;
