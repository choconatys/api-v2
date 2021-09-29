import "express-async-errors";

import dotenv from "dotenv";

import App from "./app";

dotenv.config();

App.listen(process.env.SERVER_PORT, () => {
  console.log(`\nServer: Api iniciada com sucesso!\n`);
});
