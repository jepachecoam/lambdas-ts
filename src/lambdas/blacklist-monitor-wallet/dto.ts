const getParams = ({ event }: any) => {
  console.log("Event =>>>", JSON.stringify(event));

  const {
    detail,
    stage: environment,
    blacklistAction: action,
    idBlacklistReason
  } = event;

  const idBusiness = detail?.idBusiness;
  const idUser = detail?.idUser;

  const missingFields = [];

  if (!detail) missingFields.push("dataEvent");
  if (!environment) missingFields.push("environment");
  if (!action) missingFields.push("action");
  if (!idBlacklistReason) missingFields.push("idBlacklistReason");
  if (!idBusiness) missingFields.push("idBusiness");
  if (!idUser) missingFields.push("idUser");

  if (missingFields.length > 0) {
    throw new Error(`Missing data in event: ${missingFields.join(", ")}`);
  }

  return {
    action: action,
    idBlacklistReason: idBlacklistReason,
    environment: environment,
    idUser: idUser,
    idBusiness: idBusiness
  };
};

export default { getParams };
