import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import routes from "./routes/index.routes";

import dotenv from "dotenv";
import AppError from "./services/appError";

class App {
  public express: express.Application;

  public constructor() {
    dotenv.config();

    this.express = express();

    this.routes();
  }

  private middlewares(): void {
    this.express.use(express());
    this.express.use(express.json());
    this.express.use(cors());
  }

  private routes(): void {
    this.middlewares();

    this.express.use("/v1", routes);
    this.express.use(
      (Error: Error, request: Request, response: Response, _: NextFunction) => {
        if (Error instanceof AppError) {
          return response.status(Error.statusCode).json({
            status: "error",
            data: Error.message,
          });
        } else {
          return response.status(500).json({
            status: "error",
            data: Error.message,
          });
        }
      }
    );
  }
}

export default new App().express;
