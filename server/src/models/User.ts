import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcrypt";

class User extends Model {
  declare id: number;
  declare email: string;
  declare password: string;
  declare name: string;
  declare role: "admin" | "user";
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  async comparePassword(candidatePassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
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
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: [["admin", "user"]],
      },
    },
  },
  {
    sequelize,
    modelName: "User",
    hooks: {
      beforeSave: async (user: User) => {
        if (
          user.changed("password") &&
          user.password &&
          !user.password.startsWith("$2b$")
        ) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

export default User;
