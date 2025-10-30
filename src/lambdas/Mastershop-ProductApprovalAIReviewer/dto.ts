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
}

export default Dto;
