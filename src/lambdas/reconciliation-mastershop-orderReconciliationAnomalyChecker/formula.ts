import {
  ICustomChargeReconciliation,
  ICustomPaymentReconciliation,
  StatusCodeEnum
} from "./types";
class ChargesFormula {
  static Tcc({
    orderData,
    carrierChargeAmount
  }: {
    orderData: any;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order } = orderData;

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

    const copToleranceForUnderCharge = -100;

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    if (result === 0) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (result < 0) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedResult === 0) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > 0) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else if (
        adjustedResult < 0 &&
        adjustedResult >= copToleranceForUnderCharge
      ) {
        idStatus = StatusCodeEnum.ACCEPTABLE_UNDERCHARGE;
        balanceResult = adjustedResult;
      } else if (adjustedResult < copToleranceForUnderCharge) {
        idStatus = StatusCodeEnum.UNDERCHARGED;
        balanceResult = result;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
        balanceResult = result;
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
    orderData: any;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order } = orderData;

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

    const copToleranceForUnderCharge = -100;

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    if (result === 0) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (result < 0) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedResult === 0) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > 0) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else if (
        adjustedResult < 0 &&
        adjustedResult >= copToleranceForUnderCharge
      ) {
        idStatus = StatusCodeEnum.ACCEPTABLE_UNDERCHARGE;
        balanceResult = adjustedResult;
      } else if (adjustedResult < copToleranceForUnderCharge) {
        idStatus = StatusCodeEnum.UNDERCHARGED;
        balanceResult = result;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
        balanceResult = result;
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
    orderData: any;
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

    const copToleranceForUnderCharge = -100;

    let idStatus: StatusCodeEnum;
    let balanceResult: number;

    if (result === 0) {
      idStatus = StatusCodeEnum.MATCHED;
      balanceResult = result;
    } else if (result < 0) {
      idStatus = StatusCodeEnum.UNDERCHARGED;
      balanceResult = result;
    } else {
      if (adjustedResult === 0) {
        idStatus = StatusCodeEnum.MATCHED;
        balanceResult = adjustedResult;
      } else if (adjustedResult > 0) {
        idStatus = StatusCodeEnum.OVERCHARGED;
        balanceResult = adjustedResult;
      } else if (
        adjustedResult < 0 &&
        adjustedResult >= copToleranceForUnderCharge
      ) {
        idStatus = StatusCodeEnum.ACCEPTABLE_UNDERCHARGE;
        balanceResult = adjustedResult;
      } else if (adjustedResult < copToleranceForUnderCharge) {
        idStatus = StatusCodeEnum.UNDERCHARGED;
        balanceResult = result;
      } else {
        idStatus = StatusCodeEnum.UNKNOWN;
        balanceResult = result;
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
    orderData: any;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order } = orderData;

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit = profitMargin - discount;

    const result = baseDifference - expectedProfit;

    let idStatus: StatusCodeEnum;

    if (result === 0) {
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
  static Swayp({
    orderData,
    carrierChargeAmount
  }: {
    orderData: any;
    carrierChargeAmount: number;
  }): ICustomChargeReconciliation {
    const { order } = orderData;

    const idOrder = order.idOrder;
    const idOrderReturn = order.idOrderReturn ?? undefined;
    const userChargeAmount = order.shippingRate;

    const profitMargin = order.carrierInfo.profitMargin;
    const discount = order.carrierInfo.discount ?? 0;

    const baseDifference = userChargeAmount - carrierChargeAmount;

    const expectedProfit = profitMargin - discount;

    const result = baseDifference - expectedProfit;

    let idStatus: StatusCodeEnum;

    if (result === 0) {
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
    orderData: any;
    receivedAmount: number;
  }): ICustomPaymentReconciliation {
    const { order } = orderData;

    const expectedAmount = order.totalSeller;
    const result = expectedAmount - receivedAmount;

    let idStatus: StatusCodeEnum;

    if (result === 0) {
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
