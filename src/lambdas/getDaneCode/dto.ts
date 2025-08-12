import { RequestBody } from "./types";

class Dto {
  static getParams(event: any): RequestBody {
    if (!event) {
      throw new Error("Request body is required");
    }

    const { department, city, idCarrier } = event;

    if (!department) {
      throw new Error("department parameter is required");
    }

    if (!city) {
      throw new Error("city parameter is required");
    }

    return {
      department,
      city,
      idCarrier
    };
  }
}

export default Dto;
