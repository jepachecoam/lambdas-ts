import dao from "./dao";
import dto from "./dto";
import utils from "./utils";

const parseEventParams = ({ event, context }: any) => {
  return dto.parseEventParams({ event, context });
};

const processRecordsWithRetries = async ({
  recordsToProcess,
  attempts,
  logStreamId
}: any) => {
  let remainingRecords = recordsToProcess;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const {
      recordsWithData: foundRecords,
      recordsWithoutData: notFoundRecords
    } = await fetchValidRecordsForProcessing({
      records: remainingRecords,
      logStreamId
    });

    if (foundRecords.length > 0) {
      await processValidRecords({ records: foundRecords, logStreamId });
    }

    if (notFoundRecords.length === 0) {
      return;
    }

    if (attempt < attempts) {
      await utils.addDelay(30);
    }
    remainingRecords = notFoundRecords;
  }

  await handleUnprocessedRecords({ remainingRecords, logStreamId });
};

const fetchValidRecordsForProcessing = async ({
  records,
  logStreamId
}: any) => {
  try {
    const { validRecords, invalidRecords } = dto.parseRecords({ records });

    if (invalidRecords.length) {
      await processInvalidRecords({ invalidRecords, logStreamId });
    }

    if (!validRecords.length) {
      return { recordsWithData: [], recordsWithoutData: [] };
    }

    const trackingNumbers = dto.getOnlyTrackingNumbers({ validRecords });

    const returnRecords = await dao.getDataInReturnTableByTrackingNumbers({
      trackingNumbers
    });

    const trackingNumberToSearchInOrders =
      dto.getTrackingNumbersNotInReturnTable({
        allTrackingNumbers: trackingNumbers,
        returnRecords
      });

    const orderRecords = trackingNumberToSearchInOrders.length
      ? await dao.getDataInOrderTableByTrackingNumbers({
          trackingNumbers: trackingNumberToSearchInOrders
        })
      : [];

    return dto.getRecordsToProcess({
      validRecords,
      returnRecords,
      orderRecords
    });
  } catch (error) {
    console.error("Error processing event records:", error);
    throw error;
  }
};

const processInvalidRecords = async ({ invalidRecords, logStreamId }: any) => {
  const promises = invalidRecords.map((record: any) => {
    console.error(`Invalid record: ${JSON.stringify(record)}`);
    return dao.sendErrorNotification({
      carrierName: record.carrierName,
      logStreamId,
      trackingNumber: record.trackingNumber,
      error: "Invalid record schema type or missing data",
      notes: JSON.stringify(record)
    });
  });

  await Promise.allSettled(promises);
};

const handleUnprocessedRecords = async ({
  remainingRecords,
  logStreamId
}: any) => {
  const promises = remainingRecords.map((record: any) => {
    console.error(`No data found after retries: ${JSON.stringify(record)}`);
    return dao.sendErrorNotification({
      logStreamId,
      error: "No data found after retries",
      notes: JSON.stringify(record)
    });
  });
  await Promise.allSettled(promises);
};

const processValidRecords = async ({ records, logStreamId }: any) => {
  await Promise.allSettled(
    records.map(async (record: any) => {
      try {
        const { parsedRecord, orderData: orderDataInSystem } = record;

        const { carrierStatus, shipmentUpdate, returnCodes } =
          await getCarrierConfig({ idCarrier: parsedRecord.idCarrier });

        const newStatusGuideParsed = await parseNewStatusGuide({
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
          await processOrderBasedOnSource({ data: mergedData, returnCodes });
        }
      } catch (err) {
        console.error("Error processing record", record, err);
        await dao.sendErrorNotification({
          logStreamId,
          error: err,
          notes: record
        });
      }
    })
  );
};

const getCarrierConfig = async ({ idCarrier }: any) => {
  const carrierStatus = await dao.getCarrierStatus({ idCarrier });
  const shipmentUpdate = await dao.getShipmentUpdates({ idCarrier });

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

const parseNewStatusGuide = async ({
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
    await dao.sendErrorNotification({
      logStreamId,
      trackingNumber,
      carrierName,
      error: dataToSend.notFoundCode
    });
    return null;
  }

  return { ...dataToSend, ...parsedRecord };
};

const processOrderBasedOnSource = async ({ data, returnCodes }: any) => {
  try {
    if (String(data.source) === "orderReturn") {
      await handleOrderReturn({ data, returnCodes });
    } else if (String(data.source) === "order") {
      await handleOrder({ data, returnCodes });
    }
  } catch (err: any) {
    console.error(`Error processing order: ${err.message}`);
    throw err;
  }
};

const handleOrderReturn = async ({ data, returnCodes }: any) => {
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
    await dao.createOrderReturnShipmentUpdateHistoryIfNotExists({
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

  await updateOrderReturn({ idOrder, idStatus });

  if (requiresAdditionalSteps) {
    await sendEventToProcessAdditionalSteps({ mergedData: data });
  }
};

const handleOrder = async ({ data, returnCodes }: any) => {
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

  const shipmentUpdate = await dao.createOrderShipmentUpdateHistoryIfNotExists({
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

  await updateOrder({ idOrder, idStatus, idUser, statusName });

  if (requiresReturnProcess) {
    const createOrderReturnResult = await createOrderReturn({
      source,
      carrierName,
      carrierTrackingCode: trackingNumber,
      returnTrackingNumber: returnProcess.returnTrackingNumber || trackingNumber
    });

    if (!createOrderReturnResult) {
      console.log(`Order return not created for guide ${trackingNumber}`);
    } else {
      console.log(`idOrder ${idOrder} created in orderReturn table`);
    }
  }
  if (requiresAdditionalSteps) {
    await sendEventToProcessAdditionalSteps({ mergedData: data });
  }
};

const updateOrderReturn = async ({ idOrder, idStatus }: any) => {
  const resultInsert = await dao.createOrderReturnStatusLogIfNotExists({
    idOrderReturn: idOrder,
    idStatus
  });
  if (!resultInsert) {
    console.log(
      `orderReturnStatusLog not created for Order ${idOrder} because idStatus ${idStatus} already exists in last state`
    );
    return null;
  }
  await dao.updateStatusOrderReturn({ idOrderReturn: idOrder, idStatus });
  console.log(
    `Order ${idOrder} update in table orderReturn with status ${idStatus}`
  );
};

const updateOrder = async ({ idOrder, idStatus, idUser, statusName }: any) => {
  const responseGetOrder = await dao.getOrder({ idUser, idOrder });
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
    const responsePutOrder = await dao.putOrder({
      orderData: { ...orderData, id_status: 6, status: "En Tránsito" }
    });
    if (!responsePutOrder) {
      console.log(`Order ${idOrder} error on putOrder`);
      return null;
    }
  }
  const responsePutOrder = await dao.putOrder({
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

const createOrderReturn = async ({
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

    const orderData = await dao.getOrderDataForPutOrderReturn({
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

    return await dao.createOrderReturnIfNotExists({
      returnTrackingNumber,
      orderData,
      updatedShippingRate
    });
  } catch (error) {
    console.error("Error creating order return:", error);
    throw error;
  }
};

const sendEventToProcessAdditionalSteps = async ({ mergedData }: any) => {
  const { trackingNumber, carrierName } = mergedData;

  const detail = { ...mergedData, contextStage: process.env["ENVIRONMENT"] };

  try {
    console.log(
      `Sending event for guide '${trackingNumber}', additional steps required.`
    );
    return await dao.sendEvent({
      source: "MASTERSHOP-PROCESS-ADDITIONAL-STEPS-IN-ORDERS-UPDATES",
      detailType: carrierName.toUpperCase(),
      detail: detail
    });
  } catch (error) {
    console.error("Error sending event to process additional steps:", error);
    throw error;
  }
};

export default {
  parseEventParams,
  processRecordsWithRetries
};
