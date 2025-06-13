import model from "./model";

export const handler = async (event: any, _context: any) => {
  try {
    console.log("event =>>>", event);

    const body = JSON.parse(event.body);

    const carrierData = {
      trackingNumber: body.numero_guia,
      status: {
        statusCode: "409",
        statusName: "Incidente"
      },
      novelty: {
        noveltyCode: body.id_novedad ? String(body.id_novedad) : null,
        description: body.descripcion_novedad
          ? String(body.descripcion_novedad)
          : null,
        note: null
      },
      returnProcess: {
        returnTrackingNumber: null
      },
      carrierData: JSON.stringify({ managementInformation: body })
    };

    const updatedStatusGuideResult = await model.sendCarrierDataToUpdateOrder({
      carrierData
    });
    console.log("updatedStatusGuideResult =>>>", updatedStatusGuideResult);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK" })
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      body: err.message
    };
  }
};
