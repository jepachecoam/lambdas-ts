import { DtoParams, DtoPayload, Order, OrderBy } from "./validations/types";

const dtoOrders = (payload: any[], params: DtoParams): DtoPayload => {
  let totalOrders = null;
  let totalSales = null;
  let data: Order[] = [];
  let haveNextPage = false;

  if (params.pageNumber === 1) {
    if (!payload[0]?.data || payload[0]?.data.length === 0) {
      return { totalOrders, totalSales, haveNextPage, data };
    }

    totalOrders = payload[0]?.totalOrders ?? null;
    totalSales = payload[0]?.totalSales ?? null;

    data = payload[0]?.data ?? [];

    haveNextPage = data.length > params.pageSize;
    if (haveNextPage) {
      data.pop();
    }

    if (params.orderBy) {
      if (params.orderBy === OrderBy.LeastRecent) {
        data.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
      }
      if (params.orderBy === OrderBy.MostRecent) {
        data.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }
    }

    return { totalOrders, totalSales, haveNextPage, data };
  }

  if (payload.length > 0) {
    data = payload as Order[];
    haveNextPage = data.length > params.pageSize;
    if (haveNextPage) {
      data.pop();
    }
  }

  return { totalOrders, totalSales, haveNextPage, data };
};

export default { dtoOrders };
