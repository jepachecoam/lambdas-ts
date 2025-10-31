export interface ProductApprovalRequest {
  imageUrl: string;
  name: string;
  category: string;
  description: string;
}

export interface ImageAnalysisResult {
  description: string;
  isBlacklisted: boolean;
  weightKg: number;
  hasDimensions: boolean;
}

export interface NameAnalysisResult {
  semanticRelevance: number;
  isBlacklisted: boolean;
  hasDimensions: boolean;
  weight: number;
}

export interface DescriptionAnalysisResult {
  semanticRelevance: number;
  isBlacklisted: boolean;
  hasDimensions: boolean;
  weight: number;
}

export interface CategoryAnalysisResult {
  semanticRelevance: number;
  suggestedCategory: {
    idProdFormat: number;
    prodFormatName: string;
  };
}

/* eslint-disable unused-imports/no-unused-vars */
export enum ValidationFailure {
  IS_BLACKLISTED = "isBlacklisted",
  HAS_DIMENSIONS = "hasDimensions",
  SEMANTIC_RELEVANCE = "semanticRelevance",
  EXCEEDS_LIMIT = "exceedsLimit"
}

export enum ValidationType {
  REJECTED = "rejected",
  UNDER_REVIEWED = "underReviewed"
}

export interface Validation {
  key: ValidationFailure;
  type: ValidationType;
}

export interface BasicFieldsValidation {
  name: Validation[];
  description: Validation[];
  urlImageProduct: Validation[];
  category: Validation[];
}

export interface BasicFieldsSuggestions {
  name: any[];
  description: any[];
  urlImageProduct: any[];
  category: any[];
}

export interface ProductApprovalResponse {
  validations: BasicFieldsValidation;
  suggestions: BasicFieldsSuggestions;
}
/* eslint-enable unused-imports/no-unused-vars */
