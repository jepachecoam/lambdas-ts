import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types/database";

class Dao {
  private db: Database;
  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
  }

  async getBankAccounts({ idUser }: { idUser: number }) {
    const query = `
          with userBusinessFiltered as (select ub.idBussiness
                                        from userBussiness ub
                                        where ub.idUser = :idUser
                                          and ub.relation = 'OWNER'),
               userBeneficiaryFiltered as (select ufc.idUserBeneficiary
                                           from userBeneficiary ufc
                                                    inner join userBusinessFiltered ubf
                                                               on ufc.idBussiness = ubf.idBussiness and
                                                                  beneficiaryType = 'financial' and ufc.state = 1)
          select distinct bd.accountNumber
          from bankData bd
                   inner join userBeneficiaryFiltered ubf on bd.idBeneficiary = ubf.idUserBeneficiary;
          `;
    return this.db.fetchMany(query, { replacements: { idUser } });
  }

  async getIdDocuments({ idUser }: { idUser: number }) {
    const query = `
          with userBusinessFiltered as (select ub.idBussiness
                                        from userBussiness ub
                                        where ub.idUser = :idUser
                                          and ub.relation = 'OWNER')
          select distinct ufc.documentNumber
          from userBeneficiary ufc
                   inner join userBusinessFiltered ubf
                              on ufc.idBussiness = ubf.idBussiness and ufc.state = 1
          `;
    return this.db.fetchMany(query, { replacements: { idUser } });
  }

  async getPhones({ idUser }: { idUser: number }) {
    const query = `
          WITH userBusinessFiltered AS (
              SELECT b.idPublicProfile, b.phoneNumber
              FROM userBussiness ub
              INNER JOIN bussiness b ON ub.idBussiness = b.idBussiness
              WHERE ub.idUser = :idUser
              AND ub.relation = 'OWNER'
          ),
          uniquePhones AS (
              SELECT ubf.phoneNumber AS phoneNumber
              FROM userBusinessFiltered ubf
              LEFT JOIN publicProfile pp ON pp.idPublicProfile = ubf.idPublicProfile
              WHERE ubf.phoneNumber IS NOT NULL
              UNION
              SELECT pp.whatsapp AS number
              FROM publicProfile pp
              WHERE pp.idPublicProfile IN (SELECT idPublicProfile FROM userBusinessFiltered)
              AND pp.whatsapp IS NOT NULL
          )
          SELECT DISTINCT phoneNumber
          FROM uniquePhones
          WHERE phoneNumber IS NOT NULL;
          `;
    return this.db.fetchMany(query, { replacements: { idUser } });
  }

  async getEmails({ idUser }: { idUser: number }) {
    const query = `
          select u.email
          from user u
          where idUser = ${idUser};
          `;
    return this.db.fetchMany(query);
  }

  async getIdsBlacklistByReference({
    idBusiness,
    idBlacklistReason
  }: {
    idBusiness: number;
    idBlacklistReason: number;
  }) {
    const query = `
      select idBlacklist
      from blacklist
      where idBlacklistReference in
            (select idBlacklistReference from blacklistReference where idBlacklistEntityType = 2 and idReference = :idBusiness)
        and idBlacklistReason in (1, :idBlacklistReason);
          `;
    return this.db.fetchMany(query, {
      replacements: { idBusiness, idBlacklistReason }
    });
  }
}

export default Dao;
