import express, { Router } from "express";

import productRoutes from "./products.routes";
import requestsRoutes from "./requests.routes";
import sessionsRoutes from "./sessions.routes";
import usersRoutes from "./users.routes";

const routes = Router();

routes.use(express.static("tmp"));
routes.use("/products", productRoutes);
routes.use("/users", usersRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/requests", requestsRoutes);

export default routes;
