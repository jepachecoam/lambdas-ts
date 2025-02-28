import Joi from "joi";
import { OrderStatuses, OrderParentStatus } from "./enums";
export const validateOrderTableFilters = (payload: unknown) => {
  const schema = Joi.object({
    startDate: Joi.string().isoDate().optional(),
    finalDate: Joi.string().isoDate().optional(),
    searchBy: Joi.string().optional(),
    search: Joi.string().optional(),
    status: Joi.string()
      .valid(...Object.values(OrderStatuses))
      .required(),
    statusParent: Joi.string()
      .valid(...Object.values(OrderParentStatus))
      .required(),
    confirmationStatusId: Joi.number().integer().optional(),
    carrier: Joi.string().optional(),
    warehouse: Joi.string().optional(),
    paymentMethod: Joi.string().valid("cod", "pia").optional(),
    idBusiness: Joi.number().integer().required(),
    roleType: Joi.string().optional(),
    limit: Joi.number().integer().min(1).optional().default(10),
    offset: Joi.number().integer().min(0).optional().default(0)
  });

  return schema.validate(payload, { abortEarly: false });
};
