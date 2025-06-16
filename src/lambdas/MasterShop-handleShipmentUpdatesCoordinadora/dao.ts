import axios from "axios";

const sendCarrierDataToUpdateOrder = async ({ mergeData }: any) => {
  try {
    const result = await axios.post(
      `${process.env["URL_API_UPDATE_ORDER"]}/b2b/api/UpdateOrder`,
      mergeData,
      {
        headers: {
          "x-api-key": `${process.env["API_KEY_MS"]}`,
          "x-app-name": `${process.env["APP_NAME_MS"]}`
        }
      }
    );
    console.log("mergeData sended =>>>", mergeData);
    return result.data;
  } catch (error) {
    console.error("Error in sendCarrierDataToUpdateOrder dao =>>>", error);
    throw error;
  }
};

export default {
  sendCarrierDataToUpdateOrder
};
