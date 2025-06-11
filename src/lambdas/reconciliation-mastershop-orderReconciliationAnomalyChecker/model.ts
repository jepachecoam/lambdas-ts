import { ICharge } from "../../shared/databases/models/charge";
import { IPayment } from "../../shared/databases/models/payment";
import Dao from "./dao";
import { ChargesFormula, PaymentsFormula } from "./formula";
import {
  ICustomChargeReconciliation,
  ICustomPaymentReconciliation,
  IdCarriers,
  IOrderData,
  operationTypeEnum,
  OrderSourceEnum,
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
        case operationTypeEnum.PAYMENTS:
          await this.processPayment({ payment: record });
          break;
        default:
          console.error("Unknown operation type:", record.operationType);
          break;
      }
    }
  }

  async getOrderData({ carrierTrackingCode }: { carrierTrackingCode: string }) {
    let orderSource: OrderSourceEnum = OrderSourceEnum.ORDER;
    let order = await this.dao.getOrder({ carrierTrackingCode });

    if (!order) {
      order = await this.dao.getOrderReturn({ carrierTrackingCode });
      orderSource = OrderSourceEnum.ORDER_RETURN;
    }

    if (order) {
      console.log("order =>>>", order);
      console.log("orderSource =>>>", orderSource);
      return { order, orderSource };
    }

    return null;
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
    orderData: IOrderData;
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
      console.error("Unknown carrier id:", idCarrier);
      return {
        idStatus: StatusCodeEnum.UNEXPECTED_DATA,
        idOrder: order.idOrder,
        idOrderReturn: order.idOrderReturn
      };
    }

    return formula({ orderData, carrierChargeAmount });
  }

  async processPayment({ payment }: { payment: IPayment }) {
    const { idPayment, carrierTrackingCode, amount } = payment;

    const orderData = await this.getOrderData({ carrierTrackingCode });
    if (!orderData) {
      console.error(`Order not found for idPayment: ${idPayment}`);
      await this.dao.upsertPaymentReconciliation({
        idPayment,
        idStatus: StatusCodeEnum.ORDER_NOT_FOUND
      });
      return null;
    }

    const result = this.paymentReconciliation({
      orderData,
      receivedAmount: amount
    });

    await this.dao.upsertPaymentReconciliation({
      idPayment,
      ...result
    });
  }

  paymentReconciliation({
    orderData,
    receivedAmount
  }: {
    orderData: any;
    receivedAmount: number;
  }): ICustomPaymentReconciliation {
    const { order } = orderData;

    if (!order.totalSeller) {
      return {
        idStatus: StatusCodeEnum.MISSING_DATA,
        idOrder: order.idOrder,
        idOrderReturn: order.idOrderReturn
      };
    }

    return PaymentsFormula.base({
      orderData,
      receivedAmount
    });
  }
}

export default Model;
