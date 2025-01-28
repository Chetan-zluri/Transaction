import { MikroORM } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
import config from "../mikro-orm.config";
import { isValid } from "date-fns";
export const getAllTransactions = async (
  page: number = 1,
  limit: number = 10
) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
  const offset = (page - 1) * limit;
  const transactions = await em.find(
    Transaction,
    { deleted: false },
    { orderBy: { date: "DESC" }, limit, offset }
  );
  const totalCount = await em.count(Transaction, { deleted: false });
  return { transactions, totalCount };
};
export const getTransactionById = async (id: number) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
  const transaction = await em.findOne(Transaction, { id });
  if (!transaction) {
    throw new Error(`Transaction with ID ${id} not found`);
  }
  return transaction;
};
export const addTransaction = async (data: Partial<Transaction>) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
  if (!data.date || !data.description || !data.amount || !data.Currency) {
    throw new Error(
      "All fields (date, description, amount, Currency) are required."
    );
  }
  if (data.deleted) {
    throw new Error("'deleted' field is not allowed.");
  }
  const duplicate = await em.findOne(Transaction, {
    date: data.date,
    description: data.description,
    deleted: false,
  });
  if (duplicate) {
    throw new Error("Transaction already exists");
  }
  const transaction = em.create(Transaction, {
    date: new Date(data.date),
    description: data.description,
    amount: parseFloat(data.amount.toString()),
    Currency: data.Currency,
    deleted: false,
  });
  await em.persistAndFlush(transaction);
  return transaction;
};
export const updateTransaction = async (
  id: number,
  data: Partial<Transaction>
) => {
  const orm = MikroORM.init(config);
  const em = (await orm).em.fork();
  const transaction = await em.findOne(Transaction, { id, deleted: false });
  if (!transaction || transaction.deleted) {
    throw new Error("Transaction not found or is deleted");
  }
  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  // Check if the data being updated is identical to an existing transaction
  const duplicate = await em.findOne(Transaction, {
    date: data.date || transaction.date,
    description: data.description || transaction.description,
    deleted: false,
  });

  // If a duplicate transaction exists, return an error
  if (duplicate && duplicate.id !== transaction.id) {
    throw new Error("Transaction already exists with the same data");
  }

  // Proceed with the update only if no duplicates are found
  transaction.date = data.date || transaction.date;
  transaction.description = data.description || transaction.description;
  transaction.amount = data.amount || transaction.amount;
  transaction.Currency = data.Currency || transaction.Currency;
  await em.persistAndFlush(transaction);
  return transaction;
};
export const deleteTransaction = async (id: number) => {
  const orm = MikroORM.init(config);
  const em = (await orm).em.fork();
  const transaction = await em.findOne(Transaction, { id });
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  transaction.deleted = true;
  await em.flush();
  return transaction;
};

export const deleteTrans = async (ids: number[]) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
  const transactions = await em.find(Transaction, { id: { $in: ids } });
  if (transactions.length === 0) {
    throw new Error("No transactions found with the provided IDs.");
  }
  transactions.forEach((transaction) => {
    transaction.deleted = true;
  });
  await em.flush();
  return transactions;
};

const BATCH_SIZE = 100;
export const processCSV = async (rows: any[]) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
  const transactions: Transaction[] = [];
  const validRows: any[] = [];
  const invalidRows: any[] = [];
  const duplicateRows: any[] = [];
  let hasNewTransactions = false;

  // Step 1: Filter and validate rows
  for (const row of rows) {
    const [date, description, amount, Currency] = row;
    const parsedDate = date.split("-").reverse().join("-");
    const dateObject = new Date(parsedDate);

    if (
      !date ||
      !isValid(dateObject) ||
      !description ||
      !amount ||
      isNaN(parseFloat(amount)) ||
      parseFloat(amount) <= 0 ||
      !Currency
    ) {
      invalidRows.push(row);
      continue;
    }
    validRows.push({
      dateObject,
      description,
      amount: parseFloat(amount),
      Currency,
    });
  }

  // Step 2: Batch check for duplicates
  const duplicates = await em.find(Transaction, {
    $or: validRows.map((row) => ({
      date: row.dateObject,
      description: row.description,
      deleted: false,
    })),
  });

  const duplicateMap: { [key: string]: boolean } = {};
  for (const d of duplicates ?? []) {
    const key = `${d.date.getTime()}-${d.description}`;
    duplicateMap[key] = true;
  }

  const batchDuplicateMap: { [key: string]: boolean } = {};

  // Step 3: Create transactions for non-duplicate rows
  for (const row of validRows) {
    const key = `${row.dateObject.getTime()}-${row.description}`;
    if (duplicateMap[key] || batchDuplicateMap[key]) {
      duplicateRows.push(row);
      continue;
    }
    batchDuplicateMap[key] = true;
    hasNewTransactions = true;

    transactions.push(
      em.create(Transaction, {
        date: row.dateObject,
        description: row.description,
        amount: row.amount,
        Currency: row.Currency,
        deleted: false,
      })
    );

    if (transactions.length >= BATCH_SIZE) {
      await em.persistAndFlush(transactions);
      transactions.length = 0;
    }
  }

  if (!hasNewTransactions) {
    throw new Error("Transactions are already Updated.");
  }

  if (transactions.length > 0) {
    await em.persistAndFlush(transactions);
  }
  console.log("duplicateRows", duplicateRows);
  return {
    message: "CSV file processed successfully",
    transactions,
    invalidRows,
    duplicateRows,
  };
};
