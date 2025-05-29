import chargesModel from "./charges/model";
import sharedDao from "./dao";
import paymentsModel from "./payments/model";

const processRecords = async (records: any[]) => {
  for (const record of records) {
    console.log("processing record =>>>", JSON.stringify(record, null, 2));

    switch (record.operationType) {
      case "CHARGES":
        await chargesModel.processCarrierCharge({ carrierCharge: record });
        break;
      case "PAYMENTS":
        await paymentsModel.processCarrierPayment({ carrierPayment: record });
        break;
      default:
        break;
    }
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

export default {
  getOrder,
  processRecords
};
