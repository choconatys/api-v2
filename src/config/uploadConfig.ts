import multer from "multer";

import path from "path";

const tmpFolder = path.resolve(__dirname, "..", "..", "tmp");

export default {
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      const date = new Date();

      date.setMilliseconds(0);
      date.setSeconds(0);
      const fileName = `${date.getDate()}-${date.getTime()}-${
        file.originalname
      }`;

      callback(null, fileName);
    },
  }),
};
