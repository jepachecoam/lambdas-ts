import { DataTypes, Model, Sequelize } from "sequelize";

import { ICarrierCharge } from "../../types";
class CarrierCharge extends Model<ICarrierCharge> {}

export const initCarrierChargeModel = (sequelize: Sequelize) => {
  CarrierCharge.init(
    {
      idCarrierCharge: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: "idCarrierCharge"
      },
      idCarrier: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idCarrier"
      },
      invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "invoiceNumber"
      },
      carrierTrackingCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: "carrierTrackingCode"
      },
      chargeDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "chargeDate"
      },
      units: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "units"
      },
      actualWeight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "actualWeight"
      },
      volumetricWeight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "volumetricWeight"
      },
      billedWeight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "billedWeight"
      },
      declaredValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "declaredValue"
      },
      fixedFreight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "fixedFreight"
      },
      variableFreight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "variableFreight"
      },
      collectionCommission: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "collectionCommission"
      },
      totalFreight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "totalFreight"
      },
      businessUnit: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "businessUnit"
      },
      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "notes"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "createdAt",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updatedAt",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      totalCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "totalCharge"
      }
    },
    {
      sequelize,
      modelName: "CarrierCharge",
      tableName: "carrierCharge",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  );

  return CarrierCharge;
};
