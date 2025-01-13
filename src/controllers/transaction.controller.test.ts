import request from "supertest";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  getAllTransactionsController,
  addTransactionController,
  updateTransactionController,
  deleteTransactionController,
  uploadCSVController,
} from "./transaction.controller";
import * as transactionService from "../services/transaction.Service";

jest.mock("../services/transaction.Service");

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });
app.get("/transactions", getAllTransactionsController);
app.post("/transactions", addTransactionController);
app.put("/transactions/:id", updateTransactionController);
app.delete("/transactions/:id", deleteTransactionController);
app.post("/transactions/upload", upload.single("file"), uploadCSVController);

describe("Transaction Controllers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllTransactionsController", () => {
    it("should return all transactions", async () => {
      const mockTransactions = [{ id: 1, description: "Test Transaction" }];
      (transactionService.getAllTransactions as jest.Mock).mockResolvedValue(
        mockTransactions
      );

      const response = await request(app).get("/transactions");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransactions);
      expect(transactionService.getAllTransactions).toHaveBeenCalledTimes(1);
    });

    it("should handle errors gracefully", async () => {
      (transactionService.getAllTransactions as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/transactions");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Database error");
    });
  });

  describe("addTransactionController", () => {
    it("should add a transaction", async () => {
      const mockTransaction = { id: 1, description: "New Transaction" };
      (transactionService.addTransaction as jest.Mock).mockResolvedValue(
        mockTransaction
      );

      const response = await request(app).post("/transactions").send({
        date: "2023-12-01",
        description: "New Transaction",
        amount: 100,
        Currency: "USD",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockTransaction);
      expect(transactionService.addTransaction).toHaveBeenCalledWith({
        date: "2023-12-01",
        description: "New Transaction",
        amount: 100,
        Currency: "USD",
      });
    });

    it("should handle validation errors", async () => {
      const response = await request(app).post("/transactions").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are required");
    });
  });

  describe("updateTransactionController", () => {
    it("should update a transaction", async () => {
      const mockTransaction = { id: 1, description: "Updated Transaction" };
      (transactionService.updateTransaction as jest.Mock).mockResolvedValue(
        mockTransaction
      );

      const response = await request(app).put("/transactions/1").send({
        description: "Updated Transaction",
      });

      expect(response.status).toBe(200);
      expect(response.body.transaction).toEqual(mockTransaction);
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(1, {
        description: "Updated Transaction",
      });
    });

    it("should handle transaction not found", async () => {
      (transactionService.updateTransaction as jest.Mock).mockImplementation(
        () => {
          throw new Error("Transaction not found");
        }
      );

      const response = await request(app).put("/transactions/1").send({
        description: "Updated Transaction",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Transaction not found");
    });
  });

  describe("deleteTransactionController", () => {
    it("should delete a transaction", async () => {
      (transactionService.deleteTransaction as jest.Mock).mockResolvedValue({
        id: 1,
        deleted: true,
      });

      const response = await request(app).delete("/transactions/1");

      expect(response.status).toBe(200);
      expect(response.body.message).toContain(
        "Transaction marked as deleted successfully"
      );
      expect(transactionService.deleteTransaction).toHaveBeenCalledWith(1);
    });
  });

  describe("uploadCSVController", () => {
    it("should process a valid CSV file", async () => {
      const mockTransactions = [{ id: 1, description: "Test" }];
      const mockInvalidRows = [["invalid", "data"]];
      (transactionService.processCSV as jest.Mock).mockResolvedValue({
        transactions: mockTransactions,
        invalidRows: mockInvalidRows,
      });

      const csvContent =
        "date,description,amount,Currency\n2023-12-01,Test,100,USD";
      const filePath = path.join(__dirname, "test.csv");
      fs.writeFileSync(filePath, csvContent);

      const response = await request(app)
        .post("/transactions/upload")
        .attach("file", filePath);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toEqual(mockTransactions);
      expect(response.body.invalidRows).toEqual(mockInvalidRows);

      fs.unlinkSync(filePath); // Clean up
    });

    it("should handle processing errors", async () => {
      (transactionService.processCSV as jest.Mock).mockImplementation(() => {
        throw new Error("CSV processing error");
      });

      const csvContent =
        "date,description,amount,Currency\n2023-12-01,Test,100,USD";
      const filePath = path.join(__dirname, "test.csv");
      fs.writeFileSync(filePath, csvContent);

      const response = await request(app)
        .post("/transactions/upload")
        .attach("file", filePath);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("CSV processing error");

      fs.unlinkSync(filePath); // Clean up
    });
  });
});
