import { QueryTypes, Sequelize } from "sequelize";

import getDatabaseInstance from "../../shared/databases/sequelize";

class Dao {
  private db: Sequelize;
  constructor(environment: "dev" | "prod") {
    this.db = getDatabaseInstance(environment);
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
    const result = await this.db.query(query, {
      replacements: { idUser },
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
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
    const result = await this.db.query(query, {
      replacements: { idUser },
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
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
    const result = await this.db.query(query, {
      replacements: { idUser },
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
  }

  async getEmails({ idUser }: { idUser: number }) {
    const query = `
          select u.email
          from user u
          where idUser = :idUser;
          `;
    const result = await this.db.query(query, {
      replacements: { idUser },
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
  }

  async getIdsBlacklistByReference({ idBusiness }: { idBusiness: number }) {
    const query = `
      select idBlacklist
      from blacklist
      where idBlacklistReference in
            (select idBlacklistReference from blacklistReference where idBlacklistEntityType = 2 and idReference = :idBusiness)
        and idBlacklistReason = 1
          `;
    const result = await this.db.query(query, {
      replacements: { idBusiness },
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
  }
}

export default Dao;
