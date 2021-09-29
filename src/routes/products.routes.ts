import { Router } from "express";
import multer from "multer";

import ProductsController from "../database/controllers/productsController";
import uploadConfig from "../config/uploadConfig";

const upload = multer(uploadConfig);

const productRoutes = Router();

const productsController = new ProductsController();

productRoutes.get("/", productsController.find);
productRoutes.get("/:id", productsController.findOne);

productRoutes.post("/", upload.single("photo"), productsController.create);

export default productRoutes;
