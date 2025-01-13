// import request from "supertest";
// import appfinal from "../server"; // Import the app Promise

// let app: Express.Application;

// beforeAll(async () => {
//   app = await appfinal; // Resolve the app Promise before running tests
// });

// describe("Transaction Routes", () => {
//   it("should fetch all transactions", async () => {
//     const res = await request(app).get("/api/transactions");
//     expect(res.status).toBe(200);
//     expect(res.body).toBeInstanceOf(Array);
//   });

//   it("should add a new transaction", async () => {
//     const transaction = {
//       date: "2025-01-10",
//       description: "Test Transaction",
//       amount: 100,
//       currency: "USD",
//     };
//     const res = await request(app).post("/api/transactions").send(transaction);
//     expect(res.status).toBe(201);
//     expect(res.body).toHaveProperty("id");
//   });

//   it("should handle file uploads", async () => {
//     const res = await request(app)
//       .post("/api/transactions/upload")
//       .attach("file", "path/to/your/test.csv"); // Provide a test CSV file path
//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty("message", "File processed successfully");
//   });
// });
