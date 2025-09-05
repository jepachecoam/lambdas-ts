import { Carriers } from "./types";
import utils from "./utils";

class Dto {
  static searchNewStatus = ({
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
          update.codeCarrierShipmentUpdate.toString() ===
          noveltyCode?.toString()
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

  static getShippingRate = ({ carrierName, orderData }: any) => {
    try {
      const { shippingRate, paymentMethod, totalSeller, carrierInfo } =
        orderData;
      console.log("orderData =>>>", orderData);

      switch (carrierName.toUpperCase()) {
        case Carriers.COORDINADORA:
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
        case Carriers.TCC:
          return 0;

        case Carriers.SWAYP:
          return 0;

        case Carriers.ENVIA:
          return 0;

        case Carriers.INTERRAPIDISIMO:
          return 0;

        default:
          throw new Error("GetShipping rate not found");
      }
    } catch (err) {
      console.error("Error calculating shipping rate:", err);
      throw err;
    }
  };

  static parseRecords = ({ records }: any) => {
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

  static getOnlyTrackingNumbers = ({ validRecords }: any): string[] => {
    return validRecords.map((record: any) => record.trackingNumber);
  };

  static getOnlyIdOrders = ({ dataByCarrierTrackingNumber }: any): number[] => {
    return dataByCarrierTrackingNumber.map((record: any) =>
      Number(record.idOrder)
    );
  };

  static mergeEventWithOrderData = ({
    validRecords,
    recordsData,
    filteredRecordsData
  }: any) => {
    const findOrderData = (trackingNumber: any) => {
      const trackingString = String(trackingNumber);
      return (
        recordsData.find(
          (record: any) => String(record.carrierTrackingCode) === trackingString
        ) || null
      );
    };

    const findFilteredOrderData = (trackingNumber: any) => {
      const trackingString = String(trackingNumber);
      return (
        filteredRecordsData.find(
          (record: any) => String(record.carrierTrackingCode) === trackingString
        ) || null
      );
    };

    const enrichedRecords = validRecords.map((record: any) => ({
      parsedRecord: record,
      orderData: findFilteredOrderData(record.trackingNumber)
    }));

    const recordsWithData = enrichedRecords.filter(
      (record: any) => record.orderData
    );

    const recordsWithoutData = validRecords
      .filter((record: any) => {
        const hasData = findOrderData(record.trackingNumber);
        if (!hasData) {
          console.log(`${record.trackingNumber} no tiene datos en la bd aun`);
        }
        return !hasData;
      })
      .map((record: any) => record);

    return { recordsWithData, recordsWithoutData };
  };

  static parseEventParams = ({ event, context }: any) => {
    try {
      // const records = event.Records.map((record: any) => JSON.parse(record.body));
      const records = event.Records.map((record: any) => record.body);

      const logStreamId = context.logStreamName;
      return { records, logStreamId };
    } catch (error) {
      console.error("Error parsing event records:", error);
      throw error;
    }
  };

  static requiresReturnProcess = ({ statusCode, returnCodes }: any) => {
    return returnCodes.some((code: any) => String(code) === String(statusCode));
  };

  static filterRecordsBySource = ({
    dataByCarrierTrackingNumber,
    ordersSource
  }: any) => {
    return dataByCarrierTrackingNumber.filter((record: any) => {
      const matchingOrder = ordersSource.find(
        (order: any) =>
          order.idOrder === record.idOrder && order.source === record.source
      );
      if (!matchingOrder) {
        console.log(
          `${record.carrierTrackingCode} tiene una precedencia diferente a la de su idOrder`
        );
        return false;
      }
      return true;
    });
  };
}

export default Dto;
