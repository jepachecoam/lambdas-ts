enum Carriers {
  tcc = "tcc",
  envia = "envia",
  swayp = "swayp",
  interRapidisimo = "interrapidisimo",
  coordinadora = "coordinadora"
}

enum EnviaCarrierStatusUpdate {
  SolucionadoEnMalla = 259,
  Redireccionando = 266
}

export default { Carriers, EnviaCarrierStatusUpdate };
