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
  PorPreparar = "Por preparar",
  EnPreparacion = "En preparación",
  EnTransito = "En tránsito",
  Finalizadas = "Finalizadas"
}

export enum RoleType {
  Dropshipper = "Dropshipper",
  Supplier = "Supplier",
  BrandOwner = "BrandOwner"
}

export enum Carrier {
  Coordinadora = "Coordinadora",
  TCC = "TCC",
  Envia = "Envia",
  Swayp = "Swayp",
  Interrapidisimo = "Interrapidisimo",
  Domina = "Domina"
}

export enum OrderBy {
  MostRecent = "mostRecent",
  LeastRecent = "leastRecent",
  HighestPrice = "highestPrice",
  LowestPrice = "lowestPrice"
}

export type OrderTableFilters = {
  idOrder?: number;
  email?: string;
  phone?: string;
  clientName?: string;
  productName?: string;
  startDate?: string;
  finalDate?: string;
  orderStatus?: OrderStatuses;
  orderStatusParent: OrderParentStatus;
  idConfirmationStatus?: number;
  carrier?: Carrier;
  idWarehouses?: string;
  paymentMethod?: string;
  idBusiness: number;
  idUser: number;
  roleType?: string;
  limit: number;
  offset: number;
  orderBy?: OrderBy;
};
