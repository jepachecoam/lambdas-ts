import Dao from "./dao";
import { orderHistoryStatusTypesEnum, OrderSourceEnum } from "./types";
class Model {
  dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async getOrderSource({ carrierTrackingCode }: any) {
    const isOrderReturn = await this.dao.checkInOrderReturn({
      carrierTrackingCode
    });

    if (isOrderReturn) {
      return OrderSourceEnum.ORDER_RETURN;
    }

    const isOrder = await this.dao.checkInOrder({
      carrierTrackingCode
    });

    if (isOrder) {
      return OrderSourceEnum.ORDER;
    }

    const message = `llego una solucion de novedad de la guia ${carrierTrackingCode} pero no existe en la base de datos.`;

    console.log(message);

    await this.dao.sendAlertNotification({ message });

    return null;
  }

  async getShipmentData({ orderSource, carrierTrackingCode }: any) {
    let shipmentData: any = null;

    if (orderSource === OrderSourceEnum.ORDER) {
      shipmentData = await this.dao.getDataFromOrderHistory({
        carrierTrackingCode
      });
    } else {
      shipmentData = await this.dao.getDataFromOrderReturnHistory({
        carrierTrackingCode
      });
    }

    if (shipmentData?.status === orderHistoryStatusTypesEnum.RESOLVED) {
      console.log(
        `la novedad de la guia ${carrierTrackingCode} ya fue resuelta.`
      );
      return null;
    }

    if (!shipmentData) {
      const message = `no se encontro registro de novedad en carrierTrackingCodeHistory de la guia ${carrierTrackingCode} para actualizar.`;

      console.log(message);

      await this.dao.sendAlertNotification({ message });
      return null;
    }
    return shipmentData;
  }

  async saveConversation({ dataForSaveConversation }: any) {
    const {
      solution,
      userSolution,
      idShipmentUpdate,
      idOrderHistory,
      idOrder,
      carrierTrackingCode,
      isApprovedSolution,
      environment,
      awsRequestId
    } = dataForSaveConversation;

    await this.dao.postDataToSaveConversation({
      solution,
      userSolution,
      idShipmentUpdate,
      idOrderHistory,
      carrierTrackingCode,
      isApprovedSolution,
      idOrder,
      environment,
      uuid: awsRequestId
    });
  }

  async updateHistoryStatus({
    orderSource,
    idOrderHistory,
    isApprovedSolution,
    shipmentData
  }: any) {
    let newStatus: any = orderHistoryStatusTypesEnum.REJECTED;
    let solution;
    let userSolution;
    let comments;

    if (isApprovedSolution) {
      newStatus = orderHistoryStatusTypesEnum.RESOLVED;
      if (!shipmentData.solution || !shipmentData.userSolution) {
        solution = "AUTOMATIC";
        userSolution = "Mastershop-IA";
        comments = "Novedad cerrada por el sistema automaticamente";
      }
    } else {
      solution = null;
      userSolution = null;
      comments = null;
    }

    if (orderSource === OrderSourceEnum.ORDER) {
      await this.dao.updateStatusInOrderHistory({
        idOrderHistory,
        newStatus,
        solution,
        userSolution,
        comments
      });
    } else {
      await this.dao.updateStatusInOrderReturnHistory({
        idOrderHistory,
        newStatus,
        solution,
        userSolution,
        comments
      });
    }

    console.log("newStatus =>>>", newStatus);
    console.log("solution =>>>", solution);
    console.log("userSolution =>>>", userSolution);
    console.log("comments =>>>", comments);
  }
}

export default Model;
