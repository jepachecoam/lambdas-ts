import sharedDao from "../dao/sharedDao";
import dto from "../dto/sharedDto";

const parseEvent = ({ event }: any) => {
  return dto.parseEvent({ event });
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
  parseEvent,
  getOrder
};
