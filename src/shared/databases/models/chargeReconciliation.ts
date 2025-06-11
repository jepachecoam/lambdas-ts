import { DataTypes, Model, Sequelize } from "sequelize";

export interface IChargeReconciliation {
  idChargeReconciliation?: number;
  idCharge: number;
  idStatus: number;
  idOrder?: number | null;
  idOrderReturn?: number | null;
  carrierChargeAmount?: number;
  userChargeAmount?: number | null;
  balanceResult?: number;
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
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "idCharge"
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
      carrierChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "carrierChargeAmount"
      },
      userChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "userChargeAmount"
      },
      balanceResult: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
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
