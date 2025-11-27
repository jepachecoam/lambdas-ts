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
    console.log("imageAnalysisResult >>>", imageAnalysisResult);
    response.validations.urlImageProduct =
      this.applyImageValidationRules(imageAnalysisResult);

    if (this.hasRejectedOrUnderReview(response.validations.urlImageProduct)) {
      return response;
    }

    // Step 2: Name Analysis
    const nameAnalysisResult = await this.dao.performNameAnalysis(
      imageAnalysisResult.description,
      name
    );
    console.log("nameAnalysisResult >>>", nameAnalysisResult);

    response.validations.name =
      this.applyNameValidationRules(nameAnalysisResult);

    if (this.hasRejectedOrUnderReview(response.validations.name)) {
      return response;
    }

    // Step 3: Description Analysis
    const descriptionAnalysisResult = await this.dao.performDescriptionAnalysis(
      imageAnalysisResult.description,
      description
    );
    console.log("descriptionAnalysisResult >>>", descriptionAnalysisResult);

    response.validations.description = this.applyDescriptionValidationRules(
      descriptionAnalysisResult
    );

    if (this.hasRejectedOrUnderReview(response.validations.description)) {
      return response;
    }

    // Step 4: Category Analysis
    const categoryAnalysisResult = await this.dao.performCategoryAnalysis(
      imageAnalysisResult.description,
      category
    );
    console.log("categoryAnalysisResult >>>", categoryAnalysisResult);

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
        type: ValidationType.UNDER_REVIEW
      });
    }

    if (result.hasDimensions) {
      validations.push({
        key: ValidationFailure.HAS_DIMENSIONS,
        type: ValidationType.UNDER_REVIEW
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

    if (result.semanticRelevance < 50) {
      validations.push({
        key: ValidationFailure.SEMANTIC_RELEVANCE,
        type: ValidationType.REJECTED
      });
    }

    if (result.weight > 1) {
      validations.push({
        key: ValidationFailure.EXCEEDS_LIMIT,
        type: ValidationType.UNDER_REVIEW
      });
    }

    if (result.hasDimensions) {
      validations.push({
        key: ValidationFailure.HAS_DIMENSIONS,
        type: ValidationType.UNDER_REVIEW
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

    if (result.semanticRelevance < 50) {
      validations.push({
        key: ValidationFailure.SEMANTIC_RELEVANCE,
        type: ValidationType.REJECTED
      });
    }

    if (result.weight > 1) {
      validations.push({
        key: ValidationFailure.EXCEEDS_LIMIT,
        type: ValidationType.UNDER_REVIEW
      });
    }

    if (result.hasDimensions) {
      validations.push({
        key: ValidationFailure.HAS_DIMENSIONS,
        type: ValidationType.UNDER_REVIEW
      });
    }

    return validations;
  };

  private applyCategorySuggestionRules = (
    result: CategoryAnalysisResult
  ): any[] => {
    const suggestions: any[] = [];

    if (result.semanticRelevance < 50) {
      suggestions.push({
        id: result.suggestedCategory.idProdFormat,
        label: result.suggestedCategory.prodFormatName
      });
    }

    return suggestions;
  };

  private hasRejectedOrUnderReview = (validations: Validation[]): boolean => {
    return validations.length > 0;
  };
}

export default Model;
