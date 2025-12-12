import Database from "../../shared/databases/db-sm/sequelize-sm";

class Dao {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  async getBusinessOperationalArea(idBusiness: number) {
    const query = `
          SELECT *
          FROM businessOperationalArea
          WHERE idBussiness = :idBusiness and status = true`;
    return this.db.fetchMany(query, {
      replacements: { idBusiness }
    });
  }

  async getCarrierCityCoverage(
    idBusiness: number,
    idUserCarrierPreference: number,
    countryCity: string
  ) {
    const query = `
          SELECT *
          FROM carrierCityCoverage ccc
                  inner join city c on ccc.idCity = c.idCity
          WHERE idBussiness = :idBusiness
            AND idUserCarrierPreference = :idUserCarrierPreference
            and c.name = :countryCity and ccc.status = true`;
    return this.db.fetchMany(query, {
      replacements: { idBusiness, idUserCarrierPreference, countryCity }
    });
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
