import Dao from "./dao";
import dto from "./dto";
import utils from "./utils";

class Model {
  private environment: string;
  private dao: Dao;
  constructor(environment: string) {
    this.environment = environment;
    this.dao = new Dao(environment);
  }

  parseEventParams = ({ event, context }: any) => {
    return dto.parseEventParams({ event, context });
  };

  processRecordsWithRetries = async ({
    recordsToProcess,
    attempts,
    logStreamId
  }: any) => {
    let remainingRecords = recordsToProcess;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const {
        recordsWithData: foundRecords,
        recordsWithoutData: notFoundRecords
      } = await this.fetchValidRecordsForProcessing({
        records: remainingRecords,
        logStreamId
      });

      if (foundRecords.length > 0) {
        await this.processValidRecords({ records: foundRecords, logStreamId });
      }

      if (notFoundRecords.length === 0) {
        return;
      }

      if (attempt < attempts) {
        await utils.addDelay(30);
      }
      remainingRecords = notFoundRecords;
    }

    await this.handleUnprocessedRecords({ remainingRecords, logStreamId });
  };

  fetchValidRecordsForProcessing = async ({ records, logStreamId }: any) => {
    try {
      const { validRecords, invalidRecords } = dto.parseRecords({ records });

      if (invalidRecords.length) {
        await this.processInvalidRecords({ invalidRecords, logStreamId });
      }

      if (!validRecords.length) {
        return { recordsWithData: [], recordsWithoutData: [] };
      }

      const trackingNumbers = dto.getOnlyTrackingNumbers({ validRecords });

      const returnRecords =
        await this.dao.getDataInReturnTableByTrackingNumbers({
          trackingNumbers
        });

      const trackingNumberToSearchInOrders =
        dto.getTrackingNumbersNotInReturnTable({
          allTrackingNumbers: trackingNumbers,
          returnRecords
        });

      const orderRecords = trackingNumberToSearchInOrders.length
        ? await this.dao.getDataInOrderTableByTrackingNumbers({
            trackingNumbers: trackingNumberToSearchInOrders
          })
        : [];

      const { recordsWithData, recordsWithoutData } = dto.getRecordsToProcess({
        validRecords,
        returnRecords,
        orderRecords
      });

      return { recordsWithData, recordsWithoutData };
    } catch (error) {
      console.error("Error processing event records:", error);
      throw error;
    }
  };

  processInvalidRecords = async ({ invalidRecords, logStreamId }: any) => {
    const promises = invalidRecords.map((record: any) => {
      console.error(`Invalid record: ${JSON.stringify(record)}`);
      return this.dao.sendErrorNotification({
        carrierName: record.carrierName,
        logStreamId,
        trackingNumber: record.trackingNumber,
        error: "Invalid record schema type or missing data",
        notes: JSON.stringify(record)
      });
    });

    await Promise.allSettled(promises);
  };

  handleUnprocessedRecords = async ({ remainingRecords, logStreamId }: any) => {
    const promises = remainingRecords.map((record: any) => {
      console.error(`No data found after retries: ${JSON.stringify(record)}`);
      return this.dao.sendErrorNotification({
        logStreamId,
        error: "No data found after retries",
        notes: JSON.stringify(record)
      });
    });
    await Promise.allSettled(promises);
  };

  processValidRecords = async ({ records, logStreamId }: any) => {
    await Promise.allSettled(
      records.map(async (record: any) => {
        try {
          const { parsedRecord, orderData: orderDataInSystem } = record;

          const { carrierStatus, shipmentUpdate, returnCodes } =
            await this.getCarrierConfig({ idCarrier: parsedRecord.idCarrier });

          const newStatusGuideParsed = await this.parseNewStatusGuide({
            parsedRecord,
            carrierStatus,
            shipmentUpdate,
            logStreamId
          });

          if (!newStatusGuideParsed) {
            console.log("No data to send, skipping");
            return;
          }

          const mergedData = {
            ...newStatusGuideParsed,
            ...orderDataInSystem
          };

          const shouldProcessRecord =
            !newStatusGuideParsed.haveInactiveRule ||
            newStatusGuideParsed.forcedExecution;

          if (shouldProcessRecord) {
            await this.processOrderBasedOnSource({
              data: mergedData,
              returnCodes
            });
          }
        } catch (err) {
          console.error("Error processing record", record, err);
          await this.dao.sendErrorNotification({
            logStreamId,
            error: err,
            notes: record
          });
        }
      })
    );
  };

  getCarrierConfig = async ({ idCarrier }: any) => {
    const carrierStatus = await this.dao.getCarrierStatus({ idCarrier });
    const shipmentUpdate = await this.dao.getShipmentUpdates({ idCarrier });

    const returnIdStatusCodeInSystem = 10;

    const returnCodes = carrierStatus
      .filter(
        (e: any) => String(e.idStatus) === String(returnIdStatusCodeInSystem)
      )
      .map((e: any) => e.carrierCode);

    return {
      carrierStatus,
      shipmentUpdate,
      returnCodes
    };
  };

  parseNewStatusGuide = async ({
    parsedRecord,
    carrierStatus,
    shipmentUpdate,
    logStreamId
  }: any) => {
    const { trackingNumber, status, novelty, carrierName } = parsedRecord;

    const dataToSend = dto.searchNewStatus({
      carrierTrackingCode: trackingNumber,
      statusCode: status.statusCode,
      noveltyCode: novelty?.noveltyCode,
      carrierStatus,
      shipmentUpdate
    });

    if (dataToSend.notFoundCode) {
      console.warn(
        `Error code '${dataToSend.notFoundCode}' found for tracking number '${trackingNumber}'. Sending error notification.`
      );
      await this.dao.sendErrorNotification({
        logStreamId,
        trackingNumber,
        carrierName,
        error: dataToSend.notFoundCode
      });
      return null;
    }

    return { ...dataToSend, ...parsedRecord };
  };

  processOrderBasedOnSource = async ({ data, returnCodes }: any) => {
    try {
      if (String(data.source) === "orderReturn") {
        await this.handleOrderReturn({ data, returnCodes });
      } else if (String(data.source) === "order") {
        await this.handleOrder({ data, returnCodes });
      }
    } catch (err: any) {
      console.error(`Error processing order: ${err.message}`);
      throw err;
    }
  };

  handleOrderReturn = async ({ data, returnCodes }: any) => {
    const {
      idOrder,
      idStatus,
      trackingNumber,
      idCarrierStatusUpdate,
      carrierData,
      idShipmentUpdate,
      updateSource,
      source: _source,
      carrierName: _carrierName,
      status,
      requiresAdditionalSteps
    } = data;

    const _requiresReturnProcess = dto.requiresReturnProcess({
      statusCode: status.statusCode,
      returnCodes
    });
    const sanitizedCarrierData = utils.validateAndSanitizeJSON(carrierData);

    const shipmentUpdate =
      await this.dao.createOrderReturnShipmentUpdateHistoryIfNotExists({
        idCarrierStatusUpdate,
        sanitizedCarrierData,
        idOrder,
        idShipmentUpdate,
        updateSource
      });

    if (!shipmentUpdate) {
      console.log(
        `shipmentUpdateHistory not created for guide ${trackingNumber}`
      );
      return null;
    } else {
      console.log(`shipmentUpdateHistory created for guide ${trackingNumber} `);
    }

    await this.updateOrderReturn({ idOrder, idStatus });

    if (requiresAdditionalSteps) {
      await this.sendEventToProcessAdditionalSteps({ mergedData: data });
    }
  };

  handleOrder = async ({ data, returnCodes }: any) => {
    const {
      idOrder,
      idStatus,
      idUser,
      trackingNumber,
      idCarrierStatusUpdate,
      carrierData,
      idShipmentUpdate,
      updateSource,
      carrierName,
      returnProcess,
      status,
      statusName,
      source,
      requiresAdditionalSteps
    } = data;

    const requiresReturnProcess = dto.requiresReturnProcess({
      statusCode: status.statusCode,
      returnCodes
    });
    const sanitizedCarrierData = utils.validateAndSanitizeJSON(carrierData);

    const shipmentUpdate =
      await this.dao.createOrderShipmentUpdateHistoryIfNotExists({
        idCarrierStatusUpdate,
        sanitizedCarrierData,
        idOrder,
        idShipmentUpdate,
        updateSource
      });

    if (!shipmentUpdate) {
      console.log(
        `shipmentUpdateHistory not created for guide ${trackingNumber}`
      );
      return null;
    }

    await this.updateOrder({ idOrder, idStatus, idUser, statusName });

    if (requiresReturnProcess) {
      const createOrderReturnResult = await this.createOrderReturn({
        source,
        carrierName,
        carrierTrackingCode: trackingNumber,
        returnTrackingNumber:
          returnProcess.returnTrackingNumber || trackingNumber
      });

      if (!createOrderReturnResult) {
        console.log(`Order return not created for guide ${trackingNumber}`);
      } else {
        console.log(`idOrder ${idOrder} created in orderReturn table`);
      }
    }
    if (requiresAdditionalSteps) {
      await this.sendEventToProcessAdditionalSteps({ mergedData: data });
    }
  };

  updateOrderReturn = async ({ idOrder, idStatus }: any) => {
    const resultInsert = await this.dao.createOrderReturnStatusLogIfNotExists({
      idOrderReturn: idOrder,
      idStatus
    });
    if (!resultInsert) {
      console.log(
        `orderReturnStatusLog not created for Order ${idOrder} because idStatus ${idStatus} already exists in last state`
      );
      return null;
    }
    await this.dao.updateStatusOrderReturn({
      idOrderReturn: idOrder,
      idStatus
    });
    console.log(
      `Order ${idOrder} update in table orderReturn with status ${idStatus}`
    );
  };

  updateOrder = async ({ idOrder, idStatus, idUser, statusName }: any) => {
    const responseGetOrder = await this.dao.getOrder({ idUser, idOrder });
    if (!responseGetOrder) {
      console.log(`Order ${idOrder} error on getOrder`);
      return null;
    }

    const orderData = responseGetOrder.data;
    console.log("orderData =>>>", orderData);

    if (
      Number(idStatus) === 8 &&
      typeof orderData.id_status === "number" &&
      orderData.id_status !== 6 &&
      orderData.id_status !== 8
    ) {
      console.log(
        `Updating idOrder ${idOrder} because it needs to be set to status 8, but its current status is neither 6 nor 8.`
      );
      const responsePutOrder = await this.dao.putOrder({
        orderData: { ...orderData, id_status: 6, status: "En Tránsito" }
      });
      if (!responsePutOrder) {
        console.log(`Order ${idOrder} error on putOrder`);
        return null;
      }
    }
    const responsePutOrder = await this.dao.putOrder({
      orderData: { ...orderData, id_status: idStatus, status: statusName }
    });
    if (!responsePutOrder) {
      console.log(`Order ${idOrder} error on putOrder`);
      return null;
    }
    console.log(
      `Order ${idOrder} updated in table order with status ${statusName}`
    );
  };

  createOrderReturn = async ({
    carrierName,
    carrierTrackingCode,
    returnTrackingNumber,
    source
  }: any) => {
    try {
      if (source === "orderReturn") {
        console.log(
          `Guide ${returnTrackingNumber} already exists in orderReturn table`
        );
        return null;
      }

      const orderData = await this.dao.getOrderDataForPutOrderReturn({
        carrierTrackingCode
      });
      if (!orderData) {
        console.log(
          `No data found for carrierTrackingCode ${carrierTrackingCode} for createOrderReturn`
        );
        return null;
      }

      const updatedShippingRate = dto.getShippingRate({
        orderData,
        carrierName
      });

      return await this.dao.createOrderReturnIfNotExists({
        returnTrackingNumber,
        orderData,
        updatedShippingRate
      });
    } catch (error) {
      console.error("Error creating order return:", error);
      throw error;
    }
  };

  sendEventToProcessAdditionalSteps = async ({ mergedData }: any) => {
    const { trackingNumber, carrierName } = mergedData;

    const detail = { ...mergedData, contextStage: this.environment };

    try {
      console.log(
        `Sending event for guide '${trackingNumber}', additional steps required.`
      );
      return await this.dao.sendEvent({
        source: "MASTERSHOP-PROCESS-ADDITIONAL-STEPS-IN-ORDERS-UPDATES",
        detailType: carrierName.toUpperCase(),
        detail: detail
      });
    } catch (error) {
      console.error("Error sending event to process additional steps:", error);
      throw error;
    }
  };
}

export default Model;
