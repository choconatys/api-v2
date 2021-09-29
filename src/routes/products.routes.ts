import { Router } from "express";
import multer from "multer";

import adminAuthorization from "../middlewares/adminAuthorization";
import ensureAuthenticated from "../middlewares/ensureAuthenticated";

import ProductsController from "../database/controllers/productsController";
import uploadConfig from "../config/uploadConfig";

const upload = multer(uploadConfig);

const productRoutes = Router();

const productsController = new ProductsController();

productRoutes.get("/", productsController.find);
productRoutes.get("/:id", productsController.findOne);

productRoutes.post(
  "/",
  ensureAuthenticated,
  adminAuthorization,
  upload.single("photo"),
  productsController.create
);

export default productRoutes;
