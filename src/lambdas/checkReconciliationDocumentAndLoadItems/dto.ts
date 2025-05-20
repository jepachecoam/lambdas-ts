import { EnvironmentTypes } from "../../shared/types";

class Dto {
  static getParams(event: any) {
    console.log("event:>>>", JSON.stringify(event));

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
}

export default Dto;
