import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface UserPreferenceAttributes {
    id?: number;
    user_id: number;
    dark_mode?: boolean;
    notifications?: boolean;
    language?: string;
    theme?: string;
    timezone?: string;
    created_at?: Date;
    updated_at?: Date;
}

class UserPreference extends Model<UserPreferenceAttributes> implements UserPreferenceAttributes {
    declare id: number;
    declare user_id: number;
    declare dark_mode: boolean;
    declare notifications: boolean;
    declare language: string;
    declare theme: string;
    declare timezone: string;
    declare created_at: Date;
    declare updated_at: Date;
}

UserPreference.init(
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
            onDelete: "CASCADE",
        },
        dark_mode: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        notifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        language: {
            type: DataTypes.STRING,
            defaultValue: "english",
        },
        theme: {
            type: DataTypes.STRING,
            defaultValue: "default",
        },
        timezone: {
            type: DataTypes.STRING,
            defaultValue: "UTC",
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: "UserPreference",
        tableName: "user_preferences",
        timestamps: true,
        underscored: true,
    },
);

export default UserPreference;
