const getParams = ({ event }: any) => {
  console.log("Event =>>>", JSON.stringify(event));

  const dataEvent = event?.detail?.data?.dataEvent?.eventInfo?.dataEvent;
  const environment = event?.detail?.parameters?.stage;
  const action = event?.blacklistAction;
  const idBlacklistReason = event?.idBlacklistReason;
  const idBusiness = dataEvent?.idBusiness;
  const idUser = dataEvent?.idUser;

  const missingFields = [];

  if (!dataEvent) missingFields.push("dataEvent");
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
