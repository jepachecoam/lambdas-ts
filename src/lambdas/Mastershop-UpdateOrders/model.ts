import Dao from "./dao";
import dto from "./dto";
import { IRecord, IRecordData, OrderSources } from "./types";
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

      const dataByCarrierTrackingNumber =
        await this.dao.getDataByCarrierTrackingNumber({ trackingNumbers });

      if (!dataByCarrierTrackingNumber) {
        console.error("No data found for tracking numbers:", trackingNumbers);
        return { recordsWithData: [], recordsWithoutData: [] };
      }

      const idOrders = dto.getOnlyIdOrders({ dataByCarrierTrackingNumber });

      const ordersSource = await this.dao.getOrderPrecedence({
        idOrders
      });

      if (!ordersSource) {
        console.error("No data found for tracking numbers:", trackingNumbers);
        return { recordsWithData: [], recordsWithoutData: [] };
      }

      const recordsData = dto.filterRecordsBySource({
        dataByCarrierTrackingNumber,
        ordersSource
      });

      const { recordsWithData, recordsWithoutData } =
        dto.mergeEventWithOrderData({
          validRecords,
          recordsData
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
          const parsedRecord: IRecord = record.parsedRecord;
          const orderData: IRecordData = record.orderData;

          const carrierConfig = await this.getCarrierConfig({
            idCarrier: parsedRecord.idCarrier
          });

          if (!carrierConfig) {
            console.log(
              "No carrier config found for carrier",
              parsedRecord.idCarrier
            );
            return;
          }

          const { carrierStatus, shipmentUpdate, returnCodes } = carrierConfig;

          const newStatusOrder = this.parseNewStatusGuide({
            parsedRecord,
            carrierStatus,
            shipmentUpdate
          });

          const newStatusOrderParsed = await this.validateAndHandleStatusGuide({
            newStatusOrder,
            parsedRecord,
            logStreamId
          });

          if (!newStatusOrderParsed) {
            console.log("No data to send, skipping");
            return;
          }

          const shouldProcessRecord =
            !newStatusOrderParsed.haveInactiveRule ||
            newStatusOrderParsed.forcedExecution;

          if (shouldProcessRecord) {
            await this.processOrderBasedOnSource({
              newStatusOrderParsed,
              orderData,
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

    if (!carrierStatus || !shipmentUpdate) {
      console.log("No carrier config found for carrier", idCarrier);
      return null;
    }

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

  parseNewStatusGuide = ({
    parsedRecord,
    carrierStatus,
    shipmentUpdate
  }: any) => {
    const { trackingNumber, status, novelty } = parsedRecord;

    const dataToSend = dto.searchNewStatus({
      carrierTrackingCode: trackingNumber,
      statusCode: status.statusCode,
      noveltyCode: novelty?.noveltyCode,
      carrierStatus,
      shipmentUpdate
    });

    return dataToSend;
  };

  validateAndHandleStatusGuide = async ({
    newStatusOrder,
    parsedRecord,
    logStreamId
  }: any) => {
    const { trackingNumber, carrierName } = parsedRecord;

    if (newStatusOrder.notFoundCode) {
      console.warn(
        `Error code '${newStatusOrder.notFoundCode}' found for tracking number '${trackingNumber}'. Sending error notification.`
      );
      await this.dao.sendErrorNotification({
        logStreamId,
        trackingNumber,
        carrierName,
        error: newStatusOrder.notFoundCode
      });
      return null;
    }

    return { ...newStatusOrder, ...parsedRecord };
  };

  processOrderBasedOnSource = async ({
    newStatusOrderParsed,
    orderData,
    returnCodes
  }: any) => {
    try {
      const source = String(orderData.source);
      console.log("source :>>>", source);

      if (source === OrderSources.Order) {
        await this.handleOrder({
          newStatusOrderParsed,
          orderData,
          returnCodes
        });
      }
      if (source === OrderSources.OrderLeg) {
        await this.handleOrder({
          newStatusOrderParsed,
          orderData,
          returnCodes
        });
      }
      if (source === OrderSources.OrderReturn) {
        await this.handleOrderReturn({
          newStatusOrderParsed,
          orderData,
          returnCodes
        });
      }
      if (source === OrderSources.OrderReturnLeg) {
        await this.handleOrderReturn({
          newStatusOrderParsed,
          orderData,
          returnCodes
        });
      }
    } catch (err: any) {
      console.error(`Error processing order: ${err.message}`);
      throw err;
    }
  };

  handleOrder = async ({
    newStatusOrderParsed,
    orderData,
    returnCodes
  }: any) => {
    const data = { ...newStatusOrderParsed, ...orderData };
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
      source,
      statusName,
      requiresAdditionalSteps,
      linkedShipment
    } = data;

    const latestOrderLeg = await this.validateOrderLeg({
      source,
      idOrder,
      trackingNumber
    });
    if (source === OrderSources.OrderLeg && !latestOrderLeg) {
      return null;
    }

    const sanitizedCarrierData = utils.validateAndSanitizeJSON(carrierData);
    const shipmentUpdateResult =
      await this.dao.createOrderShipmentUpdateHistoryIfNotExists({
        idCarrierStatusUpdate,
        carrierData: sanitizedCarrierData,
        idOrder,
        idShipmentUpdate,
        updateSource: updateSource || null,
        status: idShipmentUpdate ? "PENDING" : null,
        idOrderLeg: latestOrderLeg?.idOrderLeg || null
      });

    if (!shipmentUpdateResult) {
      console.log(
        `shipmentUpdateHistory not created for guide ${trackingNumber}`
      );
      return null;
    }

    await this.updateOrder({ idOrder, idStatus, idUser, statusName });

    const requireReturnProcess = dto.requiresReturnProcess({
      statusCode: status.statusCode,
      returnCodes
    });
    if (requireReturnProcess) {
      const createOrderReturnResult = await this.createOrderReturn({
        carrierName,
        idOrder,
        returnTrackingNumber:
          returnProcess.returnTrackingNumber || trackingNumber
      });

      if (!createOrderReturnResult) {
        console.log(`Order return not created for guide ${trackingNumber}`);
      } else {
        console.log(`idOrder ${idOrder} created in orderReturn table`);
      }
    }

    if (linkedShipment && linkedShipment?.carrierTrackingCode) {
      await this.dao.createOrderLeg({
        idOrder,
        carrierTrackingCode: linkedShipment.linkedCarrierTrackingCode,
        shippingRate: linkedShipment.shippingRate || null,
        originAddress: linkedShipment.originAddress || null,
        shippingAddress: linkedShipment.shippingAddress || null,
        legReason: linkedShipment.legReason || null,
        parentLegId:
          source === OrderSources.OrderLeg ? latestOrderLeg.idOrderLeg : null
      });
      console.log(
        `Order leg created for idOrder ${idOrder} with carrierTrackingCode ${linkedShipment.linkedCarrierTrackingCode}`
      );
    }

    if (requiresAdditionalSteps) {
      await this.sendEventToProcessAdditionalSteps({ mergedData: data });
    }
  };

  handleOrderReturn = async ({
    newStatusOrderParsed,
    orderData,
    returnCodes
  }: any) => {
    const data = { ...newStatusOrderParsed, ...orderData };
    const {
      idOrderReturn,
      idStatus,
      trackingNumber,
      linkedShipment,
      idCarrierStatusUpdate,
      status,
      source,
      carrierData,
      idShipmentUpdate,
      updateSource,
      requiresAdditionalSteps
    } = data;

    const latestOrderReturnLeg = await this.validateOrderReturnLeg({
      source,
      idOrderReturn,
      trackingNumber
    });
    if (source === OrderSources.OrderReturnLeg && !latestOrderReturnLeg) {
      return null;
    }

    const sanitizedCarrierData = utils.validateAndSanitizeJSON(carrierData);
    const shipmentUpdateResult =
      await this.dao.createOrderReturnShipmentUpdateHistoryIfNotExists({
        idCarrierStatusUpdate,
        carrierData: sanitizedCarrierData,
        idOrderReturn,
        idShipmentUpdate,
        updateSource: updateSource || null,
        status: idShipmentUpdate ? "PENDING" : null,
        idOrderReturnLeg: latestOrderReturnLeg?.idOrderReturnLeg || null
      });

    if (!shipmentUpdateResult) {
      console.log(
        `shipmentUpdateHistory not created for guide ${trackingNumber}`
      );
      return null;
    } else {
      console.log(`shipmentUpdateHistory created for guide ${trackingNumber} `);
    }

    await this.updateOrderReturn({ idOrderReturn, idStatus });

    const requiresReturnProcess = dto.requiresReturnProcess({
      statusCode: status.statusCode,
      returnCodes
    });
    if (requiresReturnProcess) {
      console.log(
        "OrderReturn not created because already exists in these tables"
      );
    }
    if (linkedShipment && linkedShipment?.carrierTrackingCode) {
      await this.dao.createOrderReturnLeg({
        idOrderReturn,
        carrierTrackingCode: linkedShipment.linkedCarrierTrackingCode,
        shippingRate: linkedShipment.shippingRate || null,
        originAddress: linkedShipment.originAddress || null,
        shippingAddress: linkedShipment.shippingAddress || null,
        legReason: linkedShipment.legReason || null,
        parentLegId:
          source === OrderSources.OrderReturnLeg
            ? latestOrderReturnLeg.idOrderReturnLeg
            : null
      });
    }

    if (requiresAdditionalSteps) {
      await this.sendEventToProcessAdditionalSteps({ mergedData: data });
    }
  };

  updateOrderReturn = async ({ idOrderReturn, idStatus }: any) => {
    const resultInsert = await this.dao.createOrderReturnStatusLogIfNotExists({
      idOrderReturn,
      idStatus
    });
    if (!resultInsert) {
      console.log(
        `orderReturnStatusLog not created for idOrderReturn ${idOrderReturn} because idStatus ${idStatus} already exists in last state`
      );
      return null;
    }
    await this.dao.updateStatusOrderReturn({
      idOrderReturn: idOrderReturn,
      idStatus
    });
    console.log(
      `Order ${idOrderReturn} update in table orderReturn with status ${idStatus}`
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
    idOrder,
    carrierName,
    returnTrackingNumber
  }: any) => {
    const orderData: any = await this.dao.getOrderData({
      idOrder
    });
    if (!orderData) {
      console.log(`No data found for idOrder ${idOrder} for createOrderReturn`);
      return null;
    }

    const updatedShippingRate = dto.getShippingRate({
      orderData,
      carrierName
    });

    const sanitizedOriginAddress = utils.validateAndSanitizeJSON(
      orderData.originAddress
    );
    const sanitizedShippingAddress = utils.validateAndSanitizeJSON(
      orderData.shippingAddress
    );
    const sanitizedCarrierTracking = utils.validateAndSanitizeJSON(
      orderData.carrierTracking
    );

    return this.dao.createOrderReturnIfNotExists({
      idOrder,
      returnTrackingNumber,
      originAddress: sanitizedOriginAddress,
      shippingAddress: sanitizedShippingAddress,
      carrierTracking: sanitizedCarrierTracking,
      shippingRate: updatedShippingRate
    });
  };

  sendEventToProcessAdditionalSteps = async ({ mergedData }: any) => {
    const { trackingNumber, carrierName } = mergedData;

    const detail = { ...mergedData, contextStage: this.environment };

    console.log(
      `Sending event for guide '${trackingNumber}', additional steps required.`
    );
    return this.dao.sendEvent({
      source: "MASTERSHOP-PROCESS-ADDITIONAL-STEPS-IN-ORDERS-UPDATES",
      detailType: carrierName.toUpperCase(),
      detail: detail
    });
  };

  validateOrderLeg = async ({ source, idOrder, trackingNumber }: any) => {
    let latestOrderLeg: any = null;
    if (source === OrderSources.OrderLeg) {
      latestOrderLeg = await this.dao.getLatestOrderLeg({ idOrder });
      console.log("latestOrderLeg :>>>", latestOrderLeg);
      if (!latestOrderLeg) {
        console.log(`No order return leg found for idOrder ${idOrder}`);
        return null;
      }
      if (String(latestOrderLeg?.carrierTrackingCode) !== trackingNumber) {
        console.log(
          `Carrier tracking code ${trackingNumber} does not match with latest order leg ${latestOrderLeg?.carrierTrackingCode}`
        );
        return null;
      }
    }
    return latestOrderLeg;
  };

  validateOrderReturnLeg = async ({
    source,
    idOrderReturn,
    trackingNumber
  }: any) => {
    let latestOrderReturnLeg: any = null;
    if (source === OrderSources.OrderReturnLeg) {
      latestOrderReturnLeg = await this.dao.getLatestOrderReturnLeg({
        idOrderReturn
      });
      console.log("latestOrderReturnLeg :>>>", latestOrderReturnLeg);
      if (!latestOrderReturnLeg) {
        console.log(
          `No order return leg found for idOrderReturn ${idOrderReturn}`
        );
        return null;
      }
      if (
        String(latestOrderReturnLeg?.carrierTrackingCode) !== trackingNumber
      ) {
        console.log(
          `Carrier tracking code ${trackingNumber} does not match with latest order return leg ${latestOrderReturnLeg?.carrierTrackingCode}`
        );
        return null;
      }
    }
    return latestOrderReturnLeg;
  };
}

export default Model;
