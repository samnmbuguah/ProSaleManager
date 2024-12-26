import { Express } from "express";
import customersRouter from "./customers";
import salesRouter from "./sales";
import productsRouter from "./products";
import suppliersRouter from "../src/routes/supplier/routes";
import purchaseOrdersRouter from "../src/routes/purchase-order/routes";

export function registerRoutes(app: Express) {
  app.use("/api/customers", customersRouter);
  app.use("/api/sales", salesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/suppliers", suppliersRouter);
  app.use("/api/purchase-orders", purchaseOrdersRouter);
} 