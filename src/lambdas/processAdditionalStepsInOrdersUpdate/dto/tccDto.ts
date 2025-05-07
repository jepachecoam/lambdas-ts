const findMatches = ({ ordersIncidentsMs, ordersIncidentsTcc }: any) => {
  const matches: any = [];

  ordersIncidentsMs.forEach((order: any) => {
    const { idOrder, idCarrierStatusUpdate, carrierTrackingCode } = order;

    const matchingAccounts = ordersIncidentsTcc.filter(
      (account: any) => account.numeroremesa === carrierTrackingCode
    );

    if (matchingAccounts.length > 0) {
      const latestAccount = matchingAccounts.reduce(
        (latest: any, current: any) =>
          new Date(latest.fechaplanteanovedad) >
          new Date(current.fechaplanteanovedad)
            ? latest
            : current
      );

      matches.push({
        idOrder,
        idCarrierStatusUpdate,
        incidentId: latestAccount.idnovedad,
        incidentData: latestAccount
      });
    }
  });

  return matches.length > 0 ? matches : null;
};

export default { findMatches };
