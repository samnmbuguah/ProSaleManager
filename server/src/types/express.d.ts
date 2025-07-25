import { User } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
