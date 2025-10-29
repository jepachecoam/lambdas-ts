import {
  ICustomChargeReconciliation,
  ICustomPaymentReconciliation,
  IOrderData,
  OrderSourceEnum,
  PaymentMethodEnum,
  StatusCodeEnum
} from "./types";
class ChargesFormula {
  static Tcc({
    orderData,
    carrierChargeAmount
  }: {
    orderData: IOrderData;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order, orderSource } = orderData;

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;
    const collectionFee = order.carrierInfo.collectionFee ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit =
      orderSource === OrderSourceEnum.ORDER ? profitMargin - discount : 0;

    const result = baseDifference - expectedProfit;

    const adjustedResult = baseDifference - (expectedProfit + collectionFee);

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    const tolerance = 5;
    const resultInAcceptableTolerance = Math.abs(result) <= tolerance;
    const adjustedInAcceptableTolerance = Math.abs(adjustedResult) <= tolerance;

    if (resultInAcceptableTolerance) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (result < -tolerance) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedInAcceptableTolerance) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > tolerance) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else if (adjustedResult < -tolerance) {
        idStatus = StatusCodeEnum.ACCEPTABLE_UNDERCHARGE;
        balanceResult = adjustedResult;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
        balanceResult = adjustedResult;
      }
    }

    return {
      idStatus,
      idOrder,
      idOrderReturn,
      carrierChargeAmount,
      userChargeAmount,
      balanceResult: balanceResult
    };
  }
  static Envia({
    orderData,
    carrierChargeAmount
  }: {
    orderData: IOrderData;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order, orderSource } = orderData;

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;
    const collectionFee = order.carrierInfo.collectionFee ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit = profitMargin - discount;

    const result = baseDifference - expectedProfit;

    const adjustedResult = baseDifference - (expectedProfit + collectionFee);

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    const tolerance = 5;
    const resultInAcceptableTolerance = Math.abs(result) <= tolerance;
    const adjustedInAcceptableTolerance = Math.abs(adjustedResult) <= tolerance;

    if (resultInAcceptableTolerance) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (orderSource === OrderSourceEnum.ORDER_RETURN) {
      idStatus = StatusCodeEnum.NO_ACTION_REQUIRED;
      balanceResult = result;
    } else if (result < -tolerance) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedInAcceptableTolerance) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > tolerance) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else if (adjustedResult < -tolerance) {
        idStatus = StatusCodeEnum.ACCEPTABLE_UNDERCHARGE;
        balanceResult = adjustedResult;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
        balanceResult = adjustedResult;
      }
    }

    return {
      idStatus,
      idOrder,
      idOrderReturn,
      carrierChargeAmount,
      userChargeAmount,
      balanceResult: balanceResult
    };
  }
  static Coordinadora({
    orderData,
    carrierChargeAmount
  }: {
    orderData: IOrderData;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order } = orderData;

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;
    const collectionFee = order.carrierInfo.collectionFee ?? 0;
    const insuredValueReturn =
      order.carrierInfo.extraData?.insuredValueReturn ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit = profitMargin - discount + insuredValueReturn;

    const result = baseDifference - expectedProfit;

    const adjustedResult = baseDifference - (expectedProfit + collectionFee);

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    const tolerance = 5;
    const resultInAcceptableTolerance = Math.abs(result) <= tolerance;
    const adjustedInAcceptableTolerance = Math.abs(adjustedResult) <= tolerance;

    if (resultInAcceptableTolerance) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (result < -tolerance) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedInAcceptableTolerance) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > tolerance) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else if (adjustedResult < -tolerance) {
        idStatus = StatusCodeEnum.ACCEPTABLE_UNDERCHARGE;
        balanceResult = adjustedResult;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
        balanceResult = adjustedResult;
      }
    }

    return {
      idStatus,
      idOrder,
      idOrderReturn,
      carrierChargeAmount,
      userChargeAmount,
      balanceResult: balanceResult
    };
  }
  static InterRapidisimo({
    orderData,
    carrierChargeAmount
  }: {
    orderData: IOrderData;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order, orderSource } = orderData;

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit =
      orderSource === OrderSourceEnum.ORDER ? profitMargin - discount : 0;

    const result = baseDifference - expectedProfit;

    const gmf =
      order.paymentMethod === PaymentMethodEnum.COD
        ? 0.004 * order.totalSeller
        : 0;
    const adjustedResult = baseDifference - (expectedProfit + gmf);

    const tolerance = 5;

    const resultInAcceptableTolerance = Math.abs(result) <= tolerance;
    const adjustedInAcceptableTolerance = Math.abs(adjustedResult) <= tolerance;

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    if (resultInAcceptableTolerance) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (result < -tolerance) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedInAcceptableTolerance) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > tolerance) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else {
        idStatus = StatusCodeEnum.UNDERCHARGED;
        balanceResult = adjustedResult;
      }
    }

    return {
      idStatus,
      idOrder,
      idOrderReturn,
      carrierChargeAmount,
      userChargeAmount,
      balanceResult
    };
  }

  static Swayp({
    orderData,
    carrierChargeAmount
  }: {
    orderData: IOrderData;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order, orderSource } = orderData;

    if (orderSource === OrderSourceEnum.ORDER_RETURN) {
      return { idStatus: StatusCodeEnum.NO_ACTION_REQUIRED };
    }

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit = profitMargin - discount;

    const result = baseDifference - expectedProfit;

    let idStatus: StatusCodeEnum;

    const tolerance = 5;

    const resultInAcceptableTolerance = Math.abs(result) <= tolerance;

    if (resultInAcceptableTolerance) {
      idStatus = StatusCodeEnum.MATCHED;
    } else if (result < 0) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
    } else {
      idStatus = StatusCodeEnum.OVERCHARGED;
    }

    return {
      idStatus,
      idOrder,
      idOrderReturn,
      carrierChargeAmount,
      userChargeAmount,
      balanceResult: result
    };
  }
}

class PaymentsFormula {
  static base({
    orderData,
    receivedAmount
  }: {
    orderData: IOrderData;
    receivedAmount: number;
  }): ICustomPaymentReconciliation {
    const { order } = orderData;

    const expectedAmount = order.totalSeller;
    const result = receivedAmount - expectedAmount;

    let idStatus: StatusCodeEnum;

    const tolerance = 5;

    const resultInAcceptableTolerance = Math.abs(result) <= tolerance;

    if (resultInAcceptableTolerance) {
      idStatus = StatusCodeEnum.MATCHED;
    } else if (result < 0) {
      idStatus = StatusCodeEnum.UNDERPAID;
    } else {
      idStatus = StatusCodeEnum.OVERPAID;
    }

    return {
      idStatus,
      idOrder: order.idOrder,
      idOrderReturn: order.idOrderReturn,
      expectedAmount,
      receivedAmount,
      balanceResult: result
    };
  }
}

export { ChargesFormula, PaymentsFormula };
