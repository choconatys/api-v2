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

        let acumulattorMensal = 0,
          contReqsMensal = 0;
        let acumulattorDiario = 0,
          contReqsDiario = 0;
        requests.map((reqOrder) => {
          const past = new Date(reqOrder.created_at);
          const diff = Math.abs(now.getTime() - past.getTime());
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

          if (days < 30 && reqOrder.status === "ENVIADO") {
            acumulattorMensal += reqOrder.quantity * reqOrder.value_per_product;
            contReqsMensal++;
          }

          if (days <= 1 && reqOrder.status === "ENVIADO") {
            acumulattorDiario += reqOrder.quantity * reqOrder.value_per_product;
            contReqsDiario++;
          }
        });

        if (contReqsMensal > 0) acumulattorMensal += 5;
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
              mensal: acumulattorMensal,
              diario: acumulattorDiario,
            },
          },
        });
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }

  public async findOneById(request: Request, response: Response) {
    const prisma = new PrismaClient();

    if (!request.user) throw new AppError("Usuario não encontrado!");

    await prisma.request
      .findMany({
        where: {
          userId: request.user.id,
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

        return response.json(finalRequestToSend);
      })
      .finally(() => {
        prisma.$disconnect();
      });
  }
}

export default RequestsController;
