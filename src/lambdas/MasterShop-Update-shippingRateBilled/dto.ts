import { IProcessInput } from "./types";

const extractParams = (event: any) => {
  const mockData: IProcessInput = {
    idCarrier: 6,
    idOrder: 32,
    orderStatus: "returned",
    paymentMethod: "cod",
    agreementType: "carrierReturnShield",
    billingFactors: {
      profitMargin: 1,
      shippingRate: 1,
      collectionFee: 5000,
      insuredValueReturn: 1
    }
  };
  return {
    data: mockData,
    environment: "dev"
  };
};

export default {
  extractParams
};
