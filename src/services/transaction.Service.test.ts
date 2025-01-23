import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
import {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  deleteTrans,
  processCSV,
  getTransactionById,
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
      count: jest.fn(),
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
    const totalCount = 1;

    (emMock.find as jest.Mock).mockResolvedValue(mockTransactions);
    (emMock.count as jest.Mock).mockResolvedValue(totalCount);

    const page = 1;
    const limit = 50;
    const result = await getAllTransactions(page, limit);

    expect(result).toEqual({ transactions: mockTransactions, totalCount });
    expect(emMock.find).toHaveBeenCalledWith(
      Transaction,
      { deleted: false },
      {
        orderBy: { date: "DESC" },
        limit,
        offset: 0,
      }
    );
    expect(emMock.count).toHaveBeenCalledWith(Transaction, { deleted: false });
  });

  it("should handle errors gracefully", async () => {
    (emMock.find as jest.Mock).mockRejectedValue(new Error("Database error"));
    const page = 1;
    const limit = 50;
    await expect(getAllTransactions(page, limit)).rejects.toThrow(
      "Database error"
    );
  });
  //GETSINGLE TRANSACTION
  it("should return the transaction when found", async () => {
    const transaction = {
      id: 1,
      date: new Date("2025-01-01T00:00:00Z"),
      description: "Test Transaction",
      amount: 100,
      Currency: "USD",
      deleted: false,
    };

    (emMock.findOne as jest.Mock).mockResolvedValue(transaction);

    const result = await getTransactionById(1);

    expect(result).toEqual(transaction);
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, { id: 1 });
  });

  it("should throw an error when the transaction is not found", async () => {
    (emMock.findOne as jest.Mock).mockResolvedValue(null);

    await expect(getTransactionById(1)).rejects.toThrow(
      "Transaction with ID 1 not found"
    );
    expect(emMock.findOne).toHaveBeenCalledWith(Transaction, { id: 1 });
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

  //DELETE TRANSACTIONS

  it("should soft delete the specified transactions", async () => {
    const ids = [1, 2, 3];
    const transactions = ids.map((id) => ({ id, deleted: false }));
    (emMock.find as jest.Mock).mockResolvedValue(transactions);
    const result = await deleteTrans(ids);
    expect(emMock.find).toHaveBeenCalledWith(Transaction, { id: { $in: ids } });
    transactions.forEach((transaction) => {
      expect(transaction.deleted).toBe(true);
    });
    expect(emMock.flush).toHaveBeenCalled();
    expect(result).toEqual(transactions);
  });

  it("should throw an error if no transactions are found", async () => {
    const ids = [1, 2, 3];
    (emMock.find as jest.Mock).mockResolvedValue([]);
    await expect(deleteTrans(ids)).rejects.toThrow(
      "No transactions found with the provided IDs."
    );
    expect(emMock.find).toHaveBeenCalledWith(Transaction, { id: { $in: ids } });
    expect(emMock.flush).not.toHaveBeenCalled();
  });

  //PROCESSCSV
  it("should process a CSV file", async () => {
    (emMock.find as jest.Mock).mockResolvedValue([]);
    (emMock.create as jest.Mock).mockReturnValue({
      id: 1,
      description: "CSV Transaction",
      date: new Date("2022-01-01"),
      amount: 100,
      Currency: "USD",
      deleted: false,
    });
    (emMock.persistAndFlush as jest.Mock).mockResolvedValue(null);

    const rows = [["2022-01-01", "CSV Transaction", "100", "USD"]];
    const { message, transactions, invalidRows, duplicateRows } =
      await processCSV(rows);

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
  });

  it("should process valid rows and handle duplicates", async () => {
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

    (emMock.find as jest.Mock).mockResolvedValue(mockDuplicates);
    (emMock.create as jest.Mock).mockImplementation((entity, data) => data);

    const result = await processCSV(rows);

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
  });

  it("should throw an error if Transactions are already Updated", async () => {
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

    (emMock.find as jest.Mock).mockResolvedValue(mockDuplicates);

    await expect(processCSV(rows)).rejects.toThrow(
      "Transactions are already Updated."
    );
  });

  it("should handle batch processing with BATCH_SIZE", async () => {
    const rows = Array.from({ length: 105 }, (_, i) => [
      "22-01-2025",
      `Description ${i}`,
      "100",
      "USD",
    ]);

    const mockDuplicates: Transaction[] = [];

    (emMock.find as jest.Mock).mockResolvedValue(mockDuplicates);
    (emMock.create as jest.Mock).mockImplementation((entity, data) => data);

    await processCSV(rows);

    expect(emMock.persistAndFlush).toHaveBeenCalledTimes(2);
    expect(emMock.persistAndFlush).toHaveBeenNthCalledWith(
      1,
      expect.any(Array)
    );
    expect(emMock.persistAndFlush).toHaveBeenNthCalledWith(
      2,
      expect.any(Array)
    );
  });
});
