import { Router } from "express";

import RequestsController from "../database/controllers/requestsController";

import adminAuthorization from "../middlewares/adminAuthorization";
import ensureAuthenticated from "../middlewares/ensureAuthenticated";

const requestsController = new RequestsController();

const requestsRoutes = Router();

requestsRoutes.get(
  "/",
  ensureAuthenticated,
  adminAuthorization,
  requestsController.find
);
requestsRoutes.get(
  "/user",
  ensureAuthenticated,
  requestsController.findOneById
);

requestsRoutes.post("/", ensureAuthenticated, requestsController.create);
requestsRoutes.patch(
  "/status/:code",
  ensureAuthenticated,
  adminAuthorization,
  requestsController.toggleStatus
);

export default requestsRoutes;
