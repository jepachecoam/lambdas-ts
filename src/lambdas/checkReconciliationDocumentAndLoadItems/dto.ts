import { EnvironmentTypes } from "../../shared/types";

class Dto {
  static getParams(event: any) {
    console.log("event:>>>", JSON.stringify(event));

    if (!event.Records || !event.Records[0] || !event.Records[0].s3) {
      throw new Error("Missing required parameters for authorization.");
    }

    const environment: EnvironmentTypes = !["dev", "qa"].includes(event.stage)
      ? "prod"
      : event.stage;

    const record = event.Records[0];
    const bucket = record.s3.bucket.name;

    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    const conciliationType = key.split("/")[2];

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
        idCarrier: getValue(1),
        invoiceNumber: getValue(2),
        carrierTrackingCode: getValue(3),
        chargeDate: getValue(4),
        units: getValue(5),
        actualWeight: getValue(6),
        volumetricWeight: getValue(7),
        billedWeight: getValue(8),
        declaredValue: getValue(9),
        fixedFreight: getValue(10),
        variableFreight: getValue(11),
        collectionCommission: getValue(12),
        totalFreight: getValue(13),
        businessUnit: getValue(14, true),
        notes: getValue(15, true)
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
        idCarrier: getValue(1),
        paymentDate: getValue(2),
        invoiceNumber: getValue(3),
        amount: getValue(4),
        businessUnit: getValue(5, true),
        notes: getValue(6, true)
      });
    });

    return result;
  }
}

export default Dto;
