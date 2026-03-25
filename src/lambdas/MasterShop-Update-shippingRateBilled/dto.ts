import { inputSchema, IProcessInput } from "./types";

const extractParams = (event: any): IProcessInput => {
  const detail = event.detail ?? event;

  const result = inputSchema.safeParse(detail);

  if (!result.success) {
    console.error("Invalid input:", result.error);
    throw new Error(`Invalid input: ${result.error.message}`);
  }

  const {
    id_order,
    order_logistics,
    order_transaction,
    carrierInfo,
    parameters
  } = result.data;

  return {
    idOrder: id_order,
    idCarrier: order_logistics.id_carrier,
    paymentMethod: order_transaction.payment_method,
    shippingRate0: order_logistics.shipping_rate,
    profitMargin: parseFloat(String(order_logistics.carrier_profit_margin)),
    collectionFee: carrierInfo.collectionFee,
    insuredValueReturn: carrierInfo.insuredValueReturn,
    orderStatus: carrierInfo.orderStatus,
    agreementType: carrierInfo.agreementType,
    stage: parameters.stage
  };
};

export default {
  extractParams
};
