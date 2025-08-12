// Request/Response Types
export interface RequestBody {
  department: string;
  city: string;
  idCarrier?: number;
}

export interface DaneLookupResult {
  message: string;
  data: DaneData | null;
  ambiguousResult?: boolean;
}

// Search Result Types
export interface DepartmentSearchResult {
  result: DepartmentData | null;
  isAmbiguous: boolean;
}

export interface CitySearchResult {
  result: CityData | null;
  isAmbiguous: boolean;
}

// Data Model Types
export interface DaneData {
  department: string;
  city: string;
  daneCode: string;
}

export interface DepartmentData {
  name: string;
  code: string;
  alias?: string[];
  cities: CityData[];
}

export interface CityData {
  name: string;
  dane: string;
  alias?: string[];
  extraDanes?: ExtraDane[];
}

export interface ExtraDane {
  id: number;
  dane: string;
}
