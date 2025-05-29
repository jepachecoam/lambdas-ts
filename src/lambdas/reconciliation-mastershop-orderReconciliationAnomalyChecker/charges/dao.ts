import { QueryTypes } from "sequelize";

import db from "../database";

const checkIfChargeReconciliationAlreadyExist = async ({
  idCarrierCharge
}: any) => {
  try {
    const query = `
            select *
            from db_mastershop_reconciliation.chargeReconciliation
            where idCarrierCharge = :idCarrierCharge
        `;
    const result = await db.query(query, {
      replacements: {
        idCarrierCharge
      },
      type: QueryTypes.SELECT
    });
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching chargeReconciliation", error);
    throw error;
  }
};

const createChargeReconciliation = async ({
  idCarrierCharge,
  idChargeStatus,
  balanceResult
}: any) => {
  try {
    const query = `
            INSERT INTO db_mastershop_reconciliation.chargeReconciliation (idCarrierCharge, idChargeStatus, balanceResult)
            SELECT :idCarrierCharge, :idChargeStatus, :balanceResult
            WHERE NOT EXISTS (
                SELECT 1
                FROM db_mastershop_reconciliation.chargeReconciliation
                WHERE idCarrierCharge = :idCarrierCharge
            );
        `;

    const result = await db.query(query, {
      replacements: {
        idCarrierCharge,
        idChargeStatus,
        balanceResult
      },
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error creating chargeReconciliation", error);
    throw error;
  }
};

const updateChargeReconciliation = async ({
  idCarrierCharge,
  idChargeStatus,
  balanceResult
}: any) => {
  try {
    const query = `
            UPDATE db_mastershop_reconciliation.chargeReconciliation
            SET idChargeStatus = :idChargeStatus, balanceResult = :balanceResult, updatedAt = NOW()
            WHERE idCarrierCharge = :idCarrierCharge
            AND (idChargeStatus != :idChargeStatus OR balanceResult != :balanceResult);
        `;

    const result = await db.query(query, {
      replacements: {
        idCarrierCharge,
        idChargeStatus,
        balanceResult
      },
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error creating chargeReconciliation", error);
    throw error;
  }
};

const createCarrierChargeStatusLog = async ({
  idCarrierCharge,
  idChargeStatus,
  auditData
}: any) => {
  try {
    const query = `
            INSERT INTO db_mastershop_reconciliation.carrierChargeStatusLog (idCarrierCharge, idChargeStatus, auditData)
            SELECT :idCarrierCharge, :idChargeStatus, :auditData
            WHERE NOT EXISTS (
                SELECT 1
                FROM db_mastershop_reconciliation.carrierChargeStatusLog
                WHERE idCarrierCharge = :idCarrierCharge
                  AND createdAt = (
                      SELECT MAX(createdAt)
                      FROM db_mastershop_reconciliation.carrierChargeStatusLog
                      WHERE idCarrierCharge = :idCarrierCharge
                  )
                  AND idChargeStatus = :idChargeStatus
            );
        `;

    const result = await db.query(query, {
      replacements: {
        idCarrierCharge,
        idChargeStatus,
        auditData
      },
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error creating chargeReconciliationStatusLog", error);
    throw error;
  }
};

const upsertChargeReconciliation = async ({
  idCarrierCharge,
  idChargeStatus,
  balanceResult
}: any) => {
  try {
    const existingRecord = await checkIfChargeReconciliationAlreadyExist({
      idCarrierCharge
    });

    if (existingRecord) {
      return await updateChargeReconciliation({
        idCarrierCharge,
        idChargeStatus,
        balanceResult
      });
    } else {
      return await createChargeReconciliation({
        idCarrierCharge,
        idChargeStatus,
        balanceResult
      });
    }
  } catch (error) {
    console.error("Error upserting chargeReconciliation", error);
    throw error;
  }
};

export default {
  upsertChargeReconciliation,
  createCarrierChargeStatusLog
};
