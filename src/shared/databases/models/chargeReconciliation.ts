import { DataTypes, Model, Sequelize } from "sequelize";

export interface IChargeReconciliation {
  idChargeReconciliation: number;
  idCharge: number;
  idStatus: number;
  idOrder?: number;
  carrierChargeAmount: number;
  userChargeAmount?: number;
  specialAdjustment?: number;
  balanceResult: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class ChargeReconciliation extends Model<IChargeReconciliation> {}

export const initChargeReconciliationModel = (sequelize: Sequelize) => {
  ChargeReconciliation.init(
    {
      idChargeReconciliation: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: "idChargeReconciliation"
      },
      idCharge: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idCharge"
      },
      idStatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idStatus"
      },
      idOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "idOrder"
      },
      carrierChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "carrierChargeAmount"
      },
      userChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "userChargeAmount"
      },
      specialAdjustment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "specialAdjustment"
      },
      balanceResult: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "balanceResult"
      }
    },
    {
      sequelize,
      modelName: "ChargeReconciliation",
      tableName: "chargeReconciliation",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        {
          unique: true,
          name: "unique_idCharge",
          fields: ["idCharge"]
        }
      ]
    }
  );

  return ChargeReconciliation;
};
