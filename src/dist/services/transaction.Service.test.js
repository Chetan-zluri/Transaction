"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const Transaction_1 = require("../entities/Transaction");
const transaction_Service_1 = require("../services/transaction.Service");
jest.mock("@mikro-orm/postgresql");
jest.mock("../mikro-orm.config");
describe("Transaction Services", () => {
    let ormMock;
    let emMock;
    beforeEach(() => {
        emMock = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
            nativeDelete: jest.fn(),
            persistAndFlush: jest.fn(),
            flush: jest.fn(),
            fork: jest.fn().mockReturnThis(), // mockReturnThis() preserves the type
        };
        ormMock = {
            em: emMock,
        };
        postgresql_1.MikroORM.init.mockResolvedValue(ormMock);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    //GETALLTRANSACTIONS
    it("should get all transactions with pagination", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockTransactions = [
            { id: 1, description: "Test Transaction", deleted: false },
        ];
        const totalCount = 1;
        emMock.find.mockResolvedValue(mockTransactions);
        emMock.count.mockResolvedValue(totalCount);
        const page = 1;
        const limit = 50;
        const result = yield (0, transaction_Service_1.getAllTransactions)(page, limit);
        expect(result).toEqual({ transactions: mockTransactions, totalCount });
        expect(emMock.find).toHaveBeenCalledWith(Transaction_1.Transaction, { deleted: false }, {
            orderBy: { date: "DESC" },
            limit,
            offset: 0,
        });
        expect(emMock.count).toHaveBeenCalledWith(Transaction_1.Transaction, { deleted: false });
    }));
    it("should handle errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.find.mockRejectedValue(new Error("Database error"));
        const page = 1;
        const limit = 50;
        yield expect((0, transaction_Service_1.getAllTransactions)(page, limit)).rejects.toThrow("Database error");
    }));
    //GETSINGLE TRANSACTION
    it("should return the transaction when found", () => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = {
            id: 1,
            date: new Date("2025-01-01T00:00:00Z"),
            description: "Test Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        };
        emMock.findOne.mockResolvedValue(transaction);
        const result = yield (0, transaction_Service_1.getTransactionById)(1);
        expect(result).toEqual(transaction);
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, { id: 1 });
    }));
    it("should throw an error when the transaction is not found", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.findOne.mockResolvedValue(null);
        yield expect((0, transaction_Service_1.getTransactionById)(1)).rejects.toThrow("Transaction with ID 1 not found");
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, { id: 1 });
    }));
    //ADD A NEW TRANSACTION
    it("should add a new transaction", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.findOne.mockResolvedValue(null);
        emMock.create.mockReturnValue({
            id: 1,
            date: new Date("2022-01-01T00:00:00.000Z"),
            description: "New Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        });
        emMock.persistAndFlush.mockResolvedValue(null);
        const transaction = yield (0, transaction_Service_1.addTransaction)({
            date: new Date("2022-01-01"),
            description: "New Transaction",
            amount: 100,
            Currency: "USD",
        });
        expect(transaction).toEqual({
            id: 1,
            date: new Date("2022-01-01T00:00:00.000Z"),
            description: "New Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        });
        expect(emMock.create).toHaveBeenCalledWith(Transaction_1.Transaction, {
            date: new Date("2022-01-01T00:00:00.000Z"),
            description: "New Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        });
        expect(emMock.persistAndFlush).toHaveBeenCalledWith(transaction);
    }));
    it("should throw an error if required fields are missing in addTransaction", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, transaction_Service_1.addTransaction)({ description: "Missing fields" })).rejects.toThrow("All fields (date, description, amount, Currency) are required.");
    }));
    it('should throw an error if "deleted" field is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, transaction_Service_1.addTransaction)({
            date: new Date("2022-01-01"),
            description: "Invalid Transaction",
            amount: 100,
            Currency: "USD",
            deleted: true,
        })).rejects.toThrow("'deleted' field is not allowed.");
    }));
    it("should throw an error if transaction already exists in addTransaction", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.findOne.mockResolvedValue({});
        yield expect((0, transaction_Service_1.addTransaction)({
            date: new Date("2022-01-01"),
            description: "Existing Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        })).rejects.toThrow("Transaction already exists");
    }));
    //UPDATE A TRANSACTION
    it("should update a transaction successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const existingTransaction = {
            id: 1,
            date: new Date("2023-12-01"),
            description: "Old Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        };
        const updatedData = {
            description: "Updated Transaction",
            amount: 150,
        };
        emMock.findOne.mockResolvedValueOnce(existingTransaction);
        emMock.findOne.mockResolvedValueOnce(null);
        emMock.persistAndFlush.mockResolvedValueOnce(undefined);
        const result = yield (0, transaction_Service_1.updateTransaction)(1, updatedData);
        expect(result).toEqual(Object.assign(Object.assign({}, existingTransaction), updatedData));
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            id: 1,
            deleted: false,
        });
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            date: existingTransaction.date,
            description: updatedData.description,
            amount: updatedData.amount,
            Currency: existingTransaction.Currency,
        });
        expect(emMock.persistAndFlush).toHaveBeenCalledWith(Object.assign(Object.assign({}, existingTransaction), updatedData));
    }));
    it("should throw an error if the transaction is not found or deleted", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.findOne.mockResolvedValueOnce(null);
        yield expect((0, transaction_Service_1.updateTransaction)(1, { description: "Updated Transaction" })).rejects.toThrow("Transaction not found or is deleted");
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            id: 1,
            deleted: false,
        });
    }));
    it("should throw an error if a duplicate transaction exists with the same description", () => __awaiter(void 0, void 0, void 0, function* () {
        const existingTransaction = {
            id: 1,
            date: new Date("2023-12-01"),
            description: "Old Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        };
        const duplicateTransaction = {
            id: 2,
            date: new Date("2023-12-01"),
            description: "Updated Transaction",
            amount: 150,
            Currency: "USD",
            deleted: false,
        };
        const updatedData = {
            description: "Updated Transaction",
            amount: 150,
        };
        emMock.findOne.mockResolvedValueOnce(existingTransaction);
        emMock.findOne.mockResolvedValueOnce(duplicateTransaction);
        yield expect((0, transaction_Service_1.updateTransaction)(1, updatedData)).rejects.toThrow("Transaction already exists with the same data");
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            id: 1,
            deleted: false,
        });
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            date: existingTransaction.date,
            description: updatedData.description,
            amount: updatedData.amount,
            Currency: existingTransaction.Currency,
        });
    }));
    it("should throw an error if a duplicate transaction exists with the same date", () => __awaiter(void 0, void 0, void 0, function* () {
        const existingTransaction = {
            id: 1,
            date: new Date("2023-12-01"),
            description: "Old Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        };
        const duplicateTransaction = {
            id: 2,
            date: new Date("2023-12-01"),
            description: "Old Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        };
        const updatedData = {
            date: new Date("2023-12-01"),
            description: "Old Transaction",
            amount: 100,
            Currency: "USD",
        };
        emMock.findOne.mockResolvedValueOnce(existingTransaction);
        emMock.findOne.mockResolvedValueOnce(duplicateTransaction);
        yield expect((0, transaction_Service_1.updateTransaction)(1, updatedData)).rejects.toThrow("Transaction already exists with the same data");
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            id: 1,
            deleted: false,
        });
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            date: updatedData.date,
            description: updatedData.description,
            amount: updatedData.amount,
            Currency: updatedData.Currency,
        });
    }));
    it("should handle errors during database operations", () => __awaiter(void 0, void 0, void 0, function* () {
        const existingTransaction = {
            id: 1,
            date: new Date("2023-12-01"),
            description: "Old Transaction",
            amount: 100,
            Currency: "USD",
            deleted: false,
        };
        emMock.findOne.mockResolvedValueOnce(existingTransaction);
        emMock.findOne.mockResolvedValueOnce(null);
        emMock.persistAndFlush.mockRejectedValueOnce(new Error("Database error"));
        yield expect((0, transaction_Service_1.updateTransaction)(1, { description: "Updated Transaction" })).rejects.toThrow("Database error");
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            id: 1,
            deleted: false,
        });
        expect(emMock.findOne).toHaveBeenCalledWith(Transaction_1.Transaction, {
            date: existingTransaction.date,
            description: "Updated Transaction",
            amount: existingTransaction.amount,
            Currency: existingTransaction.Currency,
        });
        expect(emMock.persistAndFlush).toHaveBeenCalledWith(Object.assign(Object.assign({}, existingTransaction), { description: "Updated Transaction" }));
    }));
    //DELETE A TRANSACTION
    it("should delete a transaction", () => __awaiter(void 0, void 0, void 0, function* () {
        const existingTransaction = {
            id: 1,
            description: "Existing Transaction",
            deleted: false,
        };
        emMock.findOne.mockResolvedValueOnce(existingTransaction);
        emMock.flush.mockResolvedValue(null);
        const result = yield (0, transaction_Service_1.deleteTransaction)(1);
        expect(result).toEqual(existingTransaction);
        expect(existingTransaction.deleted).toBe(true);
        expect(emMock.flush).toHaveBeenCalled();
    }));
    it("should throw an error if transaction is not found in deleteTransaction", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.findOne.mockResolvedValue(null);
        yield expect((0, transaction_Service_1.deleteTransaction)(1)).rejects.toThrow("Transaction not found");
    }));
    //DELETE TRANSACTIONS
    it("should soft delete the specified transactions", () => __awaiter(void 0, void 0, void 0, function* () {
        const ids = [1, 2, 3];
        const transactions = ids.map((id) => ({ id, deleted: false }));
        emMock.find.mockResolvedValue(transactions);
        const result = yield (0, transaction_Service_1.deleteTrans)(ids);
        expect(emMock.find).toHaveBeenCalledWith(Transaction_1.Transaction, { id: { $in: ids } });
        transactions.forEach((transaction) => {
            expect(transaction.deleted).toBe(true);
        });
        expect(emMock.flush).toHaveBeenCalled();
        expect(result).toEqual(transactions);
    }));
    it("should throw an error if no transactions are found", () => __awaiter(void 0, void 0, void 0, function* () {
        const ids = [1, 2, 3];
        emMock.find.mockResolvedValue([]);
        yield expect((0, transaction_Service_1.deleteTrans)(ids)).rejects.toThrow("No transactions found with the provided IDs.");
        expect(emMock.find).toHaveBeenCalledWith(Transaction_1.Transaction, { id: { $in: ids } });
        expect(emMock.flush).not.toHaveBeenCalled();
    }));
    //PROCESSCSV
    it("should process a CSV file", () => __awaiter(void 0, void 0, void 0, function* () {
        emMock.find.mockResolvedValue([]);
        emMock.create.mockReturnValue({
            id: 1,
            description: "CSV Transaction",
            date: new Date("2022-01-01"),
            amount: 100,
            Currency: "USD",
            deleted: false,
        });
        emMock.persistAndFlush.mockResolvedValue(null);
        const rows = [["2022-01-01", "CSV Transaction", "100", "USD"]];
        const { message, transactions, invalidRows, duplicateRows } = yield (0, transaction_Service_1.processCSV)(rows);
        expect(message).toBe("CSV file processed successfully");
        expect(transactions).toEqual([
            expect.objectContaining({
                date: new Date("2022-01-01"),
                description: "CSV Transaction",
                amount: 100,
                Currency: "USD",
                deleted: false,
            }),
        ]);
        expect(invalidRows).toEqual([]);
        expect(duplicateRows).toEqual([]);
    }));
    it("should process valid rows and handle duplicates", () => __awaiter(void 0, void 0, void 0, function* () {
        const rows = [
            ["22-01-2025", "Description 1", "100", "USD"], // valid
            ["22-01-2025", "Description 2", "200", "USD"], // valid
            ["invalid-date", "Description 3", "300", "USD"], // invalid date
            ["22-01-2025", "", "400", "USD"], // invalid description
            ["22-01-2025", "Description 4", "", "USD"], // invalid amount
            ["22-01-2025", "Description 5", "-500", "USD"], // invalid amount
            ["22-01-2025", "Description 6", "600", ""], // invalid currency
        ];
        const mockDuplicates = [
            {
                date: new Date("2025-01-22"),
                description: "Description 1",
                deleted: false,
            },
        ];
        emMock.find.mockResolvedValue(mockDuplicates);
        emMock.create.mockImplementation((entity, data) => data);
        const result = yield (0, transaction_Service_1.processCSV)(rows);
        expect(result.invalidRows).toEqual([
            ["invalid-date", "Description 3", "300", "USD"],
            ["22-01-2025", "", "400", "USD"],
            ["22-01-2025", "Description 4", "", "USD"],
            ["22-01-2025", "Description 5", "-500", "USD"],
            ["22-01-2025", "Description 6", "600", ""],
        ]);
        expect(result.duplicateRows).toEqual([
            {
                dateObject: new Date("2025-01-22"),
                description: "Description 1",
                amount: 100,
                Currency: "USD",
            },
        ]);
        expect(result.transactions).toEqual([
            {
                date: new Date("2025-01-22"),
                description: "Description 2",
                amount: 200,
                Currency: "USD",
                deleted: false,
            },
        ]);
        expect(emMock.persistAndFlush).toHaveBeenCalledTimes(1);
        expect(emMock.persistAndFlush).toHaveBeenCalledWith([
            {
                date: new Date("2025-01-22"),
                description: "Description 2",
                amount: 200,
                Currency: "USD",
                deleted: false,
            },
        ]);
    }));
    it("should throw an error if Transactions are already Updated", () => __awaiter(void 0, void 0, void 0, function* () {
        const rows = [
            ["22-01-2025", "Description 1", "100", "USD"], // duplicate
        ];
        const mockDuplicates = [
            {
                date: new Date("2025-01-22"),
                description: "Description 1",
                deleted: false,
            },
        ];
        emMock.find.mockResolvedValue(mockDuplicates);
        yield expect((0, transaction_Service_1.processCSV)(rows)).rejects.toThrow("Transactions are already Updated.");
    }));
    it("should handle batch processing with BATCH_SIZE", () => __awaiter(void 0, void 0, void 0, function* () {
        const rows = Array.from({ length: 105 }, (_, i) => [
            "22-01-2025",
            `Description ${i}`,
            "100",
            "USD",
        ]);
        const mockDuplicates = [];
        emMock.find.mockResolvedValue(mockDuplicates);
        emMock.create.mockImplementation((entity, data) => data);
        yield (0, transaction_Service_1.processCSV)(rows);
        expect(emMock.persistAndFlush).toHaveBeenCalledTimes(2);
        expect(emMock.persistAndFlush).toHaveBeenNthCalledWith(1, expect.any(Array));
        expect(emMock.persistAndFlush).toHaveBeenNthCalledWith(2, expect.any(Array));
    }));
});
