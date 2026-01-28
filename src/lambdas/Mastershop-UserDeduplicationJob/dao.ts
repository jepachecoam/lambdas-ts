import Database from "../../shared/databases/db-sm/sequelize-sm";

class Dao {
  private connectoolDB: Database;
  private MSDB: Database;

  constructor(connectoolDB: Database, MSDB: Database) {
    this.connectoolDB = connectoolDB;
    this.MSDB = MSDB;
  }

  async getDuplicatesCredentials(): Promise<any> {
    const query = `
      WITH rawData AS (SELECT u.idExternal,
                              trim(REGEXP_REPLACE(ct.credentials ->> '$.urlApi', '^(https?://)', '')) as cleanUrlApi
                      FROM configurationTool ct
                                INNER JOIN user u ON ct.idUser = u.idUser and u.originPlatform = 'mastershop'
                      WHERE ct.credentials ->> '$.urlApi' IS NOT NULL
                        AND ct.credentials ->> '$.urlApi' != ''
                        and idTool in (1,42,20,24,54,63,67,70)),
          uniquePairs AS (SELECT DISTINCT cleanUrlApi,
                                          idExternal
                          FROM rawData)
      SELECT cleanUrlApi                            as id,
            'configurationTool-credentials.urlApi' as type,
            JSON_ARRAYAGG(idExternal)              as business
      FROM uniquePairs
      GROUP BY cleanUrlApi
      HAVING COUNT(idExternal) > 1;
    `;
    return this.connectoolDB.fetchMany(query);
  }

  async getDuplicatesBussinessConfigNotification(): Promise<any> {
    const query = `
      with baseData as (SELECT distinct ub.idUser,
                                        REGEXP_REPLACE(
                                                customTemplate ->> '$.whatsapp.params[0].replaceWith', '[^0-9]', ''
                                        ) as cleanPhone
                        FROM bussinessConfigNotification bcn
                                inner join userBussiness ub on bcn.idBussiness = ub.idBussiness and ub.relation = 'owner'
                        WHERE channel = 'WHATSAPP'
                          AND customTemplate ->> '$.whatsapp.params[0].replaceWith' IS NOT NULL),
          phones as (SELECT distinct idUser,
                            CASE
                                WHEN cleanPhone LIKE '593%' THEN SUBSTRING(cleanPhone, 4)
                                WHEN cleanPhone LIKE '591%' THEN SUBSTRING(cleanPhone, 4)
                                WHEN cleanPhone LIKE '595%' THEN SUBSTRING(cleanPhone, 4)
                                WHEN cleanPhone LIKE '598%' THEN SUBSTRING(cleanPhone, 4)
                                WHEN cleanPhone LIKE '52%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '54%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '55%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '56%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '57%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '58%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '51%' THEN SUBSTRING(cleanPhone, 3)
                                WHEN cleanPhone LIKE '1%' THEN SUBSTRING(cleanPhone, 2)
                                ELSE cleanPhone
                                END AS cleanWhatsapp
                      FROM baseData)
      SELECT cleanWhatsapp                       as id,
            'bussinessConfigNotification-phone' as type,
            JSON_ARRAYAGG(pn.idUser)            as users
      FROM phones pn
      where length(cleanWhatsapp) > 4
      GROUP BY pn.cleanWhatsapp
      HAVING COUNT(pn.idUser) > 1;
    `;
    return this.MSDB.fetchMany(query);
  }

  async getDuplicatesUserBeneficiaryPhone(): Promise<any> {
    const query = `
      WITH phones AS (SELECT DISTINCT ub.idUser, REGEXP_REPLACE(phone, '[^0-9]', '') as cleanPhone
                      FROM userBeneficiary ube
                              inner join userBussiness ub on ube.idBussiness = ub.idBussiness and ub.relation = 'owner'
                      WHERE beneficiaryType = 'fiscal'
                        AND phone IS NOT NULL
                        AND phone != ''),
          cleanPhones as (SELECT CASE
                                      WHEN cleanPhone LIKE '593%' THEN SUBSTRING(cleanPhone, 4)
                                      WHEN cleanPhone LIKE '591%' THEN SUBSTRING(cleanPhone, 4)
                                      WHEN cleanPhone LIKE '595%' THEN SUBSTRING(cleanPhone, 4)
                                      WHEN cleanPhone LIKE '598%' THEN SUBSTRING(cleanPhone, 4)

                                      WHEN cleanPhone LIKE '52%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '54%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '55%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '56%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '57%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '58%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '51%' THEN SUBSTRING(cleanPhone, 3)

                                      WHEN cleanPhone LIKE '1%' THEN SUBSTRING(cleanPhone, 2)

                                      ELSE cleanPhone
                                      END AS phone,
                                  idUser
                          from phones)
      SELECT cp.phone                   as id,
            'userBeneficiary-phone'    as type,
            JSON_ARRAYAGG(cp.idUser)   as users
      FROM cleanPhones cp
      where length(cp.phone) > 4
      GROUP BY cp.phone
      HAVING COUNT(cp.idUser) > 1;
    `;
    return this.MSDB.fetchMany(query);
  }

  async getDuplicatesUserBeneficiaryDocumentNumber(): Promise<any> {
    const query = `
      WITH documentNumbers AS (SELECT DISTINCT ub.idUser, REGEXP_REPLACE(documentNumber, '[^0-9]', '') as cleanDoc
                              FROM userBeneficiary ube
                                        inner join userBussiness ub
                                                  on ube.idBussiness = ub.idBussiness and ub.relation = 'owner'
                              WHERE beneficiaryType = 'fiscal'
                                AND documentNumber != '')
      SELECT cleanDoc                         as id,
            'userBeneficiary-documentNumber' as type,
            JSON_ARRAYAGG(dn.idUser)         as users
      FROM documentNumbers dn
      WHERE cleanDoc != ''
      GROUP BY cleanDoc
      HAVING COUNT(dn.idUser) > 1;
    `;
    return this.MSDB.fetchMany(query);
  }

  async getDuplicatesUserProfilingResponse(): Promise<any> {
    const query = `
      WITH phones AS (SELECT DISTINCT idUser,
                                      REGEXP_REPLACE(phoneNumber, '[^0-9]', '') as cleanPhone
                      FROM userProfilingResponse
                      WHERE phoneNumber IS NOT NULL
                        AND phoneNumber != ''
                        AND idUser IS NOT NULL),
          cleanPhones as (SELECT CASE
                                      WHEN cleanPhone LIKE '593%' THEN SUBSTRING(cleanPhone, 4)
                                      WHEN cleanPhone LIKE '591%' THEN SUBSTRING(cleanPhone, 4)
                                      WHEN cleanPhone LIKE '595%' THEN SUBSTRING(cleanPhone, 4)
                                      WHEN cleanPhone LIKE '598%' THEN SUBSTRING(cleanPhone, 4)

                                      WHEN cleanPhone LIKE '52%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '54%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '55%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '56%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '57%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '58%' THEN SUBSTRING(cleanPhone, 3)
                                      WHEN cleanPhone LIKE '51%' THEN SUBSTRING(cleanPhone, 3)

                                      WHEN cleanPhone LIKE '1%' THEN SUBSTRING(cleanPhone, 2)

                                      ELSE cleanPhone
                                      END AS phone,
                                  idUser
                          from phones)
      SELECT cp.phone                            as id,
            'userProfilingResponse-phoneNumber' as type,
            JSON_ARRAYAGG(cp.idUser)            as users
      FROM cleanPhones cp
      where length(cp.phone) > 4
      GROUP BY cp.phone
      HAVING COUNT(cp.idUser) > 1;
    `;
    return this.MSDB.fetchMany(query);
  }

  async getBusinessOwnersFromBusinessIds(businessIds: number[]): Promise<any> {
    const query = `
      SELECT idBussiness, idUser
      FROM userBussiness
      WHERE idBussiness IN (${businessIds.join(",")}) 
      AND relation = 'owner'
    `;
    const result = await this.MSDB.fetchMany(query);

    const businessToUsers: { [key: number]: number[] } = {};
    result?.forEach((row: any) => {
      if (!businessToUsers[row.idBussiness]) {
        businessToUsers[row.idBussiness] = [];
      }
      businessToUsers[row.idBussiness].push(row.idUser);
    });

    return businessToUsers;
  }
  async getUserClusters(userIds: number[]): Promise<any> {
    const query = `
      SELECT idUser, idUserCluster
      FROM userClusterMember
      WHERE idUser IN (${userIds.join(",")})
    `;
    const result = await this.MSDB.fetchMany(query);

    const userToClusters: { [key: number]: number | null } = {};
    userIds.forEach((userId) => {
      userToClusters[userId] = null;
    });

    result?.forEach((row: any) => {
      userToClusters[row.idUser] = row.idUserCluster;
    });

    return userToClusters;
  }

  async updateUserClusterMembers(
    userIds: number[],
    targetClusterId: number
  ): Promise<any> {
    if (userIds.length === 0) return;

    const query = `
      UPDATE userClusterMember
      SET idUserCluster = :targetClusterId,
          origin        = 'algorithm',
          updateAt      = now()
      WHERE idUser IN (${userIds.join(",")})
        and isLock = false;
    `;

    return this.MSDB.update(query, {
      replacements: { targetClusterId },
      logging: console.log
    });
  }
}

export default Dao;
