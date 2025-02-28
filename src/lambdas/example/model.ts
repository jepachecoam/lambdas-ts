import dao from "./dao";
import dto from "./dto";

const getOrders = async (params: any) => {
  const response = await dao.getOrders(params);
  if (params.offset > 0) {
    return dto.dtoResponseWithOffsetGreaterThanZero(response);
  } else {
    return response;
  }
};

export default { getOrders };
