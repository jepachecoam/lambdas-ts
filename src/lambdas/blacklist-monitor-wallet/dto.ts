const getParams = ({ event }: any) => {
  console.log("Event =>>>", event);
  console.log("Movement =>>>", event.detail?.movement?.body);
  return {
    action: event.blacklistAction,
    idUser: event.detail.idUser,
    idBusiness: event.detail.idBusiness,
    idBlacklistReason: event.idBlacklistReason
  };
};

export default { getParams };
