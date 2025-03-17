const getParams = ({ event }: any) => {
  console.log("Event =>>>", JSON.stringify(event));

  const dataEvent = event.detail.data.dataEvent.eventInfo.dataEvent;
  const environment = event.detail.parameters.stage;

  if (!dataEvent || !environment) {
    throw new Error("Missing data in event");
  }

  return {
    action: event.blacklistAction,
    idBlacklistReason: event.idBlacklistReason,
    environment: environment,
    idUser: dataEvent.idUser,
    idBusiness: dataEvent.idBusiness
  };
};

export default { getParams };
