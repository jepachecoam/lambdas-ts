import { DataTypes, Model, Sequelize } from "sequelize";

export interface ICarrierPayment {
  idCarrierPayment: number;
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

class CarrierPayment extends Model<ICarrierPayment> {}

export const initCarrierPaymentModel = (sequelize: Sequelize) => {
  CarrierPayment.init(
    {
      idCarrierPayment: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: "idCarrierPayment"
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        field: "createdAt"
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        field: "updatedAt"
      }
    },
    {
      sequelize,
      modelName: "CarrierPayment",
      tableName: "carrierPayment",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        {
          unique: true,
          name: "unique_tracking_collection_date",
          fields: ["carrierTrackingCode", "collectionDate"]
        }
      ]
    }
  );

  return CarrierPayment;
};
