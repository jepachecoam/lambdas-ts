import { QueryTypes } from "sequelize";

import db from "../database/config";

const getCarrierPaymentPendingToProcess = async () => {
  try {
    const query = `
            select *
            from db_mastershop_reconciliation.carrierPayment
            where idCarrierPayment not in (select idCarrierPayment
                                          from db_mastershop_reconciliation.paymentReconciliation
                                          where idPaymentStatus not in
                                                (select idPaymentStatus
                                                 from db_mastershop_reconciliation.paymentStatus
                                                 where statusParent != 'resolved'))
            `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });
    return result.length > 0 ? result : [];
  } catch (error) {
    console.error("Error fetching carrierPayments", error);
    throw error;
  }
};

const checkIfPaymentReconciliationAlreadyExist = async ({
  idCarrierPayment
}: any) => {
  try {
    const query = `
            select *
            from db_mastershop_reconciliation.paymentReconciliation
            where idCarrierPayment = :idCarrierPayment
        `;
    const result = await db.query(query, {
      replacements: {
        idCarrierPayment
      },
      type: QueryTypes.SELECT
    });
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching paymentReconciliation", error);
    throw error;
  }
};

const createPaymentReconciliation = async ({
  idCarrierPayment,
  idPaymentStatus,
  balanceResult
}: any) => {
  try {
    const query = `
            INSERT INTO db_mastershop_reconciliation.paymentReconciliation (idCarrierPayment, idPaymentStatus, balanceResult)
            SELECT :idCarrierPayment, :idPaymentStatus, :balanceResult
            WHERE NOT EXISTS (
                SELECT 1
                FROM db_mastershop_reconciliation.paymentReconciliation
                WHERE idCarrierPayment = :idCarrierPayment
            );
        `;

    const result = await db.query(query, {
      replacements: {
        idCarrierPayment,
        idPaymentStatus,
        balanceResult
      },
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error creating paymentReconciliation", error);
    throw error;
  }
};

const updatePaymentReconciliation = async ({
  idCarrierPayment,
  idPaymentStatus,
  balanceResult
}: any) => {
  try {
    const query = `
            UPDATE db_mastershop_reconciliation.paymentReconciliation
            SET idPaymentStatus = :idPaymentStatus, balanceResult = :balanceResult, updatedAt = NOW()
            WHERE idCarrierPayment = :idCarrierPayment
            AND (idPaymentStatus != :idPaymentStatus OR balanceResult != :balanceResult);
        `;

    const result = await db.query(query, {
      replacements: {
        idCarrierPayment,
        idPaymentStatus,
        balanceResult
      },
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error creating paymentReconciliation", error);
    throw error;
  }
};

const createPaymentStatusLog = async ({
  idCarrierPayment,
  idPaymentStatus,
  auditData
}: any) => {
  try {
    const query = `
            INSERT INTO db_mastershop_reconciliation.carrierPaymentStatusLog (idCarrierPayment, idPaymentStatus, auditData)
            SELECT :idCarrierPayment, :idPaymentStatus, :auditData
            WHERE NOT EXISTS (
                SELECT 1
                FROM db_mastershop_reconciliation.carrierPaymentStatusLog
                WHERE idCarrierPayment = :idCarrierPayment
                  AND createdAt = (
                      SELECT MAX(createdAt)
                      FROM db_mastershop_reconciliation.carrierPaymentStatusLog
                      WHERE idCarrierPayment = :idCarrierPayment
                  )
                  AND idPaymentStatus = :idPaymentStatus
            );
        `;

    const result = await db.query(query, {
      replacements: {
        idCarrierPayment,
        idPaymentStatus,
        auditData
      },
      type: QueryTypes.INSERT
    });

    return result[1] > 0;
  } catch (error) {
    console.error("Error creating paymentReconciliationStatusLog", error);
    throw error;
  }
};

const upsertPaymentReconciliation = async ({
  idCarrierPayment,
  idPaymentStatus,
  balanceResult
}: any) => {
  try {
    const existingRecord = await checkIfPaymentReconciliationAlreadyExist({
      idCarrierPayment
    });

    if (existingRecord) {
      return await updatePaymentReconciliation({
        idCarrierPayment,
        idPaymentStatus,
        balanceResult
      });
    } else {
      return await createPaymentReconciliation({
        idCarrierPayment,
        idPaymentStatus,
        balanceResult
      });
    }
  } catch (error) {
    console.error("Error upserting paymentReconciliation", error);
    throw error;
  }
};

export default {
  upsertPaymentReconciliation,
  createPaymentStatusLog,
  getCarrierPaymentPendingToProcess
};
