import { MikroORM } from "@mikro-orm/postgresql";
import { Transaction } from "../entities/Transaction";
import config from "../mikro-orm.config";
import { isValid } from "date-fns";
export const getAllTransactions = async (
  page: number = 1,
  limit: number = 50
) => {
  const orm = MikroORM.init(config);
  const em = (await orm).em.fork();
  const offset = (page - 1) * limit;
  return em.find(
    Transaction,
    { deleted: false },
    { orderBy: { date: "DESC" }, limit, offset }
  );
};
export const addTransaction = async (data: Partial<Transaction>) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
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
  if (!transaction || transaction.deleted) {
    throw new Error("Transaction not found or is deleted");
  }

  // Check if the data being updated is identical to an existing transaction
  const duplicate = await em.findOne(Transaction, {
    date: data.date || transaction.date,
    description: data.description || transaction.description,
    amount: data.amount || transaction.amount,
    Currency: data.Currency || transaction.Currency,
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
// export const deleteRowsService = async (): Promise<void> => {
//   const orm = await MikroORM.init(config);
//   const em = orm.em.fork();
//   console.log("print re");
//   await em.nativeDelete(Transaction, {});
// };
const BATCH_SIZE = 100;
export const processCSV = async (rows: any[]) => {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();
  const transactions: Transaction[] = [];
  const invalidRows: any[] = []; // Array to store invalid rows

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
      !Currency
    ) {
      invalidRows.push(row); // Add invalid row to the array
      continue;
    }
    const duplicate = await em.findOne(Transaction, {
      date: dateObject,
      description,
    });
    if (duplicate) {
      invalidRows.push(row); // Add duplicate row to the array
      continue;
    }

    transactions.push(
      em.create(Transaction, {
        date: dateObject,
        description,
        amount: parseFloat(amount),
        Currency,
        deleted: false,
      })
    );
    if (transactions.length >= BATCH_SIZE) {
      await em.persistAndFlush(transactions);
      transactions.length = 0; // Clear the batch
    }
  }
  if (transactions.length > 0) {
    await em.persistAndFlush(transactions);
  }
  return transactions; // Only return transactions
};
