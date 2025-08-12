import Fuse from "fuse.js";

import Dao from "./dao";
import {
  CityData,
  CitySearchResult,
  DaneLookupResult,
  DepartmentData,
  DepartmentSearchResult,
  RequestBody
} from "./types";

class Model {
  private dao = new Dao();
  // Text normalization utility functions

  private normalizeText(text: string): string {
    if (!text || typeof text !== "string") {
      return "";
    }

    const removeParenthesesContent = (str: string): string => {
      // Elimina todo lo que esté dentro de () incluyendo los paréntesis
      return str.replace(/\([^)]*\)/g, "");
    };

    const toLowerCase = (str: string): string => str.toLowerCase();

    const normalizeSpaces = (str: string): string => {
      // Convierte múltiples espacios en uno solo
      return str.replace(/\s+/g, " ");
    };

    const trimText = (str: string): string => str.trim();

    const removeAccents = (text: string): string => {
      return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const removeSpecialCharacters = (text: string): string => {
      return text.replace(/[^a-zA-Z0-9\s]/g, "");
    };

    let result = text;
    result = removeParenthesesContent(result);
    result = removeAccents(result);
    result = removeSpecialCharacters(result);
    result = toLowerCase(result);
    result = normalizeSpaces(result);
    result = trimText(result);

    return result;
  }

  private extractFirstPart(text: string): string {
    if (!text || typeof text !== "string") {
      return "";
    }

    const parts = text.split(",");
    return parts[0].trim();
  }

  private sanitizeInput(text: string): string {
    const firstPart = this.extractFirstPart(text);
    return this.normalizeText(firstPart);
  }

  // Department fuzzy search functionality
  private createDepartmentSearchData(): string[] {
    const searchData: string[] = [];
    const daneData = this.dao.getDaneData();

    daneData.forEach((dept) => {
      // Add normalized name
      searchData.push(this.normalizeText(dept.name));

      // Add normalized code
      if (dept.code) {
        searchData.push(this.normalizeText(dept.code));
      }

      // Add normalized aliases
      if (dept.alias && Array.isArray(dept.alias)) {
        dept.alias.forEach((alias) => {
          searchData.push(this.normalizeText(alias));
        });
      }
    });

    return searchData;
  }

  private findDepartmentByQuery(query: string): DepartmentSearchResult {
    const normalizedQuery = this.sanitizeInput(query);

    if (!normalizedQuery) {
      return { result: null, isAmbiguous: false };
    }

    // Reject very short queries that are likely to produce false positives
    if (normalizedQuery.length < 3) {
      return { result: null, isAmbiguous: false };
    }

    // Create search data for Fuse.js
    const searchData = this.createDepartmentSearchData();

    const fuse = new Fuse(searchData, {
      threshold: 0.05, // 95% similarity
      includeScore: true,
      isCaseSensitive: false,
      minMatchCharLength: 3 // Minimum characters that must match
    });

    const searchResult = fuse.search(normalizedQuery);

    if (
      searchResult.length === 0 ||
      !searchResult[0] ||
      searchResult[0].score! > 0.05
    ) {
      return { result: null, isAmbiguous: false };
    }

    // Additional validation: ensure the match makes sense
    const matchedText = searchResult[0].item;
    const matchScore = searchResult[0].score!;

    // For very short queries, require exact or near-exact matches
    if (normalizedQuery.length <= 4 && matchScore > 0.01) {
      return { result: null, isAmbiguous: false };
    }

    // Check for ambiguous results: if 3 or more results have the same score
    const sameScoreCount = searchResult.filter(
      (result) => Math.abs(result.score! - matchScore) < 0.001
    ).length;
    const isAmbiguous = sameScoreCount >= 3;

    // Find the original department that matches
    const daneData = this.dao.getDaneData();
    for (const dept of daneData) {
      // Check if it matches the name
      if (this.normalizeText(dept.name) === matchedText) {
        return { result: dept, isAmbiguous };
      }

      // Check if it matches the code
      if (dept.code && this.normalizeText(dept.code) === matchedText) {
        return { result: dept, isAmbiguous };
      }

      // Check if it matches any alias
      if (dept.alias && Array.isArray(dept.alias)) {
        for (const alias of dept.alias) {
          if (this.normalizeText(alias) === matchedText) {
            return { result: dept, isAmbiguous };
          }
        }
      }
    }

    return { result: null, isAmbiguous: false };
  }

  // City fuzzy search functionality
  private createCitySearchData(department: DepartmentData): string[] {
    const searchData: string[] = [];

    department.cities.forEach((city) => {
      // Add normalized name
      searchData.push(this.normalizeText(city.name));

      // Add normalized aliases
      if (city.alias && Array.isArray(city.alias)) {
        city.alias.forEach((alias) => {
          searchData.push(this.normalizeText(alias));
        });
      }
    });

    return searchData;
  }

  private findCityInDepartment(
    query: string,
    department: DepartmentData
  ): CitySearchResult {
    const normalizedQuery = this.sanitizeInput(query);

    if (
      !normalizedQuery ||
      !department.cities ||
      department.cities.length === 0
    ) {
      return { result: null, isAmbiguous: false };
    }

    // Reject very short queries that are likely to produce false positives
    if (normalizedQuery.length < 4) {
      return { result: null, isAmbiguous: false };
    }

    // Create search data for Fuse.js
    const searchData = this.createCitySearchData(department);

    const fuse = new Fuse(searchData, {
      threshold: 0.05, // 95% similarity
      includeScore: true,
      isCaseSensitive: false,
      minMatchCharLength: 4 // Minimum characters that must match
    });

    const searchResult = fuse.search(normalizedQuery);

    if (
      searchResult.length === 0 ||
      !searchResult[0] ||
      searchResult[0].score! > 0.05
    ) {
      return { result: null, isAmbiguous: false };
    }

    // Additional validation: ensure the match makes sense
    const matchedText = searchResult[0].item;
    const matchScore = searchResult[0].score!;

    // For short queries, require much better matches
    if (normalizedQuery.length <= 5 && matchScore > 0.05) {
      return { result: null, isAmbiguous: false };
    }

    // Check for ambiguous results: if 2 or more results have the same score
    const sameScoreCount = searchResult.filter(
      (result) => Math.abs(result.score! - matchScore) < 0.001
    ).length;
    const isAmbiguous = sameScoreCount >= 2;

    // Find the original city that matches
    for (const city of department.cities) {
      // Check if it matches the name
      if (this.normalizeText(city.name) === matchedText) {
        return { result: city, isAmbiguous };
      }

      // Check if it matches any alias
      if (city.alias && Array.isArray(city.alias)) {
        for (const alias of city.alias) {
          if (this.normalizeText(alias) === matchedText) {
            return { result: city, isAmbiguous };
          }
        }
      }
    }

    return { result: null, isAmbiguous: false };
  }

  // DANE code resolution with carrier support
  private resolveDaneCode(city: CityData, idCarrier?: number): string {
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
  }

  // Core DANE lookup service
  processRequest(params: RequestBody): DaneLookupResult {
    try {
      const { department, city, idCarrier } = params;

      // Find department using fuzzy search
      const departmentSearchResult = this.findDepartmentByQuery(department);

      if (!departmentSearchResult.result) {
        return {
          message: "department is missing",
          data: null
        };
      }

      // Find city within the found department
      const citySearchResult = this.findCityInDepartment(
        city,
        departmentSearchResult.result
      );

      if (!citySearchResult.result) {
        return {
          message: "city is missing",
          data: null
        };
      }

      // Resolve DANE code with carrier support
      const daneCode = this.resolveDaneCode(citySearchResult.result, idCarrier);

      // Check if either search was ambiguous
      const isAmbiguous =
        departmentSearchResult.isAmbiguous || citySearchResult.isAmbiguous;

      // Return successful result
      return {
        message: "success",
        data: {
          department: departmentSearchResult.result.name,
          city: citySearchResult.result.name,
          daneCode: daneCode
        },
        ambiguousResult: isAmbiguous
      };
    } catch (error) {
      console.error("Error in processRequest:", error);
      return {
        message: "internal error",
        data: null
      };
    }
  }
}

export default Model;
