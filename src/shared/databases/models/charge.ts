import { DataTypes, Model, Sequelize } from "sequelize";

export interface ICharge {
  idCharge: number;
  idCarrier: number;
  invoiceNumber: string;
  carrierTrackingCode: string;
  chargeDate: Date;
  units: number;
  actualWeight: number;
  volumetricWeight: number;
  billedWeight: number;
  declaredValue: number;
  fixedFreight: number;
  variableFreight: number;
  collectionCommission: number;
  totalFreight: number;
  businessUnit: string;
  notes: string;
  totalCharge: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Charge extends Model<ICharge> {}

export const initChargeModel = (sequelize: Sequelize) => {
  Charge.init(
    {
      idCharge: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: "idCharge"
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
      totalCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "totalCharge"
      }
    },
    {
      sequelize,
      modelName: "Charge",
      tableName: "charge",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        {
          unique: true,
          name: "unique_idCarrier_carrierTrackingCode_invoiceNumber",
          fields: ["idCarrier", "carrierTrackingCode", "invoiceNumber"]
        }
      ]
    }
  );

  return Charge;
};
