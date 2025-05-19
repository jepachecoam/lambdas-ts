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

const chargeSchema: ValidationRule[] = [
  {
    header: "ID transportadora *",
    key: "idCarrier",
    type: "number",
    required: true
  },
  {
    header: "# de factura *",
    key: "invoiceNumber",
    type: "string",
    required: true
  },
  {
    header: "Guia *",
    key: "carrierTrackingCode",
    type: "string",
    required: true,
    pattern: /^\d+$/
  },
  {
    header: "Fecha*",
    key: "chargeDate ",
    type: "date",
    required: true
  },
  {
    header: "Unidades *",
    key: "units",
    type: "number",
    required: true
  },
  {
    header: "Peso real *",
    key: "realWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Peso Volumen *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Peso Liquidado *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Valor declarado *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Flete Fijo *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Flete Variable *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Flete Total *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Comision de recaudo *",
    key: "volumeWeight",
    type: "decimal",
    required: true
  },
  {
    header: "Servicio / Unidad de negocio",
    key: "volumeWeight",
    type: "decimal",
    required: false
  },
  {
    header: "Observaciones",
    key: "notes",
    type: "string",
    required: false
  },
  {
    header: "Total *",
    key: "total",
    type: "decimal",
    required: true
  }
];

export default { paymentSchema, chargeSchema };
