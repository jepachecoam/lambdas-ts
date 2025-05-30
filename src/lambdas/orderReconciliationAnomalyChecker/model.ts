import sharedDao from "./dao";
import dto from "./dto";

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
