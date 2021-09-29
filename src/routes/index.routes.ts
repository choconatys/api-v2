import express, { Router } from "express";

import productRoutes from "./products.routes";
import usersRoutes from "./users.routes";

const routes = Router();

routes.use(express.static("tmp"));
routes.use("/products", productRoutes);
routes.use("/users", usersRoutes);

export default routes;
