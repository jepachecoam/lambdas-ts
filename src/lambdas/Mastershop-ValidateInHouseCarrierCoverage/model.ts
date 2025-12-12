import Dao from "./dao";
import { IPayload, IValidateCoverageResponse } from "./types";

class Model {
  private dao: Dao;
  constructor(dao: Dao) {
    this.dao = dao;
  }
  async validateCoverage(
    payload: IPayload
  ): Promise<IValidateCoverageResponse> {
    const result = {
      success: true,
      message: "Coverage validated successfully"
    };

    const origin = await this.dao.getLocation(
      payload.origin.countryCity,
      payload.origin.countryState
    );

    if (!origin) {
      result.success = false;
      result.message = "Origin location not found";
      return result;
    }

    const destination = await this.dao.getLocation(
      payload.destination.countryCity,
      payload.destination.countryState
    );

    if (!destination) {
      result.success = false;
      result.message = "Destination location not found";
      return result;
    }

    if (payload.origin.countryState !== payload.destination.countryState) {
      result.success = false;
      result.message = "Origin and destination must be in the same state";
      return result;
    }

    const originCoverage = await this.dao.getCarrierCityCoverage(
      payload.idBusiness,
      payload.idUserCarrierPreference,
      payload.origin.countryCity
    );

    if (!originCoverage) {
      result.success = false;
      result.message = "Origin city coverage not found";
      return result;
    }

    const destinationCoverage = await this.dao.getCarrierCityCoverage(
      payload.idBusiness,
      payload.idUserCarrierPreference,
      payload.destination.countryCity
    );

    if (!destinationCoverage) {
      result.success = false;
      result.message = "Destination city coverage not found";
      return result;
    }

    if (payload.origin.countryCity === payload.destination.countryCity) {
      return result;
    }

    if (!origin.idOperationalArea || !destination.idOperationalArea) {
      result.success = false;
      result.message = "Cities must have operational area assigned";
      return result;
    }

    if (origin.idOperationalArea !== destination.idOperationalArea) {
      result.success = false;
      result.message = "Cities must belong to the same operational area";
      return result;
    }

    const businessArea = await this.dao.getBusinessOperationalArea(
      payload.idBusiness
    );

    if (!businessArea) {
      result.success = false;
      result.message = "Business does not have operational area active";
      return result;
    }

    const hasActiveArea = businessArea.some(
      (area) => area.idOperationalArea === origin.idOperationalArea
    );

    if (!hasActiveArea) {
      result.success = false;
      result.message = "Business does not have this operational area active";
      return result;
    }

    return result;
  }
}

export default Model;
