import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import multer from "multer";
import transactionRoutes from "../routes/transaction.routes";
import {
  getTransactionByIdController,
  uploadCSVController,
} from "../controllers/transaction.controller";

jest.mock("../controllers/transaction.controller", () => ({
  getAllTransactionsController: jest.fn((req, res) =>
    res.status(200).json([{ id: 1, description: "Test Transaction" }])
  ),
  getTransactionByIdController: jest.fn((req, res) =>
    res.status(200).json({ id: 1, description: "Test Transaction" })
  ),
  addTransactionController: jest.fn((req, res) =>
    res.status(201).json({ id: 1, description: "Test Transaction" })
  ),
  updateTransactionController: jest.fn((req, res) =>
    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: { id: 1, description: "Updated Transaction" },
    })
  ),
  deleteTransactionController: jest.fn((req, res) =>
    res.status(200).json({
      message: "Transaction marked as deleted successfully",
    })
  ),
  uploadCSVController: jest.fn((req, res) =>
    res.status(200).json({
      message: "CSV file processed successfully",
      transactions: [{ id: 1, description: "CSV Transaction" }],
      invalidRows: [],
    })
  ),
}));

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

app.post("/api/upload", upload.single("file"), async (req, res, next) => {
  try {
    await uploadCSVController(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.get("/", (_, res) => {
  res.status(200).json({ message: "Server is running!" });
});

describe("Transaction Routes", () => {
  it("should route to getAllTransactionsController", async () => {
    const response = await request(app).get("/api/transactions");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, description: "Test Transaction" }]);
  });

  it("should route to getTransactionByIdController", async () => {
    const response = await request(app).get("/api/transactions/1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, description: "Test Transaction" });
  });

  it("should route to addTransactionController", async () => {
    const response = await request(app).post("/api/transactions").send({
      date: "2022-01-01",
      description: "Test Transaction",
      amount: 100,
      Currency: "USD",
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1, description: "Test Transaction" });
  });

  it("should route to updateTransactionController", async () => {
    const response = await request(app).put("/api/transactions/update/1").send({
      date: "2022-01-01",
      description: "Updated Transaction",
      amount: 200,
      Currency: "USD",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Transaction updated successfully",
      transaction: { id: 1, description: "Updated Transaction" },
    });
  });

  it("should route to deleteTransactionController", async () => {
    const response = await request(app).delete("/api/transactions/delete/1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Transaction marked as deleted successfully",
    });
  });

  it("should route to uploadCSVController", async () => {
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
});
