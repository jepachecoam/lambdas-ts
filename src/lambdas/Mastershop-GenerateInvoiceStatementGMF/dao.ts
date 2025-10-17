import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;

  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async getInvoice({
    idInvoice
  }: {
    idInvoice: number;
  }): Promise<any[] | null> {
    const query = `
    select i.totalValue, i.createdAt, ub.name, ub.documentNumber, ub.documentType
    from invoice i
         inner join userBeneficiary ub on i.idBusiness = ub.idBussiness
    where i.idInvoice = :idInvoice
    and ub.state = 1
    and ub.beneficiaryType = 'fiscal';
    `;
    return this.db.fetchOne(query, { replacements: { idInvoice } }) as Promise<
      any[] | null
    >;
  }

  async getInvoiceDetail({
    idInvoice
  }: {
    idInvoice: number;
  }): Promise<any[] | null> {
    const query =
      "select * from invoiceDetail where idInvoice = :idInvoice and category = 'GMF';";
    return this.db.fetchMany(query, { replacements: { idInvoice } }) as Promise<
      any[] | null
    >;
  }
}
export default Dao;
