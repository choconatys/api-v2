import { Router } from "express";

import SessionsController from "../database/controllers/sessionsController";

const sessionsRoutes = Router();

const sessionController = new SessionsController();

sessionsRoutes.post("/", sessionController.create);
sessionsRoutes.post("/verify", sessionController.verify);

export default sessionsRoutes;
