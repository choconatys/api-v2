import { Router } from "express";

const routes = Router();

routes.get("/teste", (req, res) => {
  return res.json({ oi: true });
});

export default routes;
