import sharedModel from "../model";
import paymentDao from "./dao";
import paymentUtils from "./types";

const processPayments = async () => {
  try {
    const carrierPayments =
      await paymentDao.getCarrierPaymentPendingToProcess();

    const paymentPromises = carrierPayments.map((carrierPayment: any) =>
      processCarrierPayment({ carrierPayment })
    );
    await Promise.all(paymentPromises);
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

const processCarrierPayment = async ({ carrierPayment }: any) => {
  try {
    const {
      carrierTrackingCode,
      idCarrierPayment,
      amount: paidAmount
    } = carrierPayment;

    const order = await sharedModel.getOrder({ carrierTrackingCode });
    if (!order) {
      await handleOrderNotFound({ idCarrierPayment, paidAmount });
      return null;
    }

    const balanceResult = calculateBalance({ order, paidAmount });

    await handlePaymentReconciliationCases({
      idCarrierPayment,
      balanceResult,
      _order: order
    });
  } catch (error) {
    console.error("Error processing carrier payment:", error);
    throw error;
  }
};

const handleOrderNotFound = async ({ idCarrierPayment, paidAmount }: any) => {
  console.error(`Order not found for idCarrierPayment: ${idCarrierPayment}`);
  const upsertResult = await paymentDao.upsertPaymentReconciliation({
    idCarrierPayment,
    idPaymentStatus: paymentUtils.PaymentStatus.ORDER_NOT_FOUND,
    balanceResult: paidAmount
  });

  if (!upsertResult) {
    console.error(
      `upsert not processed for idCarrierPayment: ${idCarrierPayment}`
    );
    return null;
  }

  const paymentStatusLog = await paymentDao.createPaymentStatusLog({
    idCarrierPayment,
    idPaymentStatus: paymentUtils.PaymentStatus.ORDER_NOT_FOUND,
    auditData: JSON.stringify({ paidAmount })
  });
  if (!paymentStatusLog) {
    console.error(
      `paymentStatusLog not processed for idCarrierPayment: ${idCarrierPayment}`
    );
    return null;
  }
};

const calculateBalance = ({ order, paidAmount }: any) => {
  const totalSeller = Number(order?.totalSeller);
  return Number(paidAmount) - Number(totalSeller);
};

const handlePaymentReconciliationCases = async ({
  idCarrierPayment,
  balanceResult,
  _order
}: any) => {
  try {
    const copToleranceForDifference =
      paymentUtils.constants.copToleranceForDifference;

    const idPaymentStatus = determinePaymentStatus({
      copToleranceForDifference,
      balanceResult
    });

    const upsertResult = await paymentDao.upsertPaymentReconciliation({
      idCarrierPayment,
      idPaymentStatus,
      balanceResult
    });

    if (!upsertResult) {
      console.error(
        `upsert not processed for idCarrierPayment: ${idCarrierPayment}`
      );
      return null;
    }

    const paymentStatusLog = await paymentDao.createPaymentStatusLog({
      idCarrierPayment,
      idPaymentStatus,
      auditData: JSON.stringify({ copToleranceForDifference, balanceResult })
    });
    if (!paymentStatusLog) {
      console.error(
        `paymentStatusLog not processed for idCarrierPayment: ${idCarrierPayment}`
      );
      return null;
    }
  } catch (error) {
    console.error("Error handling reconciliation cases:", error);
    throw error;
  }
};

const determinePaymentStatus = ({
  copToleranceForDifference,
  balanceResult
}: any) => {
  if (balanceResult === 0) {
    return paymentUtils.PaymentStatus.MATCHED;
  }
  if (balanceResult > 0 && balanceResult <= copToleranceForDifference) {
    return paymentUtils.PaymentStatus.ACCEPTABLE_WITHIN_TOLERANCE;
  }

  if (
    balanceResult < 0 &&
    Math.abs(balanceResult) <= copToleranceForDifference
  ) {
    return paymentUtils.PaymentStatus.ACCEPTABLE_WITHIN_TOLERANCE;
  }

  if (balanceResult > copToleranceForDifference) {
    return paymentUtils.PaymentStatus.OVERCHARGED_ORDER;
  }

  if (balanceResult < 0) {
    return paymentUtils.PaymentStatus.UNDERCHARGED_ORDER;
  }
  return paymentUtils.PaymentStatus.UNKNOWN;
};

export default {
  processPayments
};
