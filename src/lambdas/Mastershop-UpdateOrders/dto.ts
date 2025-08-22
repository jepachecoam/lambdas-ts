import utils from "./utils";

const searchNewStatus = ({
  carrierTrackingCode,
  carrierStatus,
  shipmentUpdate,
  statusCode,
  noveltyCode
}: any) => {
  const result: any = {
    idCarrierStatusUpdate: null,
    idShipmentUpdate: null,
    idStatus: null,
    statusName: null
  };

  if (carrierStatus.length === 0 || shipmentUpdate.length === 0) {
    result.notFoundCode = "not found carrierStatus or shipmentUpdate valid";
    return result;
  }

  const carrierStatusMatch = carrierStatus.find(
    (status: any) => String(status.carrierCode) === String(statusCode)
  );

  if (carrierStatusMatch) {
    if (!carrierStatusMatch.isActive) {
      console.log(
        `skip guide ${carrierTrackingCode} because have inactive idCarrierStatusUpdate ${carrierStatusMatch.idCarrierStatusUpdate} `
      );
      result.haveInactiveRule = true;
    }
    if (carrierStatusMatch.requiresAdditionalSteps) {
      result.requiresAdditionalSteps = true;
    }
    result.idCarrierStatusUpdate = carrierStatusMatch.idCarrierStatusUpdate;
    result.idStatus = carrierStatusMatch.idStatus;
    result.statusName = carrierStatusMatch.statusName;
  } else {
    console.log(
      `skip guide ${carrierTrackingCode} because not found carrierStatus with code ${statusCode}`
    );
    result.notFoundCode = `not found carrierStatus with code ${statusCode}`;
    return result;
  }

  const carrierNoveltyCodes = carrierStatus
    .filter((e: any) => e.statusAuxLabel === "CON-NOVEDAD")
    .map((e: any) => e.carrierCode);

  const isStatusCodePresent = carrierNoveltyCodes.some(
    (item: any) => String(item) === String(statusCode)
  );

  if (carrierStatusMatch && isStatusCodePresent) {
    result.idStatus = 6;
    result.statusName = "En tránsito";

    const shipmentUpdateMatch = shipmentUpdate.find(
      (update: any) =>
        update.codeCarrierShipmentUpdate.toString() === noveltyCode?.toString()
    );

    if (shipmentUpdateMatch) {
      if (!shipmentUpdateMatch.isActive) {
        console.log(
          `skip guide ${carrierTrackingCode} because have inactive shipmentUpdate ${shipmentUpdateMatch.idShipmentUpdate} `
        );
        result.haveInactiveRule = true;
      }
      if (shipmentUpdateMatch.requiresAdditionalSteps) {
        result.requiresAdditionalSteps = true;
      }
      result.idShipmentUpdate = shipmentUpdateMatch.idShipmentUpdate;
    } else {
      result.idShipmentUpdate = 505;
    }
  }

  return result;
};

const getShippingRate = ({ carrierName, orderData }: any) => {
  try {
    const { shippingRate, paymentMethod, totalSeller, carrierInfo } = orderData;
    console.log("orderData =>>>", orderData);

    switch (carrierName.toUpperCase()) {
      case "COORDINADORA":
        if (paymentMethod && paymentMethod.toUpperCase() === "COD") {
          if (
            carrierInfo &&
            typeof carrierInfo === "object" &&
            "extraData" in carrierInfo
          ) {
            return 0;
          }
          const extraCharge =
            totalSeller < 180000 ? 3600 * 1.19 : totalSeller * 0.02 * 1.19;
          return shippingRate - extraCharge;
        } else {
          return shippingRate;
        }
      case "TCC":
        return 0;

      case "SWAYP":
        return 0;

      case "ENVIA":
        return 0;

      case "INTERRAPIDISIMO":
        return 0;

      default:
        throw new Error("GetShipping rate not found");
    }
  } catch (err) {
    console.error("Error calculating shipping rate:", err);
    throw err;
  }
};

const parseRecords = ({ records }: any) => {
  const validRecords: any = [];
  const invalidRecords: any = [];

  const carrierMap: any = {
    TCC: 4,
    DOMINA: 5,
    COORDINADORA: 6,
    ENVIA: 7,
    SWAYP: 8,
    INTERRAPIDISIMO: 9
  };

  records.forEach((record: any) => {
    try {
      console.log("record =>>>", record);

      if (!utils.validateRecordSchema(record)) {
        invalidRecords.push(record);
        return;
      }

      const carrierName = String(record["carrierName"]).toUpperCase();

      const idCarrier: any = carrierMap[carrierName];
      if (!idCarrier) {
        invalidRecords.push(record);
        return;
      }

      validRecords.push({ idCarrier, ...record });
    } catch {
      invalidRecords.push(record);
    }
  });

  return { validRecords, invalidRecords };
};

const getOnlyTrackingNumbers = ({ validRecords }: any) => {
  return validRecords.map((record: any) => record.trackingNumber);
};

const getTrackingNumbersNotInReturnTable = ({
  allTrackingNumbers,
  returnRecords
}: any) => {
  const trackingNumbersToExclude = returnRecords.map((record: any) =>
    String(record.carrierTrackingCode)
  );
  return allTrackingNumbers.filter((trackingNumber: any) => {
    const trackingString = String(trackingNumber);
    return !trackingNumbersToExclude.includes(trackingString);
  });
};

const getRecordsToProcess = async ({
  validRecords,
  returnRecords,
  orderRecords
}: any) => {
  const findOrderData = (trackingNumber: any) => {
    const trackingString = String(trackingNumber);
    return (
      returnRecords.find(
        (record: any) => String(record.carrierTrackingCode) === trackingString
      ) ||
      orderRecords.find(
        (record: any) => String(record.carrierTrackingCode) === trackingString
      ) ||
      null
    );
  };

  const enrichedRecords = validRecords.map((record: any) => ({
    parsedRecord: record,
    orderData: findOrderData(record.trackingNumber)
  }));

  const recordsWithData = enrichedRecords.filter(
    (record: any) => record.orderData
  );
  const recordsWithoutData = enrichedRecords
    .filter((record: any) => !record.orderData)
    .map((record: any) => record.parsedRecord);

  return { recordsWithData, recordsWithoutData };
};

const parseEventParams = ({ event, context }: any) => {
  try {
    const records = event.Records.map((record: any) => JSON.parse(record.body));
    const logStreamId = context.logStreamName;
    return { records, logStreamId };
  } catch (error) {
    console.error("Error parsing event records:", error);
    throw error;
  }
};

const requiresReturnProcess = ({ statusCode, returnCodes }: any) => {
  return returnCodes.some((code: any) => String(code) === String(statusCode));
};

export default {
  requiresReturnProcess,
  searchNewStatus,
  getShippingRate,
  parseRecords,
  getOnlyTrackingNumbers,
  getTrackingNumbersNotInReturnTable,
  getRecordsToProcess,
  parseEventParams
};
