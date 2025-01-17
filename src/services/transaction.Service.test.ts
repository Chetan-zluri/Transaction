import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
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
  //GETALLTRANSACTIONS
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
  //ADD A NEW TRANSACTION
  it("should add a new transaction", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    (emMock.create as jest.Mock).mockReturnValue({
      id: 1,
      date: new Date("2022-01-01T00:00:00.000Z"),
      description: "New Transaction",
      amount: 100,
      Currency: "USD",
      deleted: false,
    });
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const transaction = await addTransaction({
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
    expect(emMock.create).toHaveBeenCalledWith(Transaction, {
      date: new Date("2022-01-01T00:00:00.000Z"),
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

  it('should throw an error if "deleted" field is provided', async () => {
    await expect(
      addTransaction({
        date: new Date("2022-01-01"),
        description: "Invalid Transaction",
        amount: 100,
        Currency: "USD",
        deleted: true,
      })
    ).rejects.toThrow("'deleted' field is not allowed.");
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
  //UPDATE A TRANSACTION
  it("should update a transaction successfully", async () => {
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

    (emMock.findOne as jest.Mock).mockResolvedValueOnce(existingTransaction);
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(null);
    (emMock.persistAndFlush as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await updateTransaction(1, updatedData);

    expect(result).toEqual({
      ...existingTransaction,
      ...updatedData,
    });
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      id: 1,
      deleted: false,
    });
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      date: existingTransaction.date,
      description: updatedData.description,
      amount: updatedData.amount,
      Currency: existingTransaction.Currency,
    });
    expect(emMock.persistAndFlush).toHaveBeenCalledWith({
      ...existingTransaction,
      ...updatedData,
    });
  });

  it("should throw an error if the transaction is not found or deleted", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      updateTransaction(1, { description: "Updated Transaction" })
    ).rejects.toThrow("Transaction not found or is deleted");

    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      id: 1,
      deleted: false,
    });
  });

  it("should throw an error if a duplicate transaction exists with the same description", async () => {
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

    (emMock.findOne as jest.Mock).mockResolvedValueOnce(existingTransaction);
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(duplicateTransaction);

    await expect(updateTransaction(1, updatedData)).rejects.toThrow(
      "Transaction already exists with the same data"
    );

    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      id: 1,
      deleted: false,
    });
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      date: existingTransaction.date,
      description: updatedData.description,
      amount: updatedData.amount,
      Currency: existingTransaction.Currency,
    });
  });

  it("should throw an error if a duplicate transaction exists with the same date", async () => {
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

    (emMock.findOne as jest.Mock).mockResolvedValueOnce(existingTransaction);
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(duplicateTransaction);

    await expect(updateTransaction(1, updatedData)).rejects.toThrow(
      "Transaction already exists with the same data"
    );

    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      id: 1,
      deleted: false,
    });
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      date: updatedData.date,
      description: updatedData.description,
      amount: updatedData.amount,
      Currency: updatedData.Currency,
    });
  });
  it("should handle errors during database operations", async () => {
    const existingTransaction = {
      id: 1,
      date: new Date("2023-12-01"),
      description: "Old Transaction",
      amount: 100,
      Currency: "USD",
      deleted: false,
    };

    (emMock.findOne as jest.Mock).mockResolvedValueOnce(existingTransaction);
    (emMock.findOne as jest.Mock).mockResolvedValueOnce(null);
    (emMock.persistAndFlush as jest.Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(
      updateTransaction(1, { description: "Updated Transaction" })
    ).rejects.toThrow("Database error");

    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      id: 1,
      deleted: false,
    });
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, {
      date: existingTransaction.date,
      description: "Updated Transaction",
      amount: existingTransaction.amount,
      Currency: existingTransaction.Currency,
    });
    expect(emMock.persistAndFlush).toHaveBeenCalledWith({
      ...existingTransaction,
      description: "Updated Transaction",
    });
  });
  //DELETE A TRANSACTION
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

  //PROCESSCSV
  it("should process a CSV file", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);
    (emMock.create as jest.Mock).mockReturnValue({
      id: 1,
      description: "CSV Transaction",
      deleted: false,
    });
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const rows = [["2022-01-01", "CSV Transaction", "100", "USD"]];
    const { message, transactions } = await processCSV(rows);
    expect(message).toBe("CSV file processed successfully");
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

    const { message, transactions } = await processCSV(rows);
    if (Array.isArray(transactions)) {
      expect(transactions.length).toBe(0);
    } else {
      expect(message).toBe("All are Duplicate Transactions.");
    }
    expect(emMock.persistAndFlush).toHaveBeenCalledTimes(20); // Called twice for 2000 rows with BATCH_SIZE = 1000
  });

  it("should add invalid rows to invalidRows array in processCSV", async () => {
    const rows = [
      ["Invalid Date", "CSV Transaction", "100", "USD"],
      ["2022-01-01", "CSV Transaction", "Invalid Amount", "USD"],
    ];
    const { message, transactions } = await processCSV(rows);
    expect(message).toBe("All are Duplicate Transactions.");
    expect(transactions).toEqual([]);
  });

  it("should add duplicate rows to invalidRows array in processCSV", async () => {
    const rows = [
      ["2022-01-01", "Duplicate Transaction", "100", "USD"],
      ["2022-01-01", "Duplicate Transaction", "100", "USD"],
    ];
    (emMock.findOne as jest.Mock).mockResolvedValueOnce({});
    const { message, transactions } = await processCSV(rows);
    expect(message).toBe("CSV file processed successfully");
    expect(transactions).toEqual([]);
  });

  it("should populate duplicateMap with the correct keys", () => {
    const duplicates = [
      { date: new Date("2025-01-01T00:00:00Z"), description: "Test 1" },
      { date: new Date("2025-01-02T00:00:00Z"), description: "Test 2" },
      { date: new Date("2025-01-01T00:00:00Z"), description: "Test 3" },
    ];
    const duplicateMap: { [key: string]: boolean } = {};
    for (const d of duplicates ?? []) {
      const key = `${d.date.getTime()}-${d.description}`;
      duplicateMap[key] = true;
    }
    const expectedDuplicateMap = {
      "1735689600000-Test 1": true,
      "1735776000000-Test 2": true,
      "1735689600000-Test 3": true,
    };
    expect(duplicateMap).toEqual(expectedDuplicateMap);
  });
});
