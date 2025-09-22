import express from "express";
import { PrintingController } from "../controllers/printing.controller.js";

const router = express.Router();

router.post("/print-sale", PrintingController.printSaleToLan);
router.post("/print-sale-raster", PrintingController.printSaleRaster);
router.post("/print-sale-pdf", PrintingController.printSalePdf);

export default router;
