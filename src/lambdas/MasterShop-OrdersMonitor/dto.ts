const checkResponses = ({ ordersResponses, carrierName }: any) => {
  try {
    const result = [];

    for (const { data } of ordersResponses) {
      const { carrierData, trackingNumber, status, novelty, returnProcess } =
        data;

      if (
        !trackingNumber ||
        !status ||
        !status.statusCode ||
        !novelty ||
        !returnProcess ||
        !carrierData
      ) {
        console.log(
          `Invalid record: carrierName=${carrierName}, trackingCode=${trackingNumber}`
        );
        continue;
      }

      const validRecord = {
        trackingNumber: trackingNumber?.toString() || null,
        status: {
          statusCode: status?.statusCode?.toString() || null,
          statusName: status?.statusName?.toString() || null
        },
        novelty: {
          noveltyCode: novelty?.noveltyCode?.toString() || null,
          description: novelty?.description?.toString() || null,
          note: novelty?.note?.toString() || null
        },
        returnProcess: {
          returnTrackingNumber:
            returnProcess?.returnTrackingNumber?.toString() || null
        },
        carrierData,
        carrierName,
        updateSource: "cronjob"
      };

      result.push(validRecord);
    }

    return result;
  } catch (error) {
    console.error("Error processing response:", error);
  }
};

export default { checkResponses };
