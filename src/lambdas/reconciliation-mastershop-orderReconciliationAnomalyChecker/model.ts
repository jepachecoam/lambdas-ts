import { ICharge } from "../../shared/databases/models/charge";
import Dao from "./dao";
import { getCarrierConf, StatusCodeEnum } from "./types";

const dao = new Dao("dev");

const processRecords = async (records: any[]) => {
  for (const record of records) {
    console.log("processing record =>>>", JSON.stringify(record, null, 2));

    switch (record.operationType) {
      case "CHARGES":
        await processCharge({ charge: record });
        break;
      default:
        console.error("Unknown operation type:", record.operationType);
        break;
    }
  }
};

const processCharge = async ({ charge }: { charge: ICharge }) => {
  try {
    const { idCharge, carrierTrackingCode, totalCharge, idCarrier } = charge;
    const carrierConf = getCarrierConf(idCarrier);
    if (!carrierConf) {
      console.error(`Carrier config not found for idCarrier: ${idCarrier}`);
      return null;
    }

    const order: any = await getOrderData({ carrierTrackingCode });
    if (!order) {
      await handleOrderNotFound({ idCharge, totalCharge });
      return null;
    }

    const result = reconciliation({
      order,
      totalCharge,
      carrierConf
    });

    await dao.upsertChargeReconciliation({
      idCharge,
      ...result
    });
  } catch (error) {
    console.error("Error processing carrier charge:", error);
    const { totalCharge, idCharge } = charge;
    await dao.upsertChargeReconciliation({
      idCharge: idCharge,
      balanceResult: -totalCharge,
      idStatus: StatusCodeEnum.ERROR,
      carrierChargeAmount: totalCharge
    });
  }
};

const getOrderData = async ({ carrierTrackingCode }: any) => {
  let order = await dao.getOrderReturn({
    carrierTrackingCode
  });
  if (!order) {
    order = await dao.getOrder({
      carrierTrackingCode
    });
  }
  return order;
};

const handleOrderNotFound = async ({
  idCharge,
  totalCharge
}: {
  idCharge: number;
  totalCharge: number;
}) => {
  console.error(`Order not found for idCharge: ${idCharge}`);
  const upsertResult = await dao.upsertChargeReconciliation({
    idCharge,
    idStatus: StatusCodeEnum.ORDER_NOT_FOUND,
    carrierChargeAmount: totalCharge,
    balanceResult: -totalCharge
  });

  if (!upsertResult) {
    console.error(
      `chargeReconciliation not processed for idCharge: ${idCharge}`
    );
    return null;
  }
};

const reconciliation = ({ order, totalCharge }: any) => {
  const profitMargin = Number(order?.profitMargin || 0);
  const idStatus = determineChargeStatus({
    profitMargin,
    balanceResult: Number(totalCharge),
    copToleranceForOverCharge: 700
  });
  const shippingRate = Number(order?.shippingRate || 0);
  const balanceResult = Number(totalCharge) - Number(shippingRate);

  return {
    idStatus,
    carrierChargeAmount: Number(totalCharge),
    balanceResult
  };
};

const determineChargeStatus = ({
  profitMargin,
  copToleranceForOverCharge,
  balanceResult
}: any) => {
  if (balanceResult === profitMargin) {
    return StatusCodeEnum.MATCHED;
  }
  if (
    balanceResult > profitMargin &&
    balanceResult <= profitMargin + copToleranceForOverCharge
  ) {
    return StatusCodeEnum.ACCEPTABLE_WITHIN_TOLERANCE;
  }
  if (balanceResult > profitMargin + copToleranceForOverCharge) {
    return StatusCodeEnum.OVERCHARGED;
  }
  if (balanceResult < profitMargin) {
    return StatusCodeEnum.UNDERCHARGED;
  }
  return StatusCodeEnum.UNKNOWN;
};

export default {
  processRecords
};
