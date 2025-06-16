import Dao from "./dao";
import { OrderSourceEnum } from "./utils";
class Model {
  dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async getOrderSource({ carrierTrackingCode, dbInstance }: any) {
    const isOrderReturn = await this.dao.checkInOrderReturn({
      carrierTrackingCode
    });

    if (isOrderReturn) {
      return OrderSourceEnum.ORDER_RETURN;
    }

    const isOrder = await this.dao.checkInOrder({
      carrierTrackingCode,
      dbInstance
    });

    if (isOrder) {
      return OrderSourceEnum.ORDER;
    }

    const message = `llego una solucion de novedad de la guia ${carrierTrackingCode} pero no existe en la base de datos.`;

    console.log(message);

    await this.dao.sendAlertNotification({ message });

    return null;
  }

  async getShipmentData({ orderSource, carrierTrackingCode, dbInstance }: any) {
    let shipmentData = null;

    if (orderSource === OrderSourceEnum.ORDER) {
      shipmentData = await this.dao.getDataFromOrderHistory({
        carrierTrackingCode,
        dbInstance
      });
    } else {
      shipmentData = await this.dao.getDataFromOrderReturnHistory({
        carrierTrackingCode,
        dbInstance
      });
    }
    if (!shipmentData) {
      const message = `no se encontro informacion de la guia ${carrierTrackingCode} necesaria
                para guardar el registro de la conversacion en DynamoDB ni para actualizar el estado de la gestion.`;

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
    let newStatus = "REJECTED";
    let solution;
    let userSolution;
    let comments;

    if (isApprovedSolution) {
      newStatus = "RESOLVED";
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
