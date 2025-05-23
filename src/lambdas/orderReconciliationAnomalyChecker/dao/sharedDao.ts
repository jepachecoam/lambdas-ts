import { QueryTypes } from "sequelize";

import db from "../database/config";

const getOrderByCarrierTrackingCode = async ({ carrierTrackingCode }: any) => {
  try {
    const query = `
                select * from \`order\` where carrierTrackingCode = '${carrierTrackingCode}'
            `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching order", error);
    throw error;
  }
};

const getOrderReturnByCarrierTrackingCode = async ({
  carrierTrackingCode
}: any) => {
  try {
    const query = `
                select * from orderReturn where carrierTrackingCode = '${carrierTrackingCode}'
                `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching orderReturn", error);
    throw error;
  }
};

export default {
  getOrderByCarrierTrackingCode,
  getOrderReturnByCarrierTrackingCode
};
