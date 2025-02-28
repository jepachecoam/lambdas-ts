const dtoResponseWithOffsetGreaterThanZero = (response: unknown) => {
  return {
    totalOrders: null,
    data: response
  };
};

export default { dtoResponseWithOffsetGreaterThanZero };
