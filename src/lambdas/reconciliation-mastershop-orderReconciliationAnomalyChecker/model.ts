import { ICharge } from "../../shared/databases/models/charge";
import Dao from "./dao";
import ChargesFormula from "./formula";
import {
  ICustomChargeReconciliation,
  IdCarriers,
  operationTypeEnum,
  StatusCodeEnum
} from "./types";

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

    console.log("order =>>>", order);
    console.log("orderSource =>>>", orderSource);

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
          idStatus: StatusCodeEnum.ORDER_NOT_FOUND
        });
        return null;
      }

      const result = this.chargeReconciliation({
        idCarrier,
        orderData,
        carrierChargeAmount
      });

      console.log("result =>>>", result);

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
  }): ICustomChargeReconciliation {
    const { order } = orderData;

    if (!order.carrierInfo || !order.carrierInfo.profitMargin) {
      return {
        idStatus: StatusCodeEnum.MISSING_DATA,
        idOrder: order.idOrder,
        idOrderReturn: order.idOrderReturn
      };
    }

    const carrierFormulas: Record<number, any> = {
      [IdCarriers.TCC]: ChargesFormula.Tcc,
      [IdCarriers.ENVIA]: ChargesFormula.Envia,
      [IdCarriers.COORDINADORA]: ChargesFormula.Coordinadora,
      [IdCarriers.SWAYP]: ChargesFormula.Swayp,
      [IdCarriers.INTERRAPIDISIMO]: ChargesFormula.InterRapidisimo
    };

    const formula = carrierFormulas[idCarrier];

    if (!formula) {
      return {
        idStatus: StatusCodeEnum.UNEXPECTED_DATA,
        idOrder: order.idOrder,
        idOrderReturn: order.idOrderReturn
      };
    }

    return formula({ orderData, carrierChargeAmount });
  }
}

export default Model;
