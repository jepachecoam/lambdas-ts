export interface Customer {
  idCustomer: number;
  idUser: number;
  idBussiness: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  defaultAddress: {
    zip: string;
    city: string;
    phone: string;
    state: string;
    company: string;
    country: string;
    address1: string;
    address2: string;
    latitude: number;
    full_name: string;
    last_name: string;
    longitude: number;
    first_name: string;
    state_code: string;
    toDaneCode: string;
    cityDaneCode: string;
    country_code: string;
  };
  tags: any[];
  documentType: string;
  document: string;
  inBlackList: number;
  dateInBlackList: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedResult {
  numberOfRepeated: number;
  result: {
    probability: number;
    data: Customer;
  };
  sourceRecords: Customer[];
}
