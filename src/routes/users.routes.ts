import { Router } from "express";

import UsersController from "../database/controllers/usersController";

import adminAuthorization from "../middlewares/adminAuthorization";
import ensureAuthenticated from "../middlewares/ensureAuthenticated";

const usersRoutes = Router();

const usersController = new UsersController();

usersRoutes.get(
  "/",
  ensureAuthenticated,
  adminAuthorization,
  usersController.find
);
usersRoutes.post("/", usersController.create);

usersRoutes.put("/:id", ensureAuthenticated, usersController.update);

usersRoutes.get(
  "/quantity",
  ensureAuthenticated,
  adminAuthorization,
  usersController.getQuantity
);

export default usersRoutes;
