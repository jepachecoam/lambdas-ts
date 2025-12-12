import Database from "../../shared/databases/db-sm/sequelize-sm";

class Dao {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  async getLocation(countryCity: string, countryState: string) {
    const query = `
          SELECT c.idCity, c.name, c.idOperationalArea, cs.name as stateName
          FROM city c
          INNER JOIN countryState cs ON cs.idState = c.idState
          WHERE c.name = :countryCity AND cs.name = :countryState`;
    return this.db.fetchOne(query, {
      replacements: { countryCity, countryState }
    });
  }
}

export default Dao;
