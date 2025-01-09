import { MikroORM } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
const orm = MikroORM.init();
export const getAllTransactions = async () => {
  const em = (await orm).em;
  return em.find(
    Transaction,
    { deleted: false },
    { orderBy: { date: "DESC" } }
  );
};
export const addTransaction = async (data: Partial<Transaction>) => {
  const em = (await orm).em;
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
  const em = (await orm).em;
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
  const em = (await orm).em;
  const transaction = await em.findOne(Transaction, { id });
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  transaction.deleted = true;
  await em.flush();
  return transaction;
};
export const processCSV = async (rows: any[]) => {
  const em = (await orm).em;
  const transactions: Transaction[] = [];
  for (const row of rows) {
    const { date, description, amount, Currency } = row;
    const duplicate = await em.findOne(Transaction, { date, description });
    if (duplicate) {
      throw new Error(
        `Duplicate transaction detected: ${description} on ${date}`
      );
    }
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
  await em.persistAndFlush(transactions);
  return transactions;
};
