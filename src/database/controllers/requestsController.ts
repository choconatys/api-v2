import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import AppError from "../../services/appError";

class RequestsController {
  public async find(request: Request, response: Response) {
    const prisma = new PrismaClient();

    await prisma.request
      .findMany({
        select: {
          id: true,
          code: true,
          product: true,
          delivery_tax: true,
          quantity: true,
          status: true,
          total: true,
          user: true,
          value_per_product: true,
          created_at: true,
          updated_at: true,
        },
      })
      .then(async (requests) => {
        const now = new Date();

        let acumulattorTotal = 0,
          contReqsMensal = 0;
        let acumulattorDiario = 0,
          contReqsDiario = 0;
        requests.map((reqOrder) => {
          const past = new Date(reqOrder.created_at);
          const diff = Math.abs(now.getTime() - past.getTime());
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

          if (reqOrder.status === "ENVIADO") {
            acumulattorTotal += reqOrder.quantity * reqOrder.value_per_product;
            contReqsMensal++;
          }

          if (days <= 1 && reqOrder.status === "ENVIADO") {
            acumulattorDiario += reqOrder.quantity * reqOrder.value_per_product;
            contReqsDiario++;
          }
        });

        if (contReqsMensal > 0) acumulattorTotal += 5;
        if (contReqsDiario > 0) acumulattorDiario += 5;

        let codeAnterior: any = [];
        const finalResponseRequests = await Promise.all(
          requests.map(async (request) => {
            let requestsDivididadas: any = {};

            if (!codeAnterior.includes(request.code)) {
              codeAnterior.push(request.code);

              await prisma.request
                .findMany({
                  where: {
                    code: request.code,
                  },
                  select: {
                    id: true,
                    code: true,
                    product: true,
                    delivery_tax: true,
                    quantity: true,
                    status: true,
                    total: true,
                    user: true,
                    value_per_product: true,
                    created_at: true,
                    updated_at: true,
                  },
                })
                .then((requestCode) => {
                  requestCode.map((t) => {
                    if (requestsDivididadas[t.code]) {
                      requestsDivididadas[t.code].requests.push({
                        id: t.id,
                        product: t.product,
                        quantity: t.quantity,
                        value_per_product: t.value_per_product,
                      });
                      requestsDivididadas[t.code].total +=
                        t.value_per_product * t.quantity;
                    } else {
                      const dateFormated = new Date(t.created_at);

                      requestsDivididadas[t.code] = {
                        id: t.id,
                        code: t.code,
                        requests: [
                          {
                            id: t.id,
                            product: t.product,
                            quantity: t.quantity,
                            value_per_product: t.value_per_product,
                          },
                        ],
                        delivery_tax: t.delivery_tax,
                        total:
                          t.value_per_product * t.quantity + t.delivery_tax,
                        status: t.status,
                        username: t.user.name,
                        data: `${dateFormated.getDate()}/${
                          dateFormated.getMonth() + 1
                        }/${dateFormated.getFullYear()}`,
                      };
                    }
                  });
                });
            }

            return requestsDivididadas;
          })
        );

        return response.json({
          status: "success",
          data: {
            requests: finalResponseRequests,
            faturamento: {
              total: acumulattorTotal,
              diario: acumulattorDiario,
            },
          },
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async toggleStatus(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const { code } = request.params;

    if (!code) throw new AppError("Erro, não foi possivel achar o id!");

    await prisma.request
      .findMany({ where: { code } })
      .then(async (requests) => {
        if (!requests || requests.length == 0) {
          throw new AppError("Erro, nenhum pedido encontrado!");
        }

        let lastStatus = "";
        requests.map((reqItem) => {
          if (lastStatus == "") {
            lastStatus = reqItem.status;
          } else {
            if (lastStatus != reqItem.status) {
              throw new AppError("Erro ao verificar o status do pedido!");
            } else {
              return reqItem.status;
            }
          }
        });

        if (lastStatus == "AGUARDANDO_CONFIRMACAO") {
          await prisma.request.updateMany({
            where: {
              code,
              status: lastStatus,
            },
            data: {
              status: "EM_PRODUCAO",
            },
          });
        } else if (lastStatus == "EM_PRODUCAO") {
          await prisma.request.updateMany({
            where: {
              code,
              status: lastStatus,
            },
            data: {
              status: "PRONTO_PARA_ENVIO",
            },
          });
        } else if (lastStatus === "PRONTO_PARA_ENVIO") {
          await prisma.request.updateMany({
            where: {
              code,
              status: lastStatus,
            },
            data: {
              status: "ENVIADO",
            },
          });
        } else {
          throw new AppError("Impossivel alterar o status desse pedido!");
        }

        await prisma.request.findMany().then((requests) => {
          return response.json({
            status: "success",
            data: requests,
          });
        });
      })
      .finally(() => prisma.$disconnect());
  }

  public async create(request: Request, response: Response) {
    const prisma = new PrismaClient();

    const userId = request.user.id;

    const requestData = request.body;

    if (!userId) throw new AppError("Falta itens para completar o pedido!");

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new AppError("Usuario não encontrado!");

    requestData.requests.map(
      async (reqData: {
        id: any;
        quantity: number;
        price: any;
        itemTotal: any;
      }) => {
        await prisma.product
          .findUnique({
            where: {
              id: reqData.id,
            },
          })
          .then(async (product) => {
            if (!product) throw new AppError("Produto não encontrado!");
            if (!product.available)
              throw new AppError("O produto não esta disponivel!");

            if (reqData.quantity > product.quantity) {
              throw new AppError("Não temos essa quantia no estoque!");
            }

            await prisma.request
              .create({
                data: {
                  code: requestData.code,
                  quantity: reqData.quantity,
                  userId,
                  productId: reqData.id,
                  value_per_product: reqData.price,
                  status: "AGUARDANDO_CONFIRMACAO",
                  delivery_tax: 5,
                  total: reqData.itemTotal,
                },
              })
              .then(async () => {
                await prisma.product
                  .update({
                    where: {
                      id: product.id,
                    },
                    data: {
                      quantity: product.quantity - reqData.quantity,
                    },
                    select: {
                      id: true,
                      quantity: true,
                    },
                  })
                  .then(async (product) => {
                    if (product.quantity === 0) {
                      await prisma.product.update({
                        where: {
                          id: product.id,
                        },
                        data: {
                          available: false,
                        },
                      });
                    }

                    return response.json({
                      status: "success",
                      data: "Pedidos criados com sucesso!",
                    });
                  });
              });
          });
      }
    );

    prisma.$disconnect();
  }

  public async findOneById(request: Request, response: Response) {
    const prisma = new PrismaClient();

    if (!request.user) throw new AppError("Usuario não encontrado!");

    await prisma.request
      .findMany({
        where: {
          userId: request.user.id,
        },
        select: {
          id: true,
          code: true,
          product: true,
          delivery_tax: true,
          quantity: true,
          status: true,
          total: true,
          user: true,
          value_per_product: true,
          created_at: true,
          updated_at: true,
        },
      })
      .then(async (requests) => {
        let codeAnterior: any = [];
        const finalRequestToSend = await Promise.all(
          requests.map(async (requestUser) => {
            let requestsDivididadas: any = {};

            if (!codeAnterior.includes(requestUser.code)) {
              codeAnterior.push(requestUser.code);

              await prisma.request
                .findMany({
                  where: {
                    code: requestUser.code,
                  },
                  select: {
                    id: true,
                    code: true,
                    product: true,
                    delivery_tax: true,
                    quantity: true,
                    status: true,
                    total: true,
                    user: true,
                    value_per_product: true,
                    created_at: true,
                    updated_at: true,
                  },
                })
                .then((requestsCode) => {
                  requestsCode.map((reqCode) => {
                    if (requestsDivididadas[reqCode.code]) {
                      requestsDivididadas[reqCode.code].requests.push({
                        id: reqCode.id,
                        product: reqCode.product,
                        quantity: reqCode.quantity,
                        value_per_product: reqCode.value_per_product,
                      });
                      requestsDivididadas[reqCode.code].total +=
                        reqCode.value_per_product * reqCode.quantity;
                    } else {
                      requestsDivididadas[reqCode.code] = {
                        code: reqCode.code,
                        requests: [
                          {
                            id: reqCode.id,
                            product: reqCode.product,
                            quantity: reqCode.quantity,
                            value_per_product: reqCode.value_per_product,
                          },
                        ],
                        delivery_tax: reqCode.delivery_tax,
                        total:
                          reqCode.value_per_product * reqCode.quantity +
                          reqCode.delivery_tax,
                        status: reqCode.status,
                      };
                    }
                  });
                });

              return requestsDivididadas;
            }
          })
        );

        return response.json({
          status: "success",
          data: finalRequestToSend,
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }
}

export default RequestsController;
