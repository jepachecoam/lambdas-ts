import dto from "./dto";
import Model from "./model";
import { InputEvent, TicketStatus, ValidationStatus, Validator } from "./types";

export const handler = async (event: InputEvent) => {
  try {
    console.log("event :>>>", JSON.stringify(event));
    const createResponse = (validations: any, category: any) => {
      return {
        statusCode: 200,
        origin: Validator.CODE,
        result: dto.determineResult(validations),
        validations,
        category
      };
    };

    const {
      failures,
      environment,
      idProduct,
      idTicket,
      idBusiness,
      affiliationsActive
    } = dto.validateRequiredFields(event);
    if (failures.length > 0) {
      throw new Error(failures.join(", "));
    }

    const model = new Model(environment);

    await model.updateTicket({
      idTicket,
      status: TicketStatus.IN_PROGRESS,
      observations: "Procesando..."
    });

    const existingProcess = await model.getOpenValidationProcess({
      idTicket
    });
    if (existingProcess) {
      return {
        statusCode: 409,
        error: "Ticket already has an open validation process"
      };
    }

    await model.createProductValidationProcess({
      idProduct,
      idTicket,
      lastValidator: Validator.CODE,
      status: ValidationStatus.PROCESSING
    });

    let validations: any = dto.validateBasicFields(event);

    let result = dto.determineResult(validations);
    if (result === "rejected") return createResponse(validations, null);

    let [variants, productFormat] = await Promise.all([
      model.getProductVariants({ idProduct }),
      model.getProductFormat({ idProdFormat: event.idProdFormat })
    ]);
    if (!productFormat) throw new Error("Product format not found");
    if (!variants || variants.length === 0) {
      throw new Error("Product variants not found");
    }
    if (variants.length > 1) {
      variants = variants.filter((variant) => variant.name !== "Default Title");
    }

    if (affiliationsActive) {
      const publicProfile = await model.getPublicProfileByBusiness({
        idBusiness
      });

      const validateAffiliationFields = dto.validateAffiliationFields(
        event,
        publicProfile
      );
      validations = {
        ...validations,
        ...validateAffiliationFields
      };

      result = dto.determineResult(validations);
      if (result === "rejected") {
        return createResponse(validations, productFormat.prodFormatName);
      }
    }

    const validateVariants = dto.validateVariants(variants);

    validations = {
      ...validations,
      variants: validateVariants
    };
    result = dto.determineResult(validations);

    return createResponse(validations, productFormat.prodFormatName);
  } catch (error: any) {
    console.error("ErrorLog =>>>", error);
    return {
      statusCode: 500,
      error: error.message
    };
  }
};
