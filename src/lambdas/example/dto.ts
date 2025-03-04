const dtoOrders = (payload: unknown, _params: any) => {
  return {
    totalOrders: null,
    totalSales: null,
    data: payload
  };
};

const dtoGetOrders = (payload: unknown) => {
  if (Array.isArray(payload)) {
    const haveNextPage = payload.length > 0;
    return {
      haveNextPage: haveNextPage,
      ...payload
    };
  } else {
    throw new Error("Payload is not valid");
  }
};

export default { dtoOrders, dtoGetOrders };
