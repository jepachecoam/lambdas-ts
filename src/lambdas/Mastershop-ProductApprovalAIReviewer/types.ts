/* eslint-disable unused-imports/no-unused-vars */
export enum ApprovalStatus {
  APPROVED = "approved",
  REJECTED = "rejected",
  UNDER_REVIEW = "underReview"
}

export const APPROVAL_THRESHOLDS = {
  SEMANTIC_RELEVANCE_MIN: 30,
  SEMANTIC_RELEVANCE_LOW: 60,
  WEIGHT_LIMIT_KG: 1
} as const;

export interface ProductApprovalRequest {
  imageUrl: string;
  name: string;
  category: string;
  description: string;
}

export interface ImageAnalysisResult {
  shouldBeRejected: boolean;
  weight: number;
  hasDimensions: boolean;
  description: string;
}

export interface NameAnalysisResult {
  semanticRelevance: number;
  shouldBeRejected: boolean;
  hasDimensions: boolean;
  weight: number;
}

export interface DescriptionAnalysisResult {
  semanticRelevance: number;
  shouldBeRejected: boolean;
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

export interface ProductApprovalResponse {
  result: ApprovalStatus;
  note: string;
  imageResult: ImageAnalysisResult;
  nameResult: NameAnalysisResult;
  categoryResult: CategoryAnalysisResult;
  descriptionResult: DescriptionAnalysisResult;
}

export interface ImageApprovalResponse {
  result: ApprovalStatus;
  note: string;
  imageResult: ImageAnalysisResult;
}

export interface BedrockImageAnalysis {
  description: string;
  isProhibited: boolean;
  prohibitedReason?: string;
  weightKg: number;
  hasDimensions: boolean;
}

export interface TextAnalysisResult {
  nameResult: NameAnalysisResult;
  categoryResult: CategoryAnalysisResult;
  descriptionResult: DescriptionAnalysisResult;
}
