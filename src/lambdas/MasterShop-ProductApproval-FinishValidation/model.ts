import Dao from "./dao";
import {
  ProcessedEventData,
  TicketStatus,
  Validation,
  ValidationData,
  ValidationFailure,
  ValidationStatus,
  ValidationType,
  Validator,
  VariantValidation
} from "./types";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async sendToSlack(payload: object): Promise<void> {
    await this.dao.sendToSlack(payload);
  }

  async sendError({
    lastValidator,
    idTicket,
    observations
  }: {
    lastValidator: Validator;
    idTicket: number;
    observations: string;
  }) {
    await this.dao.updateProductValidationProcess(idTicket, {
      lastValidator,
      status: ValidationStatus.UNDER_REVIEW,
      validations: {
        process: [
          {
            key: ValidationFailure.HAS_ERROR,
            type: ValidationType.UNDER_REVIEW
          }
        ]
      }
    });

    await this.dao.updateTicket({
      idTicket,
      status: TicketStatus.ON_HOLD,
      observations
    });
  }

  async process(data: ProcessedEventData) {
    const {
      origin,
      idProduct,
      idUser,
      result,
      idTicket,
      validations,
      suggestions,
      note
    } = data;

    if (origin === Validator.HUMAN) {
      return await this.dao.updateProductValidationProcess(idTicket, {
        lastValidator: origin,
        status: result,
        humanComments: note
      });
    }

    if (origin !== Validator.CODE && origin !== Validator.AI) {
      throw new Error("Invalid source");
    }

    await this.dao.updateProductValidationProcess(idTicket, {
      lastValidator: origin,
      status: result,
      validations,
      suggestions
    });

    if (
      result === ValidationStatus.APPROVED &&
      suggestions?.category?.length &&
      suggestions.category.length > 0 &&
      suggestions.category[0].id
    ) {
      await this.dao.updateProductCategory({
        idProduct,
        idProdFormat: suggestions.category[0].id
      });
    }

    const observations = this.getObservations(result, validations);
    if (
      [ValidationStatus.APPROVED, ValidationStatus.REJECTED].includes(result)
    ) {
      const responseUpdateProductStatus = await this.dao.updateProductStatus({
        idProduct,
        idUser,
        status: result,
        adminObservations: observations
      });

      await this.dao.changesModules({
        idProduct,
        idUser,
        status: result,
        observations,
        outputResponse: responseUpdateProductStatus
      });
    }

    const ticketStatus =
      result === ValidationStatus.UNDER_REVIEW
        ? TicketStatus.ON_HOLD
        : TicketStatus.COMPLETED;

    await this.dao.updateTicket({
      idTicket,
      status: ticketStatus,
      observations
    });
  }

  getObservations(
    result: ValidationStatus,
    validations: ValidationData
  ): string {
    if (
      ![
        ValidationStatus.UNDER_REVIEW,
        ValidationStatus.APPROVED,
        ValidationStatus.REJECTED
      ].includes(result)
    ) {
      return "";
    }

    if (result === ValidationStatus.APPROVED) {
      return `¡Enhorabuena! Tu producto ha sido aprobado con éxito. 
      Estamos aquí para apoyarte en cada paso del camino. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. 
      Importante: El producto ha sido habilitado para uso interno y/o de dropshippers, según la configuración actual. Si deseas modificar su visibilidad, puedes editarla desde la sección de configuración del producto. 
      ¡Adelante y mucho éxito en tus ventas!`;
    }

    if (result === ValidationStatus.REJECTED) {
      return this.buildValidationObservations(
        "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n",
        validations
      );
    }

    return this.buildValidationObservations(
      "El producto requiere revisión. A continuación, se detallan las validaciones encontradas:\n",
      validations,
      false
    );
  }

  private buildValidationObservations(
    header: string,
    validations: ValidationData,
    onlyRejected: boolean = true
  ): string {
    let observations = header;

    for (const [field, issues] of Object.entries(validations)) {
      if (!Array.isArray(issues) || issues.length === 0) continue;

      if (field === "variants" && this.isVariantValidation(issues[0])) {
        (issues as VariantValidation[]).forEach((variant) => {
          ["price", "weight", "stock"].forEach((prop) => {
            const propIssues = variant[
              prop as keyof VariantValidation
            ] as Validation[];
            const filteredIssues = onlyRejected
              ? propIssues.filter(
                  (issue) => issue.type === ValidationType.REJECTED
                )
              : propIssues;
            if (filteredIssues.length > 0) {
              const firstIssue = filteredIssues[0];
              const message = this.validationToLabel(firstIssue);
              const capitalizedMessage =
                message.charAt(0).toUpperCase() + message.slice(1);
              const fieldLabel = this.fieldToLabel(prop) || prop;
              const capitalizedFieldLabel =
                fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1);
              observations += `Variante(${variant.idVariant}) - ${capitalizedFieldLabel}: ${capitalizedMessage}\n`;
            }
          });
        });
      } else {
        const filteredIssues = onlyRejected
          ? (issues as Validation[]).filter(
              (issue) => issue.type === ValidationType.REJECTED
            )
          : (issues as Validation[]);
        if (filteredIssues.length > 0) {
          const firstIssue = filteredIssues[0];
          const message = this.validationToLabel(firstIssue);
          const capitalizedMessage =
            message.charAt(0).toUpperCase() + message.slice(1);
          const fieldLabel = this.fieldToLabel(field) || field;
          const capitalizedFieldLabel =
            fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1);
          observations += `${capitalizedFieldLabel}: ${capitalizedMessage}\n`;
        }
      }
    }

    return observations;
  }

  private isVariantValidation(item: any): item is VariantValidation {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.idVariant === "string" &&
      Array.isArray(item.price) &&
      Array.isArray(item.weight) &&
      Array.isArray(item.stock)
    );
  }

  validationToLabel(validation: Validation) {
    let message = "";
    switch (validation.key) {
      case ValidationFailure.IS_NULL:
        message = "es obligatorio";
        break;
      case ValidationFailure.IS_JUST_NUMERIC:
        message = "no puede contener solo números";
        break;
      case ValidationFailure.IS_TOO_SHORT:
        message = "es demasiado corto";
        break;
      case ValidationFailure.INVALID_FORMAT:
        message = "tiene un formato inválido";
        break;
      case ValidationFailure.NOT_POSITIVE:
        message = "debe ser mayor a cero";
        break;
      case ValidationFailure.IS_NEGATIVE:
        message = "debe ser mayor o igual a cero";
        break;
      case ValidationFailure.EXCEEDS_LIMIT:
        message = "excede el límite";
        break;
      case ValidationFailure.HAS_DIMENSIONS:
        message = "tiene dimensiones";
        break;
      case ValidationFailure.SEMANTIC_RELEVANCE:
        message = "no coincide con los demás datos";
        break;
      case ValidationFailure.HAS_ERROR:
        message = "no completado";
        break;
      case ValidationFailure.IS_BLACK_LISTED:
        message = "contiene información prohibida.";
        break;
    }

    if (validation.whiteList && validation.whiteList.length > 0) {
      message += ` (permitidos: ${validation.whiteList.join(", ")})`;
    }

    if (validation.minLength) {
      message += ` (mínimo ${validation.minLength} caracteres)`;
    }

    return message;
  }

  fieldToLabel(field: string) {
    switch (field) {
      case "name":
        return "nombre";
      case "description":
        return "descripción";
      case "urlImageProduct":
        return "imagen del producto";
      case "category":
        return "categoría";

      case "publicProfile":
        return "perfil público";
      case "warrantyContactInfo":
        return "medios de contacto para garantía";
      case "suggestedPrice":
        return "precio sugerido";
      case "warrantyConditions":
        return "condiciones de garantía";
      case "warrantyPeriod":
        return "período de garantía";
      case "publicName":
        return "nombre público";
      case "profileDescription":
        return "descripción del perfil";
      case "profileImage":
        return "imagen del perfil";
      case "whatsapp":
        return "whatsapp";
      case "hasWhatsapp":
        return "tiene whatsapp";

      case "idVariant":
        return "id variante";
      case "price":
        return "precio";
      case "weight":
        return "peso";
      case "stock":
        return "stock";

      case "process":
        return "validación";
    }
  }
}

export default Model;
