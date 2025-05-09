enum Carriers {
  tcc = "tcc",
  envia = "envia",
  swayp = "swayp",
  interRapidisimo = "interrapidisimo",
  coordinadora = "coordinadora"
}

enum EnviaCarrierStatusUpdateIds {
  SolucionadoEnMalla = 259,
  Redireccionando = 266
}

enum SwaypStatusUpdateIds {
  Novedad = 236,
  Cancelacion = 239,
  Cancelada = 240
}

enum OrderSourcesTypes {
  Order = "order",
  OrderReturn = "orderReturn"
}

export default {
  Carriers,
  EnviaCarrierStatusUpdateIds,
  SwaypStatusUpdateIds,
  OrderSourcesTypes
};
