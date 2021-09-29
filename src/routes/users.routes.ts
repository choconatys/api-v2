import { Router } from "express";

import UsersController from "../database/controllers/usersController";

// import adminAuthorization from "../middlewares/adminAuthorization";
// import ensureAuthenticated from "../middlewares/ensureAuthenticated";

const usersRoutes = Router();

const usersController = new UsersController();

usersRoutes.get("/", usersController.find);
usersRoutes.post("/", usersController.create);

usersRoutes.get("/quantity", usersController.getQuantity);

export default usersRoutes;
