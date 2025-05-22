class Dto {
  static getParams(event: any) {
    console.log("event:>>>", JSON.stringify(event));

    if (!event.Records || !event.Records[0] || !event.Records[0].s3) {
      throw new Error("❌ Evento inválido.");
    }

    const record = event.Records[0];
    const bucket = record.s3.bucket.name;

    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    const pathParts = key.split("/");

    if (pathParts.length < 4) {
      throw new Error("❌ Ruta del archivo incorrecta");
    }

    const conciliationType: any = pathParts[2];
    const environment: any = pathParts[3];

    if (!["charges", "payments"].includes(conciliationType)) {
      throw new Error(
        `❌ Tipo de conciliación no soportado: ${conciliationType}`
      );
    }

    if (!["dev", "prod", "qa"].includes(environment)) {
      throw new Error(`❌ Ambiente no soportado: ${environment}`);
    }

    console.log("conciliationType:>>>", conciliationType);
    console.log("environment:>>>", environment);
    console.log("bucket:>>>", bucket);
    console.log("key:>>>", key);

    return { bucket, key, conciliationType, environment };
  }
  static rowValuesToCarrierCharge(rowValues: any[][]) {
    const result: any[] = [];

    rowValues.forEach((rowValue) => {
      result.push({
        idCarrier: rowValue[0],
        invoiceNumber: rowValue[1],
        carrierTrackingCode: rowValue[2],
        chargeDate: rowValue[3],
        units: rowValue[4],
        actualWeight: rowValue[5],
        volumetricWeight: rowValue[6],
        billedWeight: rowValue[7],
        declaredValue: rowValue[8],
        fixedFreight: rowValue[9],
        variableFreight: rowValue[10],
        collectionCommission: rowValue[11],
        totalFreight: rowValue[12],
        businessUnit: rowValue[13],
        notes: rowValue[14],
        totalCharge: rowValue[15]
      });
    });

    return result;
  }

  static rowValuesToCarrierPayment(rowValues: any[][]) {
    const result: any[] = [];

    rowValues.forEach((rowValue) => {
      result.push({
        idCarrier: rowValue[0],
        paymentDate: rowValue[1],
        invoiceNumber: rowValue[2],
        amount: rowValue[3],
        businessUnit: rowValue[4],
        notes: rowValue[5]
      });
    });

    return result;
  }
}

export default Dto;
