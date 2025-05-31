import { DataTypes, Model, Sequelize } from "sequelize";

export interface IPayment {
  idPayment: number;
  idCarrier: number;
  carrierTrackingCode: string;
  collectionDate: Date;
  notes?: string;
  paymentMethod: string;
  amount: number;
  paymentDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class Payment extends Model<IPayment> {}

export const initPaymentModel = (sequelize: Sequelize) => {
  Payment.init(
    {
      idPayment: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: "idPayment"
      },
      idCarrier: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idCarrier"
      },
      carrierTrackingCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "carrierTrackingCode"
      },
      collectionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "collectionDate"
      },
      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "notes"
      },
      paymentMethod: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "paymentMethod"
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "amount"
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "paymentDate"
      }
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "payment",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        {
          unique: true,
          name: "unique_idCarrier_carrierTrackingCode_collectionDate",
          fields: ["idCarrier", "carrierTrackingCode", "collectionDate"]
        }
      ]
    }
  );

  return Payment;
};
