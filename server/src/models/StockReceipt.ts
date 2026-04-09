import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

class StockReceipt extends Model {
    declare id: number;
    declare user_id: number;
    declare store_id: number;
    declare total_cost: number;
    declare items_count: number;
    declare notes?: string;
    declare date: Date;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

StockReceipt.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        total_cost: {
            type: DataTypes.DECIMAL(12, 5),
            allowNull: false,
            defaultValue: 0,
        },
        items_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        modelName: "StockReceipt",
        tableName: "stock_receipts",
        timestamps: true,
        underscored: true,
    }
);

export default StockReceipt;
