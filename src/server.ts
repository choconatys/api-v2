import "express-async-errors";

import dotenv from "dotenv";

import App from "./app";

dotenv.config();

App.listen(process.env.PORT || 3030, () => {
  console.log(`\nServer: Api iniciada com sucesso!\n`);
});
