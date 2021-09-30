import { Request, Response } from "express";

import bcryptjs, { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import UserCreate from "../interfaces/userCreate";
import AppError from "../../services/appError";
import { isUuid } from "uuidv4";

class UsersController {
  public async find(request: Request, response: Response) {
    const prisma = new PrismaClient();

    await prisma.user
      .findMany({
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          requests: {
            select: {
              id: true,
            },
          },
          role: {
            select: {
              name: true,
            },
          },
        },
      })
      .then((users) => {
        return response.json({
          status: "success",
          data: users,
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async getQuantity(request: Request, response: Response) {
    const prisma = new PrismaClient();

    await prisma.user
      .findMany({
        where: {
          role: {
            name: "USER",
          },
        },
      })
      .then((users) => {
        return response.json({
          status: "success",
          data: users,
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async update(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { id } = request.params;

    const { name, address, passwordConfirm } = request.body;

    let objectTest: any = {};

    if (name) objectTest.name = name;
    if (address) objectTest.address = address;

    if (!isUuid(id)) throw new AppError("Erro, id invalido!", 404);

    await prisma.user
      .findUnique({
        where: {
          id,
        },
        select: {
          password: true,
        },
      })
      .then(async (user) => {
        if (!user) throw new AppError("Erro, usuario não encontrado!", 404);

        const matchPassword = await compare(passwordConfirm, user.password);

        if (!matchPassword)
          throw new AppError("Erro, email ou senha incorreta!", 401);

        await prisma.user
          .update({
            where: {
              id,
            },
            data: objectTest,
          })
          .then((user) => {
            return response.json({
              status: "success",
              data: user,
            });
          });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }
  public async create(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { name, email, address, password }: UserCreate = request.body;

    if (name && email && address && password) {
      if (password.length < 6)
        throw new AppError(
          "Erro, a senha deve conter 6 caracteres no minimo!",
          400
        );

      const newPassword = await bcryptjs.hash(password, 8);

      let roleUserId = "";
      await prisma.role
        .findFirst({
          where: {
            name: "USER",
          },
        })
        .then(async (roleUser) => {
          if (!roleUser) {
            await prisma.role
              .create({
                data: {
                  name: "USER",
                },
              })
              .then((role) => {
                roleUserId = role.id;
              });
          } else {
            roleUserId = roleUser.id;
          }
        });

      await prisma.user
        .create({
          data: {
            name,
            email,
            address,
            password: newPassword,
            role: {
              connect: {
                id: roleUserId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        })
        .then((user) => {
          return response.json({
            status: "success",
            data: user,
          });
        })
        .finally(() => {
          prisma.$disconnect();
        });
    } else {
      throw new AppError("Erro, preencha todos os campos!", 406);
    }
  }
}

export default UsersController;
