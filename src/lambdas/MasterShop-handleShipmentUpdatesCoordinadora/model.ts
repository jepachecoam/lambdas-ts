import dao from "./dao";

const sendCarrierDataToUpdateOrder = async ({ carrierData }: any) => {
  try {
    const mergeData = {
      ...carrierData,
      forcedExecution: true,
      carrierName: "coordinadora",
      updateSource: "api_coordinadora"
    };

    console.log("mergeData =>>>", mergeData);

    return await dao.sendCarrierDataToUpdateOrder({ mergeData });
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default {
  sendCarrierDataToUpdateOrder
};
