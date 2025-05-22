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
    console.log("bucket:>>>", bucket);
    console.log("key:>>>", key);

    return { bucket, key, conciliationType, environment };
  }
  static rowValuesToCarrierCharge(rowValues: any[][]) {
    const result: any[] = [];

    rowValues.forEach((rowValue) => {
      const getValue = (index: number, allowNull = false) => {
        const value = rowValue[index];
        if (value === undefined || value === null || value === "") {
          return allowNull ? null : "";
        }
        return value;
      };

      result.push({
        idCarrier: getValue(0),
        invoiceNumber: getValue(1),
        carrierTrackingCode: getValue(2),
        chargeDate: getValue(3),
        units: getValue(4),
        actualWeight: getValue(5),
        volumetricWeight: getValue(6),
        billedWeight: getValue(7),
        declaredValue: getValue(8),
        fixedFreight: getValue(9),
        variableFreight: getValue(10),
        collectionCommission: getValue(11),
        totalFreight: getValue(12),
        businessUnit: getValue(13, true),
        notes: getValue(14, true)
      });
    });

    return result;
  }

  static rowValuesToCarrierPayment(rowValues: any[][]) {
    const result: any[] = [];

    rowValues.forEach((rowValue) => {
      const getValue = (index: number, allowNull = false) => {
        const value = rowValue[index];
        if (value === undefined || value === null || value === "") {
          return allowNull ? null : "";
        }
        return value;
      };

      result.push({
        idCarrier: getValue(0),
        paymentDate: getValue(1),
        invoiceNumber: getValue(2),
        amount: getValue(3),
        businessUnit: getValue(4, true),
        notes: getValue(5, true)
      });
    });

    return result;
  }
}

export default Dto;
