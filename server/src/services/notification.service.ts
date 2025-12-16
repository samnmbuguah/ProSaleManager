import nodemailer from "nodemailer";
import { Op } from "sequelize";
import env from "../config/env.js";
import Notification, { NotificationType } from "../models/Notification.js";
import User from "../models/User.js";

type NotificationPayload = {
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getMailer() {
  if (cachedTransporter) return cachedTransporter;
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) return null;

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

export async function createNotificationsForUsers(
  userIds: number[],
  payload: NotificationPayload,
) {
  if (!userIds.length) return [];
  const entries = userIds.map((user_id) => ({
    user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type || "info",
    data: payload.data || null,
  }));
  return Notification.bulkCreate(entries);
}

export async function notifyAdminsOfStockTake(
  storeId: number | null | undefined,
  payload: NotificationPayload,
) {
  // Find admins/managers for this store plus super admins
  const admins = await User.findAll({
    where: {
      [Op.or]: [
        { role: { [Op.in]: ["admin", "manager"] }, store_id: storeId ?? null },
        { role: "super_admin" },
      ],
    },
    attributes: ["id", "email"],
  });

  const userIds = Array.from(new Set(admins.map((u) => u.id!)));
  await createNotificationsForUsers(userIds, { ...payload, type: payload.type || "stock_take" });

  const transporter = getMailer();
  if (transporter) {
    const emails = admins.map((u) => u.email).filter(Boolean);
    if (emails.length > 0) {
      await transporter.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: env.SMTP_FROM || env.SMTP_USER,
        bcc: emails,
        subject: payload.title,
        text: payload.message,
      });
    }
  }
}


