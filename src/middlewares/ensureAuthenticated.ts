import { PrismaClient } from "@prisma/client";
import authConfig from "../config/authConfig";
import { Request, Response, NextFunction } from "express";
import { TokenExpiredError, verify } from "jsonwebtoken";

import AppError from "../services/appError";

export default async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = new PrismaClient();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new AppError("Token JWT é requerido!", 401);
    }
    const [, token] = authHeader.split(" ");

    const decoded: any = verify(token, authConfig.secret);

    await prisma.user
      .findUnique({
        where: {
          id: decoded.user.id,
        },
      })
      .then((user) => {
        if (!user) throw new AppError("Usuario invalido!", 401);

        request.user = { id: decoded.user.id };

        return next();
      })
      .finally(() => {
        prisma.$disconnect();
      });
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      throw new AppError("Token expirado!", 401);
    }

    throw new AppError("Erro na verificação do token!", 401);
  }
}
