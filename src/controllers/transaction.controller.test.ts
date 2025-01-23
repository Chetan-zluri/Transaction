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
  deleteTransactionsController,
  uploadCSVController,
  getTransactionByIdController,
} from "./transaction.controller";
import * as transactionService from "../services/transaction.Service";
import { deleteTrans } from "../services/transaction.Service";
jest.mock("../services/transaction.Service");

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });
app.get("/api/transactions", getAllTransactionsController);
app.post("/api/transactions", addTransactionController);
app.put("/api/transactions/:id", updateTransactionController);
app.delete("/api/transactions/:id", deleteTransactionController);
app.delete("api/transactions/delete-multiple", deleteTransactionsController);
app.post("/api/upload", upload.single("file"), uploadCSVController);
app.get("/api/transactions/:id", getTransactionByIdController);

describe("Transaction Controllers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllTransactionsController", () => {
    it("should return all transactions with pagination info", async () => {
      const mockTransactions = [{ id: 1, description: "Test Transaction" }];
      const totalCount = 1;
      (transactionService.getAllTransactions as jest.Mock).mockResolvedValue({
        transactions: mockTransactions,
        totalCount,
      });

      const response = await request(app).get(
        "/api/transactions?page=1&limit=50"
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        transactions: mockTransactions,
        totalPages: Math.ceil(totalCount / 50),
        totalCount,
      });
      expect(transactionService.getAllTransactions).toHaveBeenCalledWith(1, 50);
      expect(transactionService.getAllTransactions).toHaveBeenCalledTimes(1);
    });

    it("should return 400 for invalid query parameters", async () => {
      const response = await request(app).get(
        "/api/transactions?page=-1&limit=50"
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid Query parameters");

      const response2 = await request(app).get(
        "/api/transactions?page=1&limit=-3"
      );
      expect(response2.status).toBe(400);
      expect(response2.body.error).toBe("Invalid Query parameters");

      const response3 = await request(app).get(
        "/api/transactions?page=1&limit=abc"
      );
      expect(response3.status).toBe(400);
      expect(response3.body.error).toBe("Invalid Query parameters");
    });

    it("should handle errors gracefully", async () => {
      (transactionService.getAllTransactions as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get(
        "/api/transactions?page=1&limit=50"
      );

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Database error");
    });
  });

  describe("getTransactionByIdController", () => {
    it("should return the transaction when found", async () => {
      const transaction = {
        id: 1,
        date: "2025-01-01T00:00:00Z",
        description: "Test Transaction",
        amount: 100,
        Currency: "USD",
        deleted: false,
      };
      (transactionService.getTransactionById as jest.Mock).mockResolvedValue(
        transaction
      );
      const response = await request(app).get("/api/transactions/1");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(transaction);
      expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
    });

    it("should return 404 when the transaction is not found", async () => {
      (transactionService.getTransactionById as jest.Mock).mockRejectedValue(
        new Error("Transaction with ID 1 not found")
      );
      const response = await request(app).get("/api/transactions/1");
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Transaction with ID 1 not found");
      expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
    });

    it("should return 500 for other errors", async () => {
      (transactionService.getTransactionById as jest.Mock).mockRejectedValue(
        new Error("Internal Server Error")
      );
      const response = await request(app).get("/api/transactions/1");
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal Server Error");
      expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
    });

    it("should return 500 for unexpected errors", async () => {
      (transactionService.getTransactionById as jest.Mock).mockRejectedValue(
        new Error("An unexpected error occurred")
      );
      const response = await request(app).get("/api/transactions/1");
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("An unexpected error occurred");
      expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
    });
  });

  describe("addTransactionController", () => {
    it("should add a transaction", async () => {
      const mockTransaction = { id: 1, description: "New Transaction" };
      (transactionService.addTransaction as jest.Mock).mockResolvedValue(
        mockTransaction
      );

      const response = await request(app).post("/api/transactions").send({
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
      const response = await request(app).post("/api/transactions").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are required");
    });

    it("should handle validation errors when 'deleted' field is provided", async () => {
      const response = await request(app).post("/api/transactions").send({
        date: "2023-12-01",
        description: "New Transaction",
        amount: 100,
        Currency: "USD",
        deleted: true,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("'deleted' field is not allowed.");
    });

    it("should handle transaction already exists error", async () => {
      (transactionService.addTransaction as jest.Mock).mockRejectedValue(
        new Error("Transaction already exists")
      );

      const response = await request(app).post("/api/transactions").send({
        date: "2023-12-01",
        description: "New Transaction",
        amount: 100,
        Currency: "USD",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Transaction already exists");
    });

    it("should handle errors gracefully", async () => {
      (transactionService.addTransaction as jest.Mock).mockRejectedValue(
        new Error("Error adding transaction")
      );

      const response = await request(app).post("/api/transactions").send({
        date: "2023-12-01",
        description: "New Transaction",
        amount: 100,
        Currency: "USD",
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error adding transaction");
    });
  });

  describe("updateTransactionController", () => {
    it("should update a transaction", async () => {
      const mockTransaction = { id: 1, description: "Updated Transaction" };
      (transactionService.updateTransaction as jest.Mock).mockResolvedValue(
        mockTransaction
      );

      const response = await request(app).put("/api/transactions/1").send({
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
          throw new Error("Transaction not found or is deleted");
        }
      );
      const response = await request(app).put("/api/transactions/1").send({
        description: "Updated Transaction",
      });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Transaction not found");
    });

    it("should handle transaction already exists with the same data", async () => {
      (transactionService.updateTransaction as jest.Mock).mockImplementation(
        () => {
          throw new Error("Transaction already exists with the same data");
        }
      );

      const response = await request(app).put("/api/transactions/1").send({
        description: "Existing Transaction",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Transaction already exists with the same data"
      );
    });

    // it("should return 400 for invalid amount", async () => {
    //   (transactionService.updateTransaction as jest.Mock).mockRejectedValue(
    //     new Error("Amount must be greater than zero")
    //   );
    //   const transaction = {
    //     description: "Updated test",
    //     amount: -20,
    //     date: "2023-02-01",
    //     Currency: "EUR",
    //   };
    //   const response = await request(app)
    //     .put("/transactions/1")
    //     .send(transaction);
    //   expect(response.status).toBe(400);
    //   expect(response.body).toEqual({
    //     message: "Amount must be greater than zero",
    //   });
    // });

    it("should handle errors gracefully", async () => {
      (transactionService.updateTransaction as jest.Mock).mockRejectedValue(
        new Error("Error updating transaction")
      );
      const response = await request(app).put("/api/transactions/1").send({
        description: "Updated Transaction",
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error updating transaction");
    });
  });

  describe("deleteTransactionController", () => {
    it("should delete a transaction", async () => {
      (transactionService.deleteTransaction as jest.Mock).mockResolvedValue({
        id: 1,
        deleted: true,
      });

      const response = await request(app).delete("/api/transactions/1");

      expect(response.status).toBe(200);
      expect(response.body.message).toContain(
        "Transaction marked as deleted successfully"
      );
      expect(transactionService.deleteTransaction).toHaveBeenCalledWith(1);
    });

    it("should handle invalid id", async () => {
      const response = await request(app).delete("/api/transactions/invalid");
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid id");
    });

    it("should handle transaction not found", async () => {
      (transactionService.deleteTransaction as jest.Mock).mockImplementation(
        () => {
          throw new Error("Transaction not found");
        }
      );

      const response = await request(app).delete("/api/transactions/1");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Transaction not found");
    });

    it("should handle errors gracefully", async () => {
      (transactionService.deleteTransaction as jest.Mock).mockRejectedValue(
        new Error("Error deleting transaction")
      );

      const response = await request(app).delete("/api/transactions/1");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error deleting transaction");
    });
  });

  // describe("deleteTransactionsController", () => {
  //   it("should delete the specified transactions and return a success message", async () => {
  //     const ids = [1, 2, 3];
  //     const deletedTransactions = ids.map((id) => ({ id, deleted: true }));
  //     (deleteTrans as jest.Mock).mockResolvedValue(deletedTransactions);
  //     const response = await request(app)
  //       .delete("/transactions/delete-multiple")
  //       .send({ ids });
  //     expect(response.status).toBe(200);
  //     expect(response.body.message).toBe(
  //       `${deletedTransactions.length} transactions deleted successfully.`
  //     );
  //     expect(response.body.deletedTransactions).toEqual(deletedTransactions);
  //     expect(deleteTrans).toHaveBeenCalledWith(ids);
  //   });

  //   it("should return a 400 status if the input is invalid", async () => {
  //     const response = await request(app)
  //       .delete("/transactions/delete-multiple")
  //       .send({ ids: [] });

  //     expect(response.status).toBe(400);
  //     expect(response.body.message).toBe(
  //       "Invalid input: Array of IDs is required."
  //     );
  //   });

  //   it("should return a 500 status if an error occurs during deletion", async () => {
  //     const ids = [1, 2, 3];
  //     (deleteTrans as jest.Mock).mockRejectedValue(
  //       new Error("An error occurred")
  //     );
  //     const response = await request(app)
  //       .delete("/transactions/delete-multiple")
  //       .send({ ids });
  //     expect(response.status).toBe(500);
  //     expect(response.body.message).toBe(
  //       "An error occurred while deleting transactions."
  //     );
  //   });
  // });

  describe("uploadCSVController", () => {
    it("should process a valid CSV file", async () => {
      const mockTransactions = [{ id: 1, description: "Test" }];
      (transactionService.processCSV as jest.Mock).mockResolvedValue({
        message: "CSV file processed successfully",
        transactions: mockTransactions,
      });

      const csvContent =
        "date,description,amount,Currency\n2023-12-01,Test,100,USD";
      const filePath = path.join(__dirname, "test.csv");
      fs.writeFileSync(filePath, csvContent);

      const response = await request(app)
        .post("/api/upload")
        .attach("file", filePath);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toEqual(mockTransactions);

      fs.unlinkSync(filePath); // Clean up
    });

    it("should handle no file uploaded", async () => {
      const response = await request(app).post("/api/upload");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("No file uploaded");
    });

    it("should handle CSV parsing errors", async () => {
      (transactionService.processCSV as jest.Mock).mockImplementation(() => {
        throw new Error("Error parsing CSV file: Invalid CSV format");
      });

      const csvContent =
        "date,description,amount,Currency\n2023-12-01,Test,100,USD";
      const filePath = path.join(__dirname, "test.csv");
      fs.writeFileSync(filePath, csvContent);

      const response = await request(app)
        .post("/api/upload")
        .attach("file", filePath);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe(
        "Error parsing CSV file: Invalid CSV format"
      );

      fs.unlinkSync(filePath); // Clean up
    });

    it("should handle BOM removal", async () => {
      const mockTransactions = [{ id: 1, description: "Test" }];
      (transactionService.processCSV as jest.Mock).mockResolvedValue({
        message: "CSV file processed successfully",
        transactions: mockTransactions,
      });

      const csvContent =
        "\ufeffdate,description,amount,Currency\n2023-12-01,Test,100,USD";
      const filePath = path.join(__dirname, "test.csv");
      fs.writeFileSync(filePath, csvContent);

      const response = await request(app)
        .post("/api/upload")
        .attach("file", filePath);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toEqual(mockTransactions);

      fs.unlinkSync(filePath); // Clean up
    });
  });
  it("should remove BOM character if present", async () => {
    const mockTransactions = [{ id: 1, description: "Test" }];
    (transactionService.processCSV as jest.Mock).mockResolvedValue({
      message: "CSV file processed successfully",
      transactions: mockTransactions,
    });

    const csvContent =
      "\ufeffdate,description,amount,Currency\n2023-12-01,Test,100,USD";
    const filePath = path.join(__dirname, "test.csv");
    fs.writeFileSync(filePath, csvContent);

    const response = await request(app)
      .post("/api/upload")
      .attach("file", filePath);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toEqual(mockTransactions);

    fs.unlinkSync(filePath); // Clean up
  });

  it("should return unchanged string if BOM character is not present", async () => {
    const mockTransactions = [{ id: 1, description: "Test" }];
    (transactionService.processCSV as jest.Mock).mockResolvedValue({
      message: "CSV file processed successfully",
      transactions: mockTransactions,
    });

    const csvContent =
      "date,description,amount,Currency\n2023-12-01,Test,100,USD";
    const filePath = path.join(__dirname, "test.csv");
    fs.writeFileSync(filePath, csvContent);

    const response = await request(app)
      .post("/api/upload")
      .attach("file", filePath);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toEqual(mockTransactions);

    fs.unlinkSync(filePath); // Clean up
  });
});
