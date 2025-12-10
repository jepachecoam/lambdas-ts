interface ILocation {
  countryState: string;
  countryCity: string;
}

export interface IPayload {
  idBusiness: number;
  idUserCarrierPreference: number;
  origin: ILocation;
  destination: ILocation;
}

export interface IValidateCoverageResponse {
  success: boolean;
  message: string;
}
