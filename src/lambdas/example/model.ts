import dao from "./dao";
import dto from "./dto";

const getOrders = async (idUser: number, params: any) => {
  const orders = await dao.getOrders({ idUser, ...params });

  return params.pageNumber === 1
    ? orders
    : dto.dtoOrders(orders, params.orderBy);
};

export default { getOrders };
