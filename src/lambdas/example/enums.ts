export enum EnvVariables {
  DB_HOST = "DB_HOST",
  DB_USER = "DB_USER",
  DB_PASSWORD = "DB_PASSWORD",
  DB_NAME = "DB_NAME"
}

export enum OrderStatuses {
  PorConfirmar = "Por confirmar",
  Pendiente = "Pendiente",
  EnAlistamiento = "En alistamiento",
  PorRecolectar = "Por recolectar",
  Recolectada = "Recolectada",
  EnTransito = "En tránsito",
  ConNovedad = "Con novedad",
  Entregada = "Entregada",
  Cancelada = "Cancelada",
  Devuelta = "Devuelta",
  Garantia = "Garantía"
}

export enum OrderParentStatus {
  PorPreparar = "PorPreparar",
  EnPreparacion = "EnPreparacion",
  EnTransito = "EnTransito",
  Finalizadas = "Finalizadas"
}

export enum roleType {
  Dropshipper = "Dropshipper",
  Supplier = "Supplier",
  BrandOwner = "BrandOwner"
}

export type OrderTableFilters = {
  startDate?: string;
  finalDate?: string;
  searchBy?: string;
  search?: string;
  status?: OrderStatuses;
  statusParent: OrderParentStatus;
  confirmationStatusId?: number;
  carrier?: string;
  warehouse?: string;
  paymentMethod?: "cod" | "pia";
  pageSize?: number;
  pageNumber?: number;
  idBusiness: number;
  roleType?: string;
  limit: number;
  offset: number;
};
