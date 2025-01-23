import request from "supertest";
import express, { Express, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import path from "path";
import transactionRoutes from "../routes/transaction.routes";
import { uploadCSVController } from "../controllers/transaction.controller";

jest.mock("../controllers/transaction.controller", () => ({
  getAllTransactionsController: jest.fn((req: Request, res: Response) =>
    res.status(200).json([{ id: 1, description: "Test Transaction" }])
  ),
  getTransactionByIdController: jest.fn((req: Request, res: Response) =>
    res.status(200).json({ id: 1, description: "Test Transaction" })
  ),
  addTransactionController: jest.fn((req: Request, res: Response) =>
    res.status(201).json({ id: 1, description: "Test Transaction" })
  ),
  updateTransactionController: jest.fn((req: Request, res: Response) =>
    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: { id: 1, description: "Updated Transaction" },
    })
  ),
  deleteTransactionController: jest.fn((req: Request, res: Response) =>
    res.status(200).json({
      message: "Transaction marked as deleted successfully",
    })
  ),
  deleteTransactionsController: jest.fn((req, res) =>
    res.status(200).json({
      message: "3 transactions deleted successfully.",
      deletedTransactions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    })
  ),
  uploadCSVController: jest.fn((req: Request, res: Response) =>
    res.status(200).json({
      message: "CSV file processed successfully",
      transactions: [{ id: 1, description: "CSV Transaction" }],
      invalidRows: [],
    })
  ),
}));

const app: Express = express();
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

app.post(
  "/api/upload",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await uploadCSVController(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/", (_, res: Response) => {
  res.status(200).json({ message: "Server is running!" });
});

// Add route that throws an error
app.get("/error", () => {
  throw new Error("Test internal server error");
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: `Internal server error: ${err.message}` });
});

describe("Server", () => {
  it("should return server running message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Server is running!" });
  });

  it("should handle CSV upload and processing", async () => {
    const response = await request(app)
      .post("/api/upload")
      .attach(
        "file",
        Buffer.from("2022-01-01,Test Transaction,100,USD"),
        "transactions.csv"
      );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "CSV file processed successfully",
      transactions: [{ id: 1, description: "CSV Transaction" }],
      invalidRows: [],
    });
  });

  it("should handle internal server errors", async () => {
    const response = await request(app).get("/error");
    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal server error/);
  });
});
