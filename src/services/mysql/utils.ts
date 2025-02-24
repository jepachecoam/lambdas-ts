import { DateTime } from "luxon";
import { QueryTypes } from "sequelize";

import { QueryOptions } from "./types";

async function executeSql<T>({
  db,
  query,
  type,
  data,
  errorMsg,
  transaction,
  oneResult
}: QueryOptions): Promise<T> {
  try {
    const timestamp = DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss");

    if (type === QueryTypes.INSERT) {
      data.createdAt = timestamp;
      data.updatedAt = timestamp;
    } else if (type === QueryTypes.UPDATE) {
      data.updatedAt = timestamp;
    }

    const res = await db.query(query, {
      replacements: {
        ...data
      },
      type,
      transaction
    });

    if ([QueryTypes.INSERT, QueryTypes.UPDATE].includes(type)) {
      return res[0] as T;
    }

    if (oneResult) return (res.length > 0 ? res[0] : null) as T;

    return res as T;
  } catch (err: unknown) {
    throw new Error(`${errorMsg}; ${(err as Error).message}`);
  }
}

export { executeSql };
