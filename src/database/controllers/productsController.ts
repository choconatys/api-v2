import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { isUuid } from "uuidv4";

import ProductCreate from "../interfaces/productCreate";
import AppError from "../../services/appError";

class ProductsController {
  public async find(request: Request, response: Response) {
    const prisma = new PrismaClient();

    await prisma.product
      .findMany({
        where: {
          available: true,
        },
      })
      .then((products) => {
        return response.json({
          status: "success",
          data: products,
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async findOne(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { id } = request.params;

    if (!isUuid(id)) throw new AppError("Erro, id invalido!", 404);

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) throw new AppError("Produto não encontrado!", 404);

    return response.json({
      status: "success",
      data: product,
    });
  }

  public async create(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { name, description, price }: ProductCreate = request.body;

    if (name && description && price && request.file) {
      const date = new Date();

      date.setMilliseconds(0);
      date.setSeconds(0);

      const fileName = `${date.getDate()}-${date.getTime()}-${request.file.originalname.replace(
        " ",
        ""
      )}`;

      await prisma.product
        .create({
          data: {
            name,
            photo: fileName,
            description,
            price: Number(price),
            available: true,
            quantity: 1,
          },
        })
        .then((productCreated) => {
          return response.json({
            status: "success",
            data: productCreated,
          });
        })
        .finally(() => {
          prisma.$disconnect();
        });
    } else {
      throw new AppError("Erro, preencha todos os campos necessarios!", 406);
    }
  }
}

export default ProductsController;
