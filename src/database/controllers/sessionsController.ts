import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";

import { sign, verify } from "jsonwebtoken";
import { compare } from "bcryptjs";

import SessionCreate from "../interfaces/sessionCreate";
import AppError from "../../services/appError";
import authConfig from "../../config/authConfig";

export default class SessionsController {
  async create(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { email, password }: SessionCreate = request.body;

    await prisma.user
      .findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          address: true,
          role: true,
          requests: true,
        },
      })
      .then(async (user) => {
        if (!user) throw new AppError("Usuario não encontrado!", 404);

        const matchPassword = await compare(password, user.password);

        if (!matchPassword)
          throw new AppError("Erro, email ou senha incorreta!", 401);

        const { secret, expiresIn } = authConfig;

        delete user.password;

        const token = sign(
          { user, admin: user.role.name === "ADMIN" },
          secret,
          {
            expiresIn,
          }
        );

        const responseSession = {
          user,
          token,
          isAdmin: user.role.name === "ADMIN",
        };

        return response.json({
          status: "success",
          data: responseSession,
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  async verify(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { token } = request.body;

    const { secret } = authConfig;

    let informationToken: any;

    try {
      informationToken = verify(token, secret);
    } catch (error) {
      throw new AppError("Erro ao verificar o token!", 401);
    }

    await prisma.user
      .findUnique({
        where: {
          id: informationToken.user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          address: true,
          role: true,
          requests: true,
        },
      })
      .then((user) => {
        if (!user) throw new AppError("Usuario não encontrado!", 404);

        let responseVerifyToken = {
          user,
          token,
          isAdmin: user.role.name === "ADMIN",
        };

        return response.json(responseVerifyToken);
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }
}
