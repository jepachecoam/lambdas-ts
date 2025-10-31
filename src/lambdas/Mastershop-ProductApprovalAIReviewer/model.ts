import Dao from "./dao";
import {
  CategoryAnalysisResult,
  DescriptionAnalysisResult,
  ImageAnalysisResult,
  NameAnalysisResult,
  ProductApprovalRequest,
  ProductApprovalResponse,
  Validation,
  ValidationFailure,
  ValidationType
} from "./types";

class Model {
  private dao: Dao = new Dao();

  processProductApproval = async ({
    imageUrl,
    name,
    category,
    description
  }: ProductApprovalRequest): Promise<ProductApprovalResponse> => {
    const response: ProductApprovalResponse = {
      validations: {
        name: [],
        description: [],
        urlImageProduct: [],
        category: []
      },
      suggestions: {
        name: [],
        description: [],
        urlImageProduct: [],
        category: []
      }
    };

    // Step 1: Image Analysis
    const imageAnalysisResult = await this.dao.performImageAnalysis(imageUrl);
    response.validations.urlImageProduct =
      this.applyImageValidationRules(imageAnalysisResult);

    if (this.hasRejectedOrUnderReviewed(response.validations.urlImageProduct)) {
      return response;
    }

    // Step 2: Name Analysis
    const nameAnalysisResult = await this.dao.performNameAnalysis(
      imageAnalysisResult.description,
      name
    );
    response.validations.name =
      this.applyNameValidationRules(nameAnalysisResult);

    if (this.hasRejectedOrUnderReviewed(response.validations.name)) {
      return response;
    }

    // Step 3: Description Analysis
    const descriptionAnalysisResult = await this.dao.performDescriptionAnalysis(
      imageAnalysisResult.description,
      description
    );
    response.validations.description = this.applyDescriptionValidationRules(
      descriptionAnalysisResult
    );

    if (this.hasRejectedOrUnderReviewed(response.validations.description)) {
      return response;
    }

    // Step 4: Category Analysis
    const categoryAnalysisResult = await this.dao.performCategoryAnalysis(
      imageAnalysisResult.description,
      category
    );
    response.suggestions.category = this.applyCategorySuggestionRules(
      categoryAnalysisResult
    );

    return response;
  };

  private applyImageValidationRules = (
    result: ImageAnalysisResult
  ): Validation[] => {
    const validations: Validation[] = [];

    if (result.isBlacklisted) {
      validations.push({
        key: ValidationFailure.IS_BLACKLISTED,
        type: ValidationType.REJECTED
      });
    }

    if (result.weightKg > 1) {
      validations.push({
        key: ValidationFailure.EXCEEDS_LIMIT,
        type: ValidationType.UNDER_REVIEWED
      });
    }

    if (result.hasDimensions) {
      validations.push({
        key: ValidationFailure.HAS_DIMENSIONS,
        type: ValidationType.UNDER_REVIEWED
      });
    }

    return validations;
  };

  private applyNameValidationRules = (
    result: NameAnalysisResult
  ): Validation[] => {
    const validations: Validation[] = [];

    if (result.isBlacklisted) {
      validations.push({
        key: ValidationFailure.IS_BLACKLISTED,
        type: ValidationType.REJECTED
      });
    }

    if (result.semanticRelevance < 60) {
      validations.push({
        key: ValidationFailure.SEMANTIC_RELEVANCE,
        type: ValidationType.REJECTED
      });
    }

    if (result.weight > 1) {
      validations.push({
        key: ValidationFailure.EXCEEDS_LIMIT,
        type: ValidationType.UNDER_REVIEWED
      });
    }

    if (result.hasDimensions) {
      validations.push({
        key: ValidationFailure.HAS_DIMENSIONS,
        type: ValidationType.UNDER_REVIEWED
      });
    }

    return validations;
  };

  private applyDescriptionValidationRules = (
    result: DescriptionAnalysisResult
  ): Validation[] => {
    const validations: Validation[] = [];

    if (result.isBlacklisted) {
      validations.push({
        key: ValidationFailure.IS_BLACKLISTED,
        type: ValidationType.REJECTED
      });
    }

    if (result.semanticRelevance < 60) {
      validations.push({
        key: ValidationFailure.SEMANTIC_RELEVANCE,
        type: ValidationType.REJECTED
      });
    }

    if (result.weight > 1) {
      validations.push({
        key: ValidationFailure.EXCEEDS_LIMIT,
        type: ValidationType.UNDER_REVIEWED
      });
    }

    if (result.hasDimensions) {
      validations.push({
        key: ValidationFailure.HAS_DIMENSIONS,
        type: ValidationType.UNDER_REVIEWED
      });
    }

    return validations;
  };

  private applyCategorySuggestionRules = (
    result: CategoryAnalysisResult
  ): any[] => {
    const suggestions: any[] = [];

    if (result.semanticRelevance < 60) {
      suggestions.push({
        id: result.suggestedCategory.idProdFormat,
        label: result.suggestedCategory.prodFormatName
      });
    }

    return suggestions;
  };

  private hasRejectedOrUnderReviewed = (validations: Validation[]): boolean => {
    return validations.length > 0;
  };
}

export default Model;
