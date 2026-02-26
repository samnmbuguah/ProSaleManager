import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class StockLog extends Model {
    declare id: number;
    declare product_id: number;
    declare quantity_added: number;
    declare unit_cost: number;
    declare total_cost: number;
    declare user_id: number;
    declare store_id: number;
    declare type: string; // 'manual_receive', 'purchase_order', etc.
    declare notes?: string;
    declare date: Date;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

StockLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "products",
                key: "id",
            },
        },
        quantity_added: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        unit_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        total_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "stores",
                key: "id",
            },
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "manual_receive",
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: "StockLog",
        tableName: "stock_logs",
        timestamps: true,
        underscored: true,
    }
);

export default StockLog;
