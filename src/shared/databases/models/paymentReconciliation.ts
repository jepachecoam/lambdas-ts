import { DataTypes, Model, Sequelize } from "sequelize";

export interface IPaymentReconciliation {
  idPaymentReconciliation?: number;
  idPayment: number;
  idStatus: number;
  idOrder?: number | null;
  idOrderReturn?: number | null;
  expectedAmount?: number;
  receivedAmount?: number;
  balanceResult?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class PaymentReconciliation extends Model<IPaymentReconciliation> {}

export const initPaymentReconciliationModel = (sequelize: Sequelize) => {
  PaymentReconciliation.init(
    {
      idPaymentReconciliation: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: "idPaymentReconciliation"
      },
      idPayment: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "idPayment"
      },
      idStatus: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "idStatus"
      },
      idOrder: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "idOrder"
      },
      idOrderReturn: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "idOrderReturn"
      },
      expectedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "expectedAmount"
      },
      receivedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "receivedAmount"
      },
      balanceResult: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "balanceResult"
      }
    },
    {
      sequelize,
      modelName: "PaymentReconciliation",
      tableName: "paymentReconciliation",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        {
          unique: true,
          name: "unique_idCarrierPayment",
          fields: ["idPayment"]
        }
      ]
    }
  );

  return PaymentReconciliation;
};
