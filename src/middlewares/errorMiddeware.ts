import { NextFunction, Request, Response } from "express";
import AppError from "../services/appError";

export default async (
  err: Error,
  request: Request,
  response: Response,
  _: NextFunction
) => {
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      status: "error",
      data: err.message,
    });
  }

  return response.status(500).json({
    status: "error",
    data: "Ocorreu um erro inesperado!",
  });
};
