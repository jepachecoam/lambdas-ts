import dao from "./dao";
import dto from "./dto";

const getOrders = async (idUser: number, params: any) => {
  const response = await dao.getOrders({ idUser, ...params });
  if (params.offset > 0) {
    return dto.dtoResponseWithOffsetGreaterThanZero(response);
  } else {
    return response;
  }
};

export default { getOrders };
