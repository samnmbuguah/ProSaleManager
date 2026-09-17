import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export type AgentActionStatus = "proposed" | "approved" | "rejected" | "executed" | "failed";

interface AgentActionAttributes {
  id?: number;
  thread_id: string;
  user_id: number;
  store_id?: number | null;
  action: string;
  args?: Record<string, unknown> | null;
  summary?: string | null;
  status: AgentActionStatus;
  decided_by?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type AgentActionCreationAttributes = Optional<
  AgentActionAttributes,
  "id" | "store_id" | "args" | "summary" | "decided_by"
>;

export interface AgentActionInstance
  extends Model<AgentActionAttributes, AgentActionCreationAttributes>,
    AgentActionAttributes {}

const AgentAction = sequelize.define<AgentActionInstance>(
  "AgentAction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    thread_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    args: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "proposed",
    },
    decided_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "agent_actions",
    underscored: true,
    timestamps: true,
  },
);

export default AgentAction;
