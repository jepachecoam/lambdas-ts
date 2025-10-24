export interface ImageAnalysis {
  shouldBeRejected: boolean;
  weight: number;
  hasDimensions: boolean;
  description: string;
}

export interface INameResult {
  semanticRelevance: number;
  shouldBeRejected: boolean;
  hasDimensions: boolean;
  weight: number;
}

export interface IDescriptionResult {
  semanticRelevance: number;
  shouldBeRejected: boolean;
  hasDimensions: boolean;
  weight: number;
}

export interface ICategoryResult {
  semanticRelevance: number;
  suggestedCategory: {
    idProdFormat: number;
    prodFormatName: string;
  };
}

export interface AnalysisResponse {
  result: "approved" | "rejected" | "underReview";
  note: string;
  imgResult: ImageAnalysis;
  nameResult: INameResult;
  categoryResult: ICategoryResult;
  descriptionResult: IDescriptionResult;
}

export interface ImageAnalysisResponse {
  result: "approved" | "rejected" | "underReview";
  note: string;
  imgResult: ImageAnalysis;
}

export interface BedrockAnalysis {
  description: string;
  isProhibited: boolean;
  prohibitedReason?: string;
  weightKg: number;
  hasDimensions: boolean;
}

export interface TextAnalysisResult {
  nameResult: INameResult;
  categoryResult: ICategoryResult;
  descriptionResult: IDescriptionResult;
}
