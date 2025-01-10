import request from "supertest";
import express from "express";
import transactionRoutes from "./transaction.routes"; // Same folder, so use relative path
import { MikroORM } from "@mikro-orm/postgresql";

// Create a simple express app for testing
const app = express();
app.use(express.json());
app.use("/api/transactions", transactionRoutes);

// Mock MikroORM to avoid actual DB calls during testing
jest.mock("@mikro-orm/postgresql", () => ({
  MikroORM: {
    init: jest.fn().mockResolvedValue({
      em: {
        fork: jest.fn().mockReturnValue({
          findOne: jest.fn(),
          find: jest.fn(),
          persistAndFlush: jest.fn(),
          create: jest.fn(),
        }),
      },
    }),
  },
}));

describe("Transaction Routes", () => {
  it("should fetch all transactions", async () => {
    const res = await request(app).get("/api/transactions");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should add a new transaction", async () => {
    const transactionData = {
      date: "2025-01-10",
      description: "Test Transaction",
      amount: 100,
      Currency: "USD",
    };

    const res = await request(app)
      .post("/api/transactions")
      .send(transactionData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("date", "2025-01-10");
    expect(res.body).toHaveProperty("description", "Test Transaction");
  });

  it("should update a transaction", async () => {
    const updatedData = {
      date: "2025-01-11",
      description: "Updated Transaction",
      amount: 200,
      Currency: "USD",
    };

    const res = await request(app).put("/api/transactions/1").send(updatedData);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("date", "2025-01-11");
    expect(res.body).toHaveProperty("description", "Updated Transaction");
  });

  it("should delete a transaction", async () => {
    const res = await request(app).delete("/api/transactions/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Transaction marked as deleted successfully"
    );
  });

  it("should upload a CSV file", async () => {
    const res = await request(app)
      .post("/api/transactions/upload")
      .attach("file", "./src/routes/test-file.csv"); // Correct path to the test CSV file (make sure you have a sample CSV file here)
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "CSV file processed successfully"
    );
  });
});
