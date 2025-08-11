import Fuse from "fuse.js";

import { daneData } from "./colombiaDaneCodes";

// Interfaces
interface RequestBody {
  department: string;
  city: string;
  idCarrier?: number;
}

interface DaneLookupResult {
  message: string;
  data: DaneData | null;
}

interface DaneData {
  department: string;
  city: string;
  daneCode: string;
}

interface DepartmentData {
  name: string;
  code: string;
  alias?: string[];
  cities: CityData[];
}

interface CityData {
  name: string;
  dane: string;
  alias?: string[];
  extraDanes?: ExtraDane[];
}

interface ExtraDane {
  id: number;
  dane: string;
}

// Text normalization utility functions
const removeAccents = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const removeSpecialCharacters = (text: string): string => {
  return text.replace(/[^a-zA-Z0-9\s]/g, "");
};

const normalizeText = (text: string): string => {
  if (!text || typeof text !== "string") {
    return "";
  }

  return removeSpecialCharacters(removeAccents(text))
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

const extractFirstPart = (text: string): string => {
  if (!text || typeof text !== "string") {
    return "";
  }

  const parts = text.split(",");
  return parts[0].trim();
};

const sanitizeInput = (text: string): string => {
  const firstPart = extractFirstPart(text);
  return normalizeText(firstPart);
};

// Department fuzzy search functionality
const createDepartmentSearchData = (): string[] => {
  const searchData: string[] = [];

  daneData.forEach((dept) => {
    // Add normalized name
    searchData.push(normalizeText(dept.name));

    // Add normalized code
    if (dept.code) {
      searchData.push(normalizeText(dept.code));
    }

    // Add normalized aliases
    if (dept.alias && Array.isArray(dept.alias)) {
      dept.alias.forEach((alias) => {
        searchData.push(normalizeText(alias));
      });
    }
  });

  return searchData;
};

const findDepartmentByQuery = (query: string): DepartmentData | null => {
  const normalizedQuery = sanitizeInput(query);

  if (!normalizedQuery) {
    return null;
  }

  // Create search data for Fuse.js
  const searchData = createDepartmentSearchData();

  const fuse = new Fuse(searchData, {
    threshold: 0.05, // 95% similarity
    includeScore: true,
    isCaseSensitive: false
  });

  const searchResult = fuse.search(normalizedQuery);

  if (
    searchResult.length === 0 ||
    !searchResult[0] ||
    searchResult[0].score! > 0.05
  ) {
    return null;
  }

  // Find the original department that matches
  const matchedText = searchResult[0].item;

  for (const dept of daneData) {
    // Check if it matches the name
    if (normalizeText(dept.name) === matchedText) {
      return dept as DepartmentData;
    }

    // Check if it matches the code
    if (dept.code && normalizeText(dept.code) === matchedText) {
      return dept as DepartmentData;
    }

    // Check if it matches any alias
    if (dept.alias && Array.isArray(dept.alias)) {
      for (const alias of dept.alias) {
        if (normalizeText(alias) === matchedText) {
          return dept as DepartmentData;
        }
      }
    }
  }

  return null;
};

// City fuzzy search functionality
const createCitySearchData = (department: DepartmentData): string[] => {
  const searchData: string[] = [];

  department.cities.forEach((city) => {
    // Add normalized name
    searchData.push(normalizeText(city.name));

    // Add normalized aliases
    if (city.alias && Array.isArray(city.alias)) {
      city.alias.forEach((alias) => {
        searchData.push(normalizeText(alias));
      });
    }
  });

  return searchData;
};

const findCityInDepartment = (
  query: string,
  department: DepartmentData
): CityData | null => {
  const normalizedQuery = sanitizeInput(query);

  if (
    !normalizedQuery ||
    !department.cities ||
    department.cities.length === 0
  ) {
    return null;
  }

  // Create search data for Fuse.js
  const searchData = createCitySearchData(department);

  const fuse = new Fuse(searchData, {
    threshold: 0.1, // 90% similarity
    includeScore: true,
    isCaseSensitive: false
  });

  const searchResult = fuse.search(normalizedQuery);

  if (
    searchResult.length === 0 ||
    !searchResult[0] ||
    searchResult[0].score! > 0.1
  ) {
    return null;
  }

  // Find the original city that matches
  const matchedText = searchResult[0].item;

  for (const city of department.cities) {
    // Check if it matches the name
    if (normalizeText(city.name) === matchedText) {
      return city as CityData;
    }

    // Check if it matches any alias
    if (city.alias && Array.isArray(city.alias)) {
      for (const alias of city.alias) {
        if (normalizeText(alias) === matchedText) {
          return city as CityData;
        }
      }
    }
  }

  return null;
};

// DANE code resolution with carrier support
const resolveDaneCode = (city: CityData, idCarrier?: number): string => {
  // If no carrier ID provided, return default DANE code
  if (!idCarrier) {
    return city.dane;
  }

  // Check if extraDanes exists and is an array
  if (
    !city.extraDanes ||
    !Array.isArray(city.extraDanes) ||
    city.extraDanes.length === 0
  ) {
    return city.dane;
  }

  // Search for the carrier ID in extraDanes
  const carrierDane = city.extraDanes.find(
    (extraDane) => extraDane.id === idCarrier
  );

  // If found, return the carrier-specific DANE code, otherwise fallback to default
  return carrierDane ? carrierDane.dane : city.dane;
};

// Core DANE lookup service
const findDaneCode = (
  department: string,
  city: string,
  idCarrier?: number
): DaneLookupResult => {
  try {
    // Validate input parameters
    if (!department || typeof department !== "string") {
      return {
        message: "department is missing",
        data: null
      };
    }

    if (!city || typeof city !== "string") {
      return {
        message: "city is missing",
        data: null
      };
    }

    // Find department using fuzzy search
    const foundDepartment = findDepartmentByQuery(department);

    if (!foundDepartment) {
      return {
        message: "department is missing",
        data: null
      };
    }

    // Find city within the found department
    const foundCity = findCityInDepartment(city, foundDepartment);

    if (!foundCity) {
      return {
        message: "city is missing",
        data: null
      };
    }

    // Resolve DANE code with carrier support
    const daneCode = resolveDaneCode(foundCity, idCarrier);

    // Return successful result
    return {
      message: "success",
      data: {
        department: foundDepartment.name,
        city: foundCity.name,
        daneCode: daneCode
      }
    };
  } catch (error) {
    console.error("Error in findDaneCode:", error);
    return {
      message: "internal error",
      data: null
    };
  }
};

// Lambda handler with HTTP request processing
export const handler = async (event: any): Promise<any> => {
  try {
    // Validate HTTP method (should be POST)
    // Parse request body
    let requestBody: RequestBody;

    try {
      if (!event) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Request body is required",
            data: null
          })
        };
      }

      requestBody = event;
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid JSON in request body",
          data: null
        })
      };
    }

    // Extract parameters
    const { department, city, idCarrier } = requestBody;

    // Validate required parameters
    if (!department) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "department parameter is required",
          data: null
        })
      };
    }

    if (!city) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "city parameter is required",
          data: null
        })
      };
    }

    // Perform DANE code lookup
    const result = findDaneCode(department, city, idCarrier);

    // Determine HTTP status code based on result
    let statusCode = 200;
    if (
      result.message === "department is missing" ||
      result.message === "city is missing"
    ) {
      statusCode = 404;
    } else if (result.message === "internal error") {
      statusCode = 500;
    }

    // Return HTTP response
    return {
      statusCode: statusCode,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("Unexpected error in Lambda handler:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "internal server error",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};

// Export the main function for testing purposes
export { findDaneCode };

// Default export for compatibility
export default {
  handler,
  findDaneCode
};
