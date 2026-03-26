const extractParams = (event: any) => {
  const environment: string = event?.detail?.parameters?.stage;

  const idOrder: number = event?.detail?.id_order;

  if (!environment || !idOrder) {
    throw new Error("Data not found");
  }

  return {
    idOrder,
    environment
  };
};

export default {
  extractParams
};
