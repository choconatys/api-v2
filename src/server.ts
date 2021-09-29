import express from "express";
import cors from "cors";

import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

import "express-async-errors";
import "reflect-metadata";

import routes from "./routes/index.routes";
import errorMiddeware from "./middlewares/errorMiddeware";

const server = express();

server.use(cors());
server.use(express.json());
server.use("/v1", routes);

server.use(errorMiddeware);

server.listen(process.env.PORT || 3030, async () => {
  const prisma = new PrismaClient();

  await prisma.role.count().then(async (result) => {
    if (result < 2) {
      await prisma.role.create({
        data: {
          name: "USER",
        },
      });

      await prisma.role
        .create({
          data: {
            name: "ADMIN",
          },
        })
        .then(async (role) => {
          await prisma.user.count().then(async (result) => {
            if (result == 0) {
              const password = await bcryptjs.hash("123456", 8);

              await prisma.user.create({
                data: {
                  name: "CHOCONATYS_ADMIN",
                  email: "admin@choconatys.com",
                  address: "Rua Antenor Bueno da Silveira Lazaro, 547",
                  password,
                  role: {
                    connect: {
                      id: role.id,
                    },
                  },
                },
              });
            }
          });
        });
    }
  });

  console.log(`
    SERVIDOR CHOCONATYS INICIADO
    RODANDO NA PORTA: ${process.env.PORT || 3030}
  `);
});
