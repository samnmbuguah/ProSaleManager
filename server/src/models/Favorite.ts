import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export interface FavoriteAttributes {
    id?: number;
    user_id: number;
    product_id: number;
    created_at?: Date;
    updated_at?: Date;
}

class Favorite extends Model<FavoriteAttributes> implements FavoriteAttributes {
    declare id: number;
    declare user_id: number;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;
}

Favorite.init(
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
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "products",
                key: "id",
            },
        },
    },
    {
        sequelize,
        modelName: "Favorite",
        tableName: "favorites",
        timestamps: true,
        underscored: true,
    }
);

export default Favorite;
