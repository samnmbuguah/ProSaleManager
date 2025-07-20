import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id?: number;
  email: string;
  password: string;
  name: string;
  role?: 'super_admin' | 'admin' | 'sales' | 'manager';
  is_active?: boolean;
  last_login?: Date;
  store_id?: number | null;
}

class User extends Model<UserAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password: string;
  declare name: string;
  declare role: 'super_admin' | 'admin' | 'sales' | 'manager';
  declare is_active: boolean;
  declare last_login?: Date;
  declare store_id?: number | null;

  // Add method to compare passwords
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'sales', 'manager'),
      defaultValue: 'sales',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;

