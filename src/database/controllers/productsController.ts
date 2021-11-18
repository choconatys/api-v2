import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { isUuid } from "uuidv4";
import cloudinary from "cloudinary";

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

  public async findAll(request: Request, response: Response) {
    console.log("aqui");
    const prisma = new PrismaClient();

    await prisma.product
      .findMany()
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

  public async delete(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { id } = request.params;

    if (!isUuid(id) || !id) throw new AppError("Erro, id invalido!", 404);

    await prisma.product
      .delete({
        where: {
          id: request.params.id,
        },
      })
      .then(async (products) => {
        await prisma.product.findMany().then((productsData) => {
          return response.json({
            status: "success",
            data: productsData,
          });
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async findOne(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { id } = request.params;

    if (!isUuid(id) || !id) throw new AppError("Erro, id invalido!", 404);

    await prisma.product
      .findUnique({
        where: {
          id,
        },
      })
      .then((product) => {
        if (!product) throw new AppError("Produto não encontrado!", 404);

        return response.json({
          status: "success",
          data: product,
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async toggleAvailable(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { id } = request.params;

    if (!isUuid(id)) throw new AppError("Erro, id invalido!", 404);

    await prisma.product
      .findUnique({
        where: {
          id,
        },
      })
      .then(async (product) => {
        if (!product) throw new AppError("Produto não encontrado!", 404);

        if (product.available == false && product.quantity <= 0) {
          throw new AppError("Erro, produto não pode ser alterado!");
        }

        await prisma.product
          .update({
            where: {
              id,
            },
            data: {
              available: !product.available,
            },
          })
          .then(async () => {
            await prisma.product.findMany().then((products) => {
              return response.json({
                status: "success",
                data: products,
              });
            });
          });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async create(request: Request, response: Response) {
    cloudinary.v2.config({
      cloud_name: "choconatys",
      api_key: "346924178573599",
      api_secret: "fIQMrIKgGl7Gu4O1bLLPYOuuzD8",
    });

    const prisma = new PrismaClient();
    const date = new Date();

    date.setMilliseconds(0);
    date.setSeconds(0);

    const { name, description, price }: ProductCreate = request.body;

    if (name && description && price && request.file) {
      const date = new Date();

      date.setMilliseconds(0);
      date.setSeconds(0);

      const fileName = `${date.getDate()}-${date.getTime()}-${request.file.originalname.replace(
        " ",
        ""
      )}`;

      cloudinary.v2.uploader.upload(
        request.file.path,
        { public_id: fileName },
        async function (error, result) {
          if (error) {
            throw new AppError("Erro, não foi possivel continuar!");
          } else {
            await prisma.product
              .create({
                data: {
                  name,
                  photo: result.secure_url,
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
          }
        }
      );
    } else {
      throw new AppError("Erro, preencha todos os campos necessarios!", 406);
    }
  }
}

export default ProductsController;
