"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const transaction_controller_1 = require("./transaction.controller");
const transactionService = __importStar(require("../services/transaction.Service"));
jest.mock("../services/transaction.Service");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const upload = (0, multer_1.default)({ dest: "uploads/" });
app.get("/api/transactions", transaction_controller_1.getAllTransactionsController);
app.post("/api/transactions", transaction_controller_1.addTransactionController);
app.put("/api/transactions/:id", transaction_controller_1.updateTransactionController);
app.delete("/api/transactions/:id", transaction_controller_1.deleteTransactionController);
app.delete("api/transactions/delete-multiple", transaction_controller_1.deleteTransactionsController);
app.post("/api/upload", upload.single("file"), transaction_controller_1.uploadCSVController);
app.get("/api/transactions/:id", transaction_controller_1.getTransactionByIdController);
describe("Transaction Controllers", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("getAllTransactionsController", () => {
        it("should return all transactions with pagination info", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransactions = [{ id: 1, description: "Test Transaction" }];
            const totalCount = 1;
            transactionService.getAllTransactions.mockResolvedValue({
                transactions: mockTransactions,
                totalCount,
            });
            const response = yield (0, supertest_1.default)(app).get("/api/transactions?page=1&limit=50");
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                transactions: mockTransactions,
                totalPages: Math.ceil(totalCount / 50),
                totalCount,
            });
            expect(transactionService.getAllTransactions).toHaveBeenCalledWith(1, 50);
            expect(transactionService.getAllTransactions).toHaveBeenCalledTimes(1);
        }));
        it("should return 400 for invalid query parameters", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/api/transactions?page=-1&limit=50");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid Query parameters");
            const response2 = yield (0, supertest_1.default)(app).get("/api/transactions?page=1&limit=-3");
            expect(response2.status).toBe(400);
            expect(response2.body.error).toBe("Invalid Query parameters");
            const response3 = yield (0, supertest_1.default)(app).get("/api/transactions?page=1&limit=abc");
            expect(response3.status).toBe(400);
            expect(response3.body.error).toBe("Invalid Query parameters");
        }));
        it("should handle errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.getAllTransactions.mockRejectedValue(new Error("Database error"));
            const response = yield (0, supertest_1.default)(app).get("/api/transactions?page=1&limit=50");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Database error");
        }));
    });
    describe("getTransactionByIdController", () => {
        it("should return the transaction when found", () => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = {
                id: 1,
                date: "2025-01-01T00:00:00Z",
                description: "Test Transaction",
                amount: 100,
                Currency: "USD",
                deleted: false,
            };
            transactionService.getTransactionById.mockResolvedValue(transaction);
            const response = yield (0, supertest_1.default)(app).get("/api/transactions/1");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(transaction);
            expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
        }));
        it("should return 404 when the transaction is not found", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.getTransactionById.mockRejectedValue(new Error("Transaction with ID 1 not found"));
            const response = yield (0, supertest_1.default)(app).get("/api/transactions/1");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Transaction with ID 1 not found");
            expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
        }));
        it("should return 500 for other errors", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.getTransactionById.mockRejectedValue(new Error("Internal Server Error"));
            const response = yield (0, supertest_1.default)(app).get("/api/transactions/1");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Internal Server Error");
            expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
        }));
        it("should return 500 for unexpected errors", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.getTransactionById.mockRejectedValue(new Error("An unexpected error occurred"));
            const response = yield (0, supertest_1.default)(app).get("/api/transactions/1");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("An unexpected error occurred");
            expect(transactionService.getTransactionById).toHaveBeenCalledWith(1);
        }));
    });
    describe("addTransactionController", () => {
        it("should add a transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransaction = { id: 1, description: "New Transaction" };
            transactionService.addTransaction.mockResolvedValue(mockTransaction);
            const response = yield (0, supertest_1.default)(app).post("/api/transactions").send({
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
        }));
        it("should handle validation errors", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/api/transactions").send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("All fields are required");
        }));
        it("should handle validation errors when 'deleted' field is provided", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/api/transactions").send({
                date: "2023-12-01",
                description: "New Transaction",
                amount: 100,
                Currency: "USD",
                deleted: true,
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("'deleted' field is not allowed.");
        }));
        it("should handle transaction already exists error", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.addTransaction.mockRejectedValue(new Error("Transaction already exists"));
            const response = yield (0, supertest_1.default)(app).post("/api/transactions").send({
                date: "2023-12-01",
                description: "New Transaction",
                amount: 100,
                Currency: "USD",
            });
            expect(response.status).toBe(409);
            expect(response.body.message).toBe("Transaction already exists");
        }));
        it("should handle errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.addTransaction.mockRejectedValue(new Error("Error adding transaction"));
            const response = yield (0, supertest_1.default)(app).post("/api/transactions").send({
                date: "2023-12-01",
                description: "New Transaction",
                amount: 100,
                Currency: "USD",
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error adding transaction");
        }));
    });
    describe("updateTransactionController", () => {
        it("should update a transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransaction = { id: 1, description: "Updated Transaction" };
            transactionService.updateTransaction.mockResolvedValue(mockTransaction);
            const response = yield (0, supertest_1.default)(app).put("/api/transactions/1").send({
                description: "Updated Transaction",
            });
            expect(response.status).toBe(200);
            expect(response.body.transaction).toEqual(mockTransaction);
            expect(transactionService.updateTransaction).toHaveBeenCalledWith(1, {
                description: "Updated Transaction",
            });
        }));
        it("should handle transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.updateTransaction.mockImplementation(() => {
                throw new Error("Transaction not found or is deleted");
            });
            const response = yield (0, supertest_1.default)(app).put("/api/transactions/1").send({
                description: "Updated Transaction",
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Transaction not found");
        }));
        it("should handle transaction already exists with the same data", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.updateTransaction.mockImplementation(() => {
                throw new Error("Transaction already exists with the same data");
            });
            const response = yield (0, supertest_1.default)(app).put("/api/transactions/1").send({
                description: "Existing Transaction",
            });
            expect(response.status).toBe(409);
            expect(response.body.message).toBe("Transaction already exists with the same data");
        }));
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
        it("should handle errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.updateTransaction.mockRejectedValue(new Error("Error updating transaction"));
            const response = yield (0, supertest_1.default)(app).put("/api/transactions/1").send({
                description: "Updated Transaction",
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error updating transaction");
        }));
    });
    describe("deleteTransactionController", () => {
        it("should delete a transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.deleteTransaction.mockResolvedValue({
                id: 1,
                deleted: true,
            });
            const response = yield (0, supertest_1.default)(app).delete("/api/transactions/1");
            expect(response.status).toBe(200);
            expect(response.body.message).toContain("Transaction marked as deleted successfully");
            expect(transactionService.deleteTransaction).toHaveBeenCalledWith(1);
        }));
        it("should handle invalid id", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete("/api/transactions/invalid");
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid id");
        }));
        it("should handle transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.deleteTransaction.mockImplementation(() => {
                throw new Error("Transaction not found");
            });
            const response = yield (0, supertest_1.default)(app).delete("/api/transactions/1");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Transaction not found");
        }));
        it("should handle errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.deleteTransaction.mockRejectedValue(new Error("Error deleting transaction"));
            const response = yield (0, supertest_1.default)(app).delete("/api/transactions/1");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error deleting transaction");
        }));
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
        it("should process a valid CSV file", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransactions = [{ id: 1, description: "Test" }];
            transactionService.processCSV.mockResolvedValue({
                message: "CSV file processed successfully",
                transactions: mockTransactions,
            });
            const csvContent = "date,description,amount,Currency\n2023-12-01,Test,100,USD";
            const filePath = path_1.default.join(__dirname, "test.csv");
            fs_1.default.writeFileSync(filePath, csvContent);
            const response = yield (0, supertest_1.default)(app)
                .post("/api/upload")
                .attach("file", filePath);
            expect(response.status).toBe(200);
            expect(response.body.transactions).toEqual(mockTransactions);
            fs_1.default.unlinkSync(filePath); // Clean up
        }));
        it("should handle no file uploaded", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/api/upload");
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("No file uploaded");
        }));
        it("should handle CSV parsing errors", () => __awaiter(void 0, void 0, void 0, function* () {
            transactionService.processCSV.mockImplementation(() => {
                throw new Error("Error parsing CSV file: Invalid CSV format");
            });
            const csvContent = "date,description,amount,Currency\n2023-12-01,Test,100,USD";
            const filePath = path_1.default.join(__dirname, "test.csv");
            fs_1.default.writeFileSync(filePath, csvContent);
            const response = yield (0, supertest_1.default)(app)
                .post("/api/upload")
                .attach("file", filePath);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Error parsing CSV file: Invalid CSV format");
            fs_1.default.unlinkSync(filePath); // Clean up
        }));
        it("should handle BOM removal", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransactions = [{ id: 1, description: "Test" }];
            transactionService.processCSV.mockResolvedValue({
                message: "CSV file processed successfully",
                transactions: mockTransactions,
            });
            const csvContent = "\ufeffdate,description,amount,Currency\n2023-12-01,Test,100,USD";
            const filePath = path_1.default.join(__dirname, "test.csv");
            fs_1.default.writeFileSync(filePath, csvContent);
            const response = yield (0, supertest_1.default)(app)
                .post("/api/upload")
                .attach("file", filePath);
            expect(response.status).toBe(200);
            expect(response.body.transactions).toEqual(mockTransactions);
            fs_1.default.unlinkSync(filePath); // Clean up
        }));
    });
    it("should remove BOM character if present", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockTransactions = [{ id: 1, description: "Test" }];
        transactionService.processCSV.mockResolvedValue({
            message: "CSV file processed successfully",
            transactions: mockTransactions,
        });
        const csvContent = "\ufeffdate,description,amount,Currency\n2023-12-01,Test,100,USD";
        const filePath = path_1.default.join(__dirname, "test.csv");
        fs_1.default.writeFileSync(filePath, csvContent);
        const response = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .attach("file", filePath);
        expect(response.status).toBe(200);
        expect(response.body.transactions).toEqual(mockTransactions);
        fs_1.default.unlinkSync(filePath); // Clean up
    }));
    it("should return unchanged string if BOM character is not present", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockTransactions = [{ id: 1, description: "Test" }];
        transactionService.processCSV.mockResolvedValue({
            message: "CSV file processed successfully",
            transactions: mockTransactions,
        });
        const csvContent = "date,description,amount,Currency\n2023-12-01,Test,100,USD";
        const filePath = path_1.default.join(__dirname, "test.csv");
        fs_1.default.writeFileSync(filePath, csvContent);
        const response = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .attach("file", filePath);
        expect(response.status).toBe(200);
        expect(response.body.transactions).toEqual(mockTransactions);
        fs_1.default.unlinkSync(filePath); // Clean up
    }));
});
