import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user!.id },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  res.json({ success: true, data: notifications });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user!.id },
  });
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  await notification.update({ is_read: true, read_at: new Date() });
  res.json({ success: true, data: notification });
});

router.post("/read-all", requireAuth, async (req, res) => {
  await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: req.user!.id, is_read: false } },
  );
  res.json({ success: true });
});

export default router;


