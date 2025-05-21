import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Sale extends Model {
  declare id: number;
  declare customer_id: number | null;
  declare user_id: number;
  declare total_amount: number;
  declare payment_method: string;
  declare amount_paid: number;
  declare status: string;
  declare payment_status: string;
  declare receipt_status: {
    whatsapp?: boolean;
    sms?: boolean;
    last_sent_at?: Date;
  };
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cash',
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    receipt_status: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        whatsapp: false,
        sms: false
      }
    }
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    timestamps: true,
  }
);

export default Sale; 