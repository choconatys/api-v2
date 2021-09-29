import authConfig from "../config/authConfig";
import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

import AppError from "../services/appError";

export default async function adminAuthorization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!!req.headers.authorization) {
    const decodedUser: any = verify(
      req.headers.authorization.replace("Bearer ", ""),
      authConfig.secret
    );

    if (decodedUser.admin) {
      return next();
    }

    throw new AppError("Você não possui permissão para isso!", 401);
  } else {
    throw new AppError("Erro, token de autenticação falho!", 401);
  }
}
