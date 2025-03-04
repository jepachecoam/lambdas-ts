import Joi from "joi";

import {
  Carrier,
  OrderBy,
  OrderParentStatus,
  OrderStatuses,
  RoleType
} from "./interfaces";
export const validateOrderTableFilters = (payload: unknown) => {
  const schema = Joi.object({
    idOrder: Joi.number().integer().min(1).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    productName: Joi.string().optional(),
    startDate: Joi.string().isoDate().optional(),
    finalDate: Joi.string().isoDate().optional(),
    orderStatus: Joi.string()
      .valid(...Object.values(OrderStatuses))
      .required(),
    orderStatusParent: Joi.string()
      .valid(...Object.values(OrderParentStatus))
      .required(),
    idConfirmationStatus: Joi.number().integer().min(1).optional(),
    carrier: Joi.string()
      .valid(...Object.values(Carrier))
      .optional(),
    idWarehouses: Joi.string()
      .pattern(/^\d+(,\d+)*$/)
      .optional(),
    paymentMethod: Joi.string().optional(),
    idBusiness: Joi.number().integer().min(1).required(),
    roleType: Joi.string()
      .valid(...Object.values(RoleType))
      .optional(),
    pageSize: Joi.number().integer().min(1).required().default(10),
    pageNumber: Joi.number().integer().min(1).required().default(0),
    orderBy: Joi.string()
      .valid(...Object.values(OrderBy))
      .optional()
  });

  return schema.validate(payload, { abortEarly: false });
};
