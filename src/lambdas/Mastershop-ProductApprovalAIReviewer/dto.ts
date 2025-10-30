import { ApprovalStatus, ProductApprovalResponse } from "./types";

class Dto {
  static createDefaultApprovalResponse = (): ProductApprovalResponse => ({
    result: ApprovalStatus.APPROVED,
    note: "Product approved",
    imageResult: {
      shouldBeRejected: false,
      weight: 0,
      hasDimensions: false,
      description: ""
    },
    nameResult: {
      semanticRelevance: 0,
      shouldBeRejected: false,
      hasDimensions: false,
      weight: 0
    },
    categoryResult: {
      semanticRelevance: 0,
      suggestedCategory: {
        idProdFormat: 0,
        prodFormatName: ""
      }
    },
    descriptionResult: {
      semanticRelevance: 0,
      shouldBeRejected: false,
      hasDimensions: false,
      weight: 0
    }
  });

  static validateAllParameters = (params: {
    imageUrl?: string;
    name?: string;
    category?: string;
    description?: string;
  }) => {
    // Check required fields
    if (
      !params.imageUrl ||
      !params.name ||
      !params.category ||
      !params.description
    ) {
      return {
        isValid: false,
        error: "imageUrl, name, category, and description are required"
      };
    }

    // Validate imageUrl format
    try {
      const url = new URL(params.imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          isValid: false,
          error: "imageUrl must be a valid HTTP or HTTPS URL"
        };
      }
    } catch {
      return { isValid: false, error: "imageUrl must be a valid URL" };
    }

    // Validate string lengths
    if (params.name.trim().length < 3 || params.name.trim().length > 300) {
      return {
        isValid: false,
        error: "name must be between 3 and 200 characters"
      };
    }

    if (
      params.category.trim().length < 2 ||
      params.category.trim().length > 100
    ) {
      return {
        isValid: false,
        error: "category must be between 2 and 100 characters"
      };
    }

    if (
      params.description.trim().length < 10 ||
      params.description.trim().length > 4000
    ) {
      return {
        isValid: false,
        error: "description must be between 10 and 1000 characters"
      };
    }

    return { isValid: true, error: null };
  };
}

export default Dto;
