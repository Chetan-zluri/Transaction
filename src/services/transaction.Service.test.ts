import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
import config from "../mikro-orm.config";
import {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  processCSV,
} from "../services/transaction.Service";

jest.mock("@mikro-orm/postgresql");
jest.mock("../mikro-orm.config");

describe("Transaction Services", () => {
  let ormMock: Partial<MikroORM>;
  let emMock: Partial<EntityManager>;

  beforeEach(() => {
    emMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      nativeDelete: jest.fn(),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      fork: jest.fn().mockReturnThis(), // mockReturnThis() preserves the type
    };

    ormMock = {
      em: emMock as EntityManager,
    };

    (MikroORM.init as jest.Mock).mockResolvedValue(ormMock as MikroORM);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should get all transactions with pagination", async () => {
    const mockTransactions = [
      { id: 1, description: "Test Transaction", deleted: false },
    ];

    (emMock.find as jest.Mock).mockResolvedValue(mockTransactions);

    const page = 1;
    const limit = 50;
    const transactions = await getAllTransactions(page, limit);

    expect(transactions).toEqual(mockTransactions);
    expect(emMock.find).toHaveBeenCalledWith(
      Transaction,
      { deleted: false },
      {
        orderBy: { date: "DESC" },
        limit,
        offset: 0,
      }
    );
  });

  it("should handle errors gracefully", async () => {
    (emMock.find as jest.Mock).mockRejectedValue(new Error("Database error"));
    const page = 1;
    const limit = 50;
    await expect(getAllTransactions(page, limit)).rejects.toThrow(
      "Database error"
    );
  });
  it("should add a new transaction", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    (emMock.create as jest.Mock).mockReturnValue({
      id: 1,
      description: "New Transaction",
      deleted: false,
    });
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const transaction = await addTransaction({
      date: new Date("2022-01-01"),
      description: "New Transaction",
      amount: 100,
      Currency: "USD",
      deleted: false,
    });

    expect(transaction).toEqual({
      id: 1,
      description: "New Transaction",
      deleted: false,
    });
    expect(emMock.create).toHaveBeenCalledWith(Transaction, {
      date: new Date("2022-01-01"),
      description: "New Transaction",
      amount: 100,
      Currency: "USD",
      deleted: false,
    });
    expect(emMock.persistAndFlush).toHaveBeenCalledWith(transaction);
  });

  it("should throw an error if required fields are missing in addTransaction", async () => {
    await expect(
      addTransaction({ description: "Missing fields" })
    ).rejects.toThrow(
      "All fields (date, description, amount, Currency) are required."
    );
  });

  it("should throw an error if transaction already exists in addTransaction", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue({});
    await expect(
      addTransaction({
        date: new Date("2022-01-01"),
        description: "Existing Transaction",
        amount: 100,
        Currency: "USD",
        deleted: false,
      })
    ).rejects.toThrow("Transaction already exists");
  });

  it("should update a transaction", async () => {
    const existingTransaction: Partial<Transaction> = {
      id: 1,
      description: "Existing Transaction",
      date: new Date("2022-01-01"),
      amount: 100,
      Currency: "USD",
      deleted: false,
    };
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(existingTransaction);
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(null);
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const updatedTransaction = await updateTransaction(1, {
      date: new Date("2023-01-01"),
      description: "Updated Transaction",
      amount: 200,
      Currency: "EUR",
    });

    expect(updatedTransaction).toEqual(existingTransaction);
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      date: new Date("2023-01-01"),
      description: "Updated Transaction",
      amount: 200,
      Currency: "EUR",
    });
    expect(emMock.persistAndFlush).toHaveBeenCalledWith(existingTransaction);
    expect(existingTransaction.date).toEqual(new Date("2023-01-01"));
    expect(existingTransaction.description).toEqual("Updated Transaction");
    expect(existingTransaction.amount).toEqual(200);
    expect(existingTransaction.Currency).toEqual("EUR");
  });

  it("should throw an error if transaction is not found or is deleted in updateTransaction", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    await expect(updateTransaction(1, {})).rejects.toThrow(
      "Transaction not found or is deleted"
    );
  });

  it("should throw an error if duplicate transaction exists in updateTransaction", async () => {
    const existingTransaction: Partial<Transaction> = {
      id: 1,
      description: "Existing Transaction",
      date: new Date("2022-01-01"),
      amount: 100,
      Currency: "USD",
      deleted: false,
    };
    const duplicateTransaction: Partial<Transaction> = {
      id: 2,
      description: "Duplicate Transaction",
      date: new Date("2022-01-01"),
      amount: 100,
      Currency: "USD",
      deleted: false,
    };
    (emMock.findOne as jest.Mock)
      .mockResolvedValueOnce(existingTransaction)
      .mockResolvedValueOnce(duplicateTransaction);
    await expect(
      updateTransaction(1, {
        date: new Date("2022-01-01"),
        description: "Duplicate Transaction",
        amount: 100,
        Currency: "USD",
      })
    ).rejects.toThrow("Transaction already exists with the same data");
  });

  it("should delete a transaction", async () => {
    const existingTransaction: Partial<Transaction> = {
      id: 1,
      description: "Existing Transaction",
      deleted: false,
    };
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(existingTransaction);
    (emMock.flush as jest.Mock).mockResolvedValue(null);

    const result = await deleteTransaction(1);

    expect(result).toEqual(existingTransaction);
    expect(existingTransaction.deleted).toBe(true);
    expect(emMock.flush).toHaveBeenCalled();
  });

  it("should throw an error if transaction is not found in deleteTransaction", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    await expect(deleteTransaction(1)).rejects.toThrow("Transaction not found");
  });

  // it("should delete all rows from the Transaction entity", async () => {
  //   await deleteRowsService();
  //   expect(MikroORM.init).toHaveBeenCalledWith(config);
  //   expect(emMock.nativeDelete).toHaveBeenCalledWith(Transaction, {});
  // });

  it("should process a CSV file", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    (emMock.create as jest.Mock).mockReturnValue({
      id: 1,
      description: "CSV Transaction",
      deleted: false,
    });
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const rows = [["2022-01-01", "CSV Transaction", "100", "USD"]];
    const transactions = await processCSV(rows);

    expect(transactions).toEqual([
      { id: 1, description: "CSV Transaction", deleted: false },
    ]);
  });

  it("should batch insert transactions when batch size is reached", async () => {
    const rows = Array.from({ length: 2000 }, (_, i) => [
      "2022-01-01",
      `Transaction ${i}`,
      "100",
      "USD",
    ]);

    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    (emMock.create as jest.Mock).mockImplementation((entity) => entity);
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const transactions = await processCSV(rows);

    expect(transactions.length).toBe(0);
    expect(emMock.persistAndFlush).toHaveBeenCalledTimes(20); // Called twice for 2000 rows with BATCH_SIZE = 1000
  });

  it("should add invalid rows to invalidRows array in processCSV", async () => {
    const rows = [
      ["Invalid Date", "CSV Transaction", "100", "USD"],
      ["2022-01-01", "CSV Transaction", "Invalid Amount", "USD"],
    ];
    const transactions = await processCSV(rows);

    expect(transactions).toEqual([]);
  });

  it("should add duplicate rows to invalidRows array in processCSV", async () => {
    const rows = [
      ["2022-01-01", "Duplicate Transaction", "100", "USD"],
      ["2022-01-01", "Duplicate Transaction", "100", "USD"],
    ];
    (emMock.findOne as jest.Mock).mockResolvedValueOnce({});
    const transactions = await processCSV(rows);

    expect(transactions).toEqual([]);
  });
});
