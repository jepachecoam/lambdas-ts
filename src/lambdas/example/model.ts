import dao from "./dao";
import dto from "./dto";

const getOrders = async (idUser: number, params: any) => {
  const orders = await dao.getOrders({ idUser, ...params });

  return dto.dtoOrders(orders, params);
};

export default { getOrders };
