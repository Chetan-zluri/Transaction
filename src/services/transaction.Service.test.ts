// import { MikroORM } from "@mikro-orm/postgresql";
// import { Transaction } from "../entities/Transaction";
// import * as transactionService from "./transaction.Service"; // Adjust the path
// import { mockResponse, mockRequest } from "jest-mock-express";
// import { Request, Response } from "express";

// // Mock MikroORM and entities
// jest.mock("@mikro-orm/postgresql");

// describe("Transaction Service", () => {
//   let mockTransactions: Transaction[];
//   let em: any; // Mocked EntityManager

//   beforeEach(() => {
//     mockTransactions = [
//       new Transaction({
//         date: new Date(),
//         description: "Test Transaction",
//         amount: 100,
//         Currency: "USD",
//         deleted: false,
//       }),
//     ];

//     em = {
//       find: jest.fn(),
//       create: jest.fn(),
//       persist: jest.fn(),
//       persistAndFlush: jest.fn(),
//       flush: jest.fn(),
//       findOne: jest.fn(),
//     };
//   });

//   it("should fetch all transactions", async () => {
//     // Mock the `find` method to return the mock transactions
//     em.find.mockResolvedValue(mockTransactions);

//     // Call the service function
//     const result = await transactionService.getAllTransactions(em);

//     expect(result).toEqual(mockTransactions);
//     expect(em.find).toHaveBeenCalledWith(
//       Transaction,
//       { deleted: false },
//       { orderBy: { date: "DESC" } }
//     );
//   });

//   it("should add a new transaction", async () => {
//     // Mock the `findOne` method to return null (indicating no duplicate)
//     em.findOne.mockResolvedValue(null);

//     const newTransactionData = {
//       date: new Date(),
//       description: "New Transaction",
//       amount: 50,
//       Currency: "USD",
//     };

//     // Mock the `create` and `persistAndFlush` methods
//     em.create.mockReturnValue(mockTransactions[0]);
//     em.persistAndFlush.mockResolvedValue(undefined);

//     // Call the service function
//     const result = await transactionService.addTransaction(
//       newTransactionData,
//       em
//     );

//     expect(result).toHaveProperty("id");
//     expect(em.create).toHaveBeenCalledWith(Transaction, {
//       ...newTransactionData,
//       deleted: false,
//     });
//   });

//   it("should update a transaction", async () => {
//     const updatedData = { description: "Updated Transaction", amount: 200 };

//     // Mock findOne to return the existing transaction
//     em.findOne.mockResolvedValue(mockTransactions[0]);

//     // Mock persist to resolve without errors
//     em.persist.mockResolvedValue(undefined);

//     // Call the service function
//     const result = await transactionService.updateTransaction(
//       1,
//       updatedData,
//       em
//     );

//     expect(result.description).toBe(updatedData.description);
//     expect(result.amount).toBe(updatedData.amount);
//   });

//   it("should delete a transaction", async () => {
//     // Mock findOne to return the existing transaction
//     em.findOne.mockResolvedValue(mockTransactions[0]);

//     // Mock flush to resolve without errors
//     em.flush.mockResolvedValue(undefined);

//     // Call the service function
//     const result = await transactionService.deleteTransaction(1, em);

//     expect(result.deleted).toBe(true);
//     expect(em.flush).toHaveBeenCalled();
//   });

//   it("should process CSV and add valid transactions", async () => {
//     const rows = [
//       ["2025-01-01", "Valid Transaction", "100", "USD"],
//       ["2025-01-02", "Duplicate Transaction", "150", "USD"], // Assume duplicate logic is handled
//     ];

//     // Mock the findOne to return null for valid row and mock existing duplicate row
//     em.findOne
//       .mockResolvedValueOnce(null)
//       .mockResolvedValueOnce(mockTransactions[0]);

//     // Mock persistAndFlush to resolve without errors
//     em.persistAndFlush.mockResolvedValue(undefined);

//     // Call the service function
//     const { transactions, invalidRows } = await transactionService.processCSV(
//       rows,
//       em
//     );

//     // Assert valid transaction processing and invalid row handling
//     expect(transactions).toHaveLength(1);
//     expect(invalidRows).toHaveLength(1);
//     expect(em.persistAndFlush).toHaveBeenCalled();
//   });
// });
