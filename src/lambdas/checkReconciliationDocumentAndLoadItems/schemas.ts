import { ValidationRule } from "./types";

const paymentSchema: ValidationRule[] = [
  {
    header: "Id transportadora*",
    key: "idCarrier",
    type: "number",
    required: true
  },
  {
    header: "Numero de Guia *",
    key: "carrierTrackingCode",
    type: "string",
    required: true,
    pattern: /^\d+$/
  },
  {
    header: "Fecha de recaudo *",
    key: "collectionDate",
    type: "date",
    required: true
  },
  {
    header: "Observaciones",
    key: "notes",
    type: "string",
    required: false
  },
  {
    header: "Medio de pago *",
    key: "paymentMethod",
    type: "enum",
    required: true,
    enumValues: ["Efectivo", "Tarjeta"]
  },
  { header: "Valor *", key: "amount", type: "decimal", required: true },
  {
    header: "Fecha de pago *",
    key: "paymentDate",
    type: "date",
    required: true
  }
];

export default { paymentSchema };
