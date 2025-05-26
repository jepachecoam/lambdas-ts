import sharedDao from "../dao";
import chargeDao from "./dao";
import chargeUtils from "./types";

const processCharges = async () => {
  try {
    const carrierCharges = await chargeDao.getCarrierChargePendingToProcess();

    const chargePromises = carrierCharges.map((carrierCharge: any) =>
      processCarrierCharge({ carrierCharge })
    );
    await Promise.all(chargePromises);
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

const processCarrierCharge = async ({ carrierCharge }: any) => {
  try {
    const { carrierTrackingCode, idCarrierCharge, totalCharge } = carrierCharge;

    const order = await getOrder({ carrierTrackingCode });
    if (!order) {
      await handleOrderNotFound({ idCarrierCharge, totalCharge });
      return null;
    }

    const balanceResult = calculateBalance({ order, totalCharge });

    await handleReconciliationCases({ idCarrierCharge, balanceResult, order });
  } catch (error) {
    console.error("Error processing carrier charge:", error);
    throw error;
  }
};

const getOrder = async ({ carrierTrackingCode }: any) => {
  try {
    let order = await sharedDao.getOrderByCarrierTrackingCode({
      carrierTrackingCode
    });
    if (!order) {
      order = await sharedDao.getOrderReturnByCarrierTrackingCode({
        carrierTrackingCode
      });
    }
    return order;
  } catch (error) {
    console.error(
      `Error fetching order for carrierTrackingCode: ${carrierTrackingCode}`,
      error
    );
    throw error;
  }
};

const handleOrderNotFound = async ({ idCarrierCharge, totalCharge }: any) => {
  console.error(`Order not found for idCarrierCharge: ${idCarrierCharge}`);
  const upsertResult = await chargeDao.upsertChargeReconciliation({
    idCarrierCharge,
    idChargeStatus: chargeUtils.ChargeStatus.ORDER_NOT_FOUND,
    balanceResult: -totalCharge
  });

  if (!upsertResult) {
    console.error(
      `chargeReconciliation not processed for idCarrierCharge: ${idCarrierCharge}`
    );
    return null;
  }

  const chargeStatusLog = await chargeDao.createCarrierChargeStatusLog({
    idCarrierCharge,
    idChargeStatus: chargeUtils.ChargeStatus.ORDER_NOT_FOUND,
    auditData: JSON.stringify({ totalCharge })
  });

  if (!chargeStatusLog) {
    console.error(
      `chargeStatusLog not processed for idCarrierCharge: ${idCarrierCharge}`
    );
    return null;
  }
};

const calculateBalance = ({ order, totalCharge }: any) => {
  const shippingRate = Number(order?.shippingRate || 0);
  return Number(totalCharge) - Number(shippingRate);
};

const handleReconciliationCases = async ({
  idCarrierCharge,
  balanceResult,
  order
}: any) => {
  try {
    const profitMargin = Number(order?.carrierInfo?.profitMargin);

    const copToleranceForOverCharge =
      chargeUtils.constants.copToleranceForOverCharge;

    const idChargeStatus = determineChargeStatus({
      profitMargin,
      copToleranceForOverCharge,
      balanceResult
    });

    const upsertResult = await chargeDao.upsertChargeReconciliation({
      idCarrierCharge,
      idChargeStatus,
      balanceResult
    });

    if (!upsertResult) {
      console.error(
        `upsert not processed for idCarrierCharge: ${idCarrierCharge}`
      );
      return null;
    }

    const chargeStatusLog = await chargeDao.createCarrierChargeStatusLog({
      idCarrierCharge,
      idChargeStatus,
      auditData: JSON.stringify({ copToleranceForOverCharge, balanceResult })
    });
    if (!chargeStatusLog) {
      console.error(
        `chargeStatusLog not processed for idCarrierCharge: ${idCarrierCharge}`
      );
      return null;
    }
  } catch (error) {
    console.error("Error handling reconciliation cases:", error);
    throw error;
  }
};

const determineChargeStatus = ({
  profitMargin,
  copToleranceForOverCharge,
  balanceResult
}: any) => {
  if (balanceResult === profitMargin) {
    return chargeUtils.ChargeStatus.MATCHED;
  }
  if (
    balanceResult > profitMargin &&
    balanceResult <= profitMargin + copToleranceForOverCharge
  ) {
    return chargeUtils.ChargeStatus.ACCEPTABLE_WITHIN_TOLERANCE;
  }
  if (balanceResult > profitMargin + copToleranceForOverCharge) {
    return chargeUtils.ChargeStatus.OVERCHARGED_ORDER;
  }
  if (balanceResult < profitMargin) {
    return chargeUtils.ChargeStatus.UNDERCHARGED_ORDER;
  }
  if (!profitMargin) {
    return chargeUtils.ChargeStatus.PROFIT_MARGIN_NOT_FOUND;
  }
  return chargeUtils.ChargeStatus.UNKNOWN;
};

export default {
  processCharges
};
