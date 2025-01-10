import { MikroORM } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
import config from "../mikro-orm.config";
import papa from "papaparse";
export const getAllTransactions = async () => {
  const orm = MikroORM.init(config);
  const em = (await orm).em.fork();
  return em.find(
    Transaction,
    { deleted: false },
    { orderBy: { date: "DESC" } }
  );
};
export const addTransaction = async (data: Partial<Transaction>) => {
  const orm = MikroORM.init(config);
  const em = (await orm).em.fork();
  if (!data.date || !data.description || !data.amount || !data.Currency) {
    throw new Error(
      "All fields (date, description, amount, Currency) are required."
    );
  }
  const duplicate = await em.findOne(Transaction, {
    date: data.date,
    description: data.description,
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
  if (!transaction) {
    throw new Error("Transaction not found or is deleted");
  }
  const duplicate = await em.findOne(Transaction, {
    date: data.date,
    description: data.description,
  });
  if (duplicate && duplicate.id !== transaction.id) {
    throw new Error("Transaction already exists");
  }
  transaction.date = data.date || transaction.date;
  transaction.description = data.description || transaction.description;
  transaction.amount = data.amount || transaction.amount;
  transaction.Currency = data.Currency || transaction.Currency;
  await em.flush();
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

export const processCSV = async (rows: any[]) => {
  const orm = MikroORM.init(config);
  const em = (await orm).em.fork();
  const transactions: Transaction[] = [];
  const invalidRows: any[] = [];

  for (const row of rows) {
    const { date, description, amount, Currency } = row;

    // Validate row data
    if (
      !date ||
      isNaN(Date.parse(date)) ||
      !description ||
      !amount ||
      isNaN(parseFloat(amount)) ||
      !Currency
    ) {
      invalidRows.push(row); // Log invalid rows for debugging/reporting
      continue; // Skip invalid rows
    }

    // Check for duplicates
    const duplicate = await em.findOne(Transaction, { date, description });
    if (duplicate) {
      invalidRows.push(row); // Log duplicates as invalid
      continue;
    }

    // Create valid transaction
    transactions.push(
      em.create(Transaction, {
        date: new Date(date),
        description,
        amount: parseFloat(amount),
        Currency,
        deleted: false,
      })
    );
  }

  // Save valid transactions to the database
  await em.persistAndFlush(transactions);

  // Return results and invalid rows for reference
  return { transactions, invalidRows };
};
