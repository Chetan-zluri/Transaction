import express, { Request, Response, NextFunction, Express } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import multer from "multer";
import transactionRoutes from "./routes/transaction.routes";
import { uploadCSVController } from "./controllers/transaction.controller";
const main = async (): Promise<Express> => {
  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use("/api/transactions", transactionRoutes);
  const upload = multer({
    dest: "uploads/", // Temporary folder to store uploaded files
    limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB size limit
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      if (ext !== ".csv") {
        return cb(new Error("Only CSV files are allowed"));
      }
      cb(null, true);
    },
  });
  app.use(upload.single("file"));
  // app.post(
  //   "/api/upload",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     try {
  //       await uploadCSVController(req, res, next);
  //     } catch (error) {
  //       next(error);
  //     }
  //   }
  // );
  app.get("/", (_, res) => {
    res.status(200).json({ message: "Server is running!" });
  });
  app.get("/error", () => {
    throw new Error("Test internal server error");
  });
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: `Internal server error: ${err.message}` });
  });
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  return app;
};
const appfinal = main().catch((err) => {
  console.error(err);
  process.exit(1);
});
export default appfinal;
