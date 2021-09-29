import express from "express";
import cors from "cors";

import "express-async-errors";
import "reflect-metadata";

import routes from "./routes/index.routes";
import errorMiddeware from "./middlewares/errorMiddeware";

const server = express();

server.use(cors());
server.use(express.json());
server.use("/v1", routes);

server.use(errorMiddeware);

server.listen(process.env.PORT || 3030, () => {
  console.log(`
    SERVIDOR CHOCONATYS INICIADO
    RODANDO NA PORTA: ${process.env.PORT || 3030}
  `);
});
