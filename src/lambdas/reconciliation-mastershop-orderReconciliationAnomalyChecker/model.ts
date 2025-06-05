import { ICharge } from "../../shared/databases/models/charge";
import Dao from "./dao";
import { getCarrierConf, operationTypeEnum, StatusCodeEnum } from "./types";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }
  async processRecords(records: any[]) {
    for (const record of records) {
      console.log("processing record =>>>", JSON.stringify(record, null, 2));

      switch (record.operationType) {
        case operationTypeEnum.CHARGES:
          await this.processCharge({ charge: record });
          break;
        default:
          console.error("Unknown operation type:", record.operationType);
          break;
      }
    }
  }

  async getOrderData({ carrierTrackingCode }: { carrierTrackingCode: string }) {
    let order: any = null;
    let orderSource: string | null = null;

    const orderReturn = await this.dao.getOrderReturn({ carrierTrackingCode });
    if (orderReturn) {
      order = orderReturn;
      orderSource = "orderReturn";
    }
    if (!order) {
      order = await this.dao.getOrder({ carrierTrackingCode });
      orderSource = "order";
    }

    if (!order) {
      return null;
    }

    return { order, orderSource };
  }

  async processCharge({ charge }: { charge: ICharge }) {
    try {
      const {
        idCharge,
        carrierTrackingCode,
        totalCharge: carrierChargeAmount,
        idCarrier
      } = charge;

      const orderData = await this.getOrderData({ carrierTrackingCode });
      if (!orderData) {
        console.error(`Order not found for idCharge: ${idCharge}`);
        await this.dao.upsertChargeReconciliation({
          idCharge,
          idStatus: StatusCodeEnum.ORDER_NOT_FOUND,
          carrierChargeAmount: carrierChargeAmount,
          balanceResult: -carrierChargeAmount
        });
        return null;
      }

      const result = this.chargeReconciliation({
        idCarrier,
        orderData,
        carrierChargeAmount
      });

      await this.dao.upsertChargeReconciliation({
        idCharge,
        ...result
      });
    } catch (error) {
      console.error("Error processing carrier charge:", error);
      const { totalCharge: carrierChargeAmount, idCharge } = charge;
      await this.dao.upsertChargeReconciliation({
        idCharge: idCharge,
        idStatus: StatusCodeEnum.ERROR,
        carrierChargeAmount: carrierChargeAmount,
        balanceResult: -carrierChargeAmount
      });
    }
  }
  chargeReconciliation({
    idCarrier,
    orderData,
    carrierChargeAmount
  }: {
    idCarrier: number;
    orderData: any;
    carrierChargeAmount: number;
  }) {
    const order = orderData.order;
    const idOrder = order.idOrder;
    const idOrderReturn = orderData.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    if (!order.carrierInfo || !order.carrierInfo.profitMargin) {
      return {
        idStatus: StatusCodeEnum.MISSING_DATA,
        idOrder,
        idOrderReturn,
        carrierChargeAmount,
        userChargeAmount,
        balanceResult: -carrierChargeAmount
      };
    }

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;
    const collectionFee = order.carrierInfo.collectionFee ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit = profitMargin - discount;

    const result = baseDifference - expectedProfit;

    const adjustedResult = result + collectionFee;

    const tolerance =
      getCarrierConf(idCarrier)?.copToleranceForOverCharge ?? 100;

    let idStatus: StatusCodeEnum;

    if (result === 0) {
      idStatus = StatusCodeEnum.MATCHED;
    } else if (result < 0) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
    } else {
      if (adjustedResult === 0) {
        idStatus = StatusCodeEnum.MATCHED;
      } else if (adjustedResult > 0) {
        idStatus = StatusCodeEnum.OVERCHARGED;
      } else if (adjustedResult < 0 && adjustedResult >= -tolerance) {
        idStatus = StatusCodeEnum.ACCEPTABLE_OVERCHARGE;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
      }
    }

    const response = {
      idStatus,
      idOrder,
      idOrderReturn,
      carrierChargeAmount,
      userChargeAmount,
      specialAdjustment: collectionFee,
      balanceResult: adjustedResult
    };

    console.log("response =>>>", JSON.stringify(response, null, 2));

    return response;
  }
}

export default Model;
