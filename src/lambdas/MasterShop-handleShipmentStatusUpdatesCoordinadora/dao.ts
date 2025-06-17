import axios from "axios";

import Database from "../../shared/databases/sequelize";
import { formatDate } from "./utils";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async checkInOrder({ carrierTrackingCode }: any) {
    const query = `
            select * from \`order\` where carrierTrackingCode = :carrierTrackingCode`;

    return this.db.fetchOne(query, {
      replacements: { carrierTrackingCode }
    });
  }

  async checkInOrderReturn({ carrierTrackingCode }: any) {
    const query = `
            select * from orderReturn where carrierTrackingCode = :carrierTrackingCode`;

    return this.db.fetchOne(query, {
      replacements: { carrierTrackingCode }
    });
  }

  async getDataFromOrderHistory({ carrierTrackingCode }: any) {
    const query = `
        select solution, userSolution, idShipmentUpdate, idOrderShipmentUpdate as idOrderHistory, idOrder, status  
        from orderShipmentUpdateHistory 
            where idOrder = (select idOrder from \`order\` where carrierTrackingCode = :carrierTrackingCode) 
            and status != '' and status is not null
            order by createdAt desc limit 1;
        `;

    return this.db.fetchOne(query, {
      replacements: { carrierTrackingCode }
    });
  }

  async getDataFromOrderReturnHistory({ carrierTrackingCode }: any) {
    const query = `
        select solution, userSolution, idShipmentUpdate, idOrderReturnShipmentUpdate as idOrderHistory, idOrderReturn, status
        from orderReturnShipmentUpdateHistory 
            where idOrderReturn = (select idOrderReturn from orderReturn where idOrder = (select idOrder from \`order\` where carrierTrackingCode = :carrierTrackingCode)) 
            and status != '' and status is not null
            order by createdAt desc limit 1;
        `;

    return this.db.fetchOne(query, {
      replacements: { carrierTrackingCode }
    });
  }

  async updateStatusInOrderHistory({
    idOrderHistory,
    newStatus,
    solution,
    userSolution,
    comments
  }: any) {
    const fieldsToUpdate: string[] = [];
    const replacements: any = {
      newStatus: newStatus,
      idOrderShipmentUpdate: idOrderHistory
    };

    if (solution !== undefined) {
      fieldsToUpdate.push("solution = :solution");
      replacements.solution = solution;
    }

    if (userSolution !== undefined) {
      fieldsToUpdate.push("userSolution = :userSolution");
      replacements.userSolution = userSolution;
    }

    if (comments !== undefined) {
      fieldsToUpdate.push("comments = :comments");
      replacements.comments = comments;
    }
    fieldsToUpdate.push("status = :newStatus");
    fieldsToUpdate.push("updatedAt = NOW()");
    fieldsToUpdate.push("updateSource = 'api_coordinadora'");
    fieldsToUpdate.push("dateSolution = NOW()");

    const queryUpdateCarrierData = `
      UPDATE orderShipmentUpdateHistory
      SET ${fieldsToUpdate.join(", ")}
      WHERE idOrderShipmentUpdate = :idOrderShipmentUpdate
    `;

    return this.db.update(queryUpdateCarrierData, {
      replacements
    });
  }

  updateStatusInOrderReturnHistory = async ({
    idOrderHistory,
    newStatus,
    solution,
    userSolution,
    comments
  }: any) => {
    const fieldsToUpdate: string[] = [];
    const replacements: any = {
      newStatus: newStatus,
      idOrderReturnShipmentUpdate: idOrderHistory
    };

    if (solution !== undefined) {
      fieldsToUpdate.push("solution = :solution");
      replacements.solution = solution;
    }

    if (userSolution !== undefined) {
      fieldsToUpdate.push("userSolution = :userSolution");
      replacements.userSolution = userSolution;
    }

    if (comments !== undefined) {
      fieldsToUpdate.push("comments = :comments");
      replacements.comments = comments;
    }

    fieldsToUpdate.push("status = :newStatus");
    fieldsToUpdate.push("updatedAt = NOW()");
    fieldsToUpdate.push("updateSource = 'api_coordinadora'");
    fieldsToUpdate.push("dateSolution = NOW()");

    const queryUpdateCarrierData = `
      UPDATE orderReturnShipmentUpdateHistory
      SET ${fieldsToUpdate.join(", ")}
      WHERE idOrderReturnShipmentUpdate = :idOrderReturnShipmentUpdate
    `;

    return this.db.update(queryUpdateCarrierData, {
      replacements
    });
  };

  async postDataToSaveConversation({
    solution,
    userSolution,
    isApprovedSolution,
    environment,
    uuid,
    idOrder,
    idShipmentUpdate,
    idOrderHistory,
    carrierTrackingCode
  }: any) {
    const date = formatDate({ date: new Date() });
    const payload = {
      to: "n/a",
      from: "Coordinadora Api System",
      subject: "Respuesta de la transportadora a la solución",
      bodyFileHtml: `emails/mastershop/novedades/templates/soluciones/coordinadora/${isApprovedSolution ? "respuesta_exitosa.html" : "respuesta_fallida.html"}`,
      bodyFileTxt: `emails/mastershop/novedades/templates/soluciones/coordinadora/${isApprovedSolution ? "respuesta_exitosa.txt" : "respuesta_fallida.txt"}`,
      dataKeyValue: [
        {
          fieldName: "%MS_S_UPDATE_TYPE_SOLUTION%",
          value: solution
        },
        {
          fieldName: "%MS_S_UPDATE_OBSERVATIONS%",
          value: "Ninguna"
        },
        {
          fieldName: "%MS_S_UPDATE_GUIDE_NUMBER%",
          value: carrierTrackingCode
        },
        {
          fieldName: "%MS_S_UPDATE_SOLUTION_DATE%",
          value: date
        },
        {
          fieldName: "%MS_S_UPDATE_USER_SOLUTION%",
          value: userSolution
        },
        {
          fieldName: "%MS_ID_SHIPPMENT_UPDATE%",
          value: idShipmentUpdate
        }
      ],
      platformData: {
        origin: "carrier",
        idOrder: idOrder,
        idMessage: `idOrder-${idOrder}-idShippingUpdate-${idOrderHistory}-${uuid}`,
        stage: environment
      }
    };

    const response = await axios.post(
      process.env["URL_SAVE_CONVERSATION"]!,
      payload,
      {
        headers: {
          "x-api-key": `${process.env["API_KEY_MS"]}`,
          "x-app-name": `${process.env["APP_NAME_MS"]}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  }

  async sendAlertNotification({ message }: any) {
    const dataToSend = {
      observation: message
    };
    const response = await axios.post(
      process.env["URL_NOTIFICATION_ALERT"]!,
      { ...dataToSend },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    console.log("Notification sent successfully", response.data);
  }
}

export default Dao;
