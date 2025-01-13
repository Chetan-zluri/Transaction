import request from "supertest";
import appfinal from "./server"; // Path to your server file
import { Request, Response, NextFunction } from "express";

describe("Server and Route Integration Tests", () => {
  let server: any;

  beforeAll(async () => {
    server = await appfinal;
  });

  afterAll(() => {
    if (server && server.close) {
      server.close();
    }
  });

  test("GET / - should return server is running message", async () => {
    const response = await request(server).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Server is running!" });
  });

  describe("Transaction Routes", () => {
    test("GET /api/transactions - should return all transactions", async () => {
      const response = await request(server).get("/api/transactions");
      expect(response.status).toBe(200);
      // Assuming your real controller returns some transactions
      expect(response.body).toEqual(
        expect.objectContaining({ transactions: expect.any(Array) })
      );
    });

    test("POST /api/transactions - should add a transaction", async () => {
      const transactionData = { name: "Test Transaction", amount: 100 };
      const response = await request(server)
        .post("/api/transactions")
        .send(transactionData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({ message: "Transaction added" })
      );
    });

    test("PUT /api/transactions/update/:id - should update a transaction", async () => {
      const transactionId = "1";
      const updatedData = { name: "Updated Transaction", amount: 150 };
      const response = await request(server)
        .put(`/api/transactions/update/${transactionId}`)
        .send(updatedData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({ message: "Transaction updated" })
      );
    });

    test("DELETE /api/transactions/delete/:id - should delete a transaction", async () => {
      const transactionId = "1";
      const response = await request(server).delete(
        `/api/transactions/delete/${transactionId}`
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({ message: "Transaction deleted" })
      );
    });

    test("POST /api/transactions/upload - should upload a CSV file", async () => {
      const response = await request(server)
        .post("/api/transactions/upload")
        .attach("file", Buffer.from("test,csv,data"), "test.csv");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({ message: "CSV uploaded successfully" })
      );
    });

    test("POST /api/transactions/upload - should reject non-CSV file", async () => {
      const response = await request(server)
        .post("/api/transactions/upload")
        .attach("file", Buffer.from("not a csv"), "test.txt");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Only CSV files are allowed"
      );
    });

    test("POST /api/transactions/upload - should reject file exceeding size limit", async () => {
      const largeFile = Buffer.alloc(2 * 1024 * 1024); // 2 MB file
      const response = await request(server)
        .post("/api/transactions/upload")
        .attach("file", largeFile, "large.csv");
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("File size exceeds limit");
    });
  });

  test("Unhandled error handling", async () => {
    const mockError = new Error("Mock error");

    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress logs in the test

    server.use((req: Request, res: Response, next: NextFunction) => {
      next(mockError); // Force an error
    });

    const response = await request(server).get("/");
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty(
      "message",
      `Internal server error: ${mockError.message}`
    );
    jest.restoreAllMocks();
  });
});
