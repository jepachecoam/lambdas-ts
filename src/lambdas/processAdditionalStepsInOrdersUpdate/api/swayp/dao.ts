import db from "../../conf/db";

const updateCancelReason = async ({ idOrder }: any) => {
  const query =
    "update `order` o set idCancelReason = 58 where idOrder = :idOrder";

  return db.update(query, { replacements: { idOrder } });
};

export default {
  updateCancelReason
};
