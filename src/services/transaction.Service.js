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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCSV = exports.deleteTrans = exports.deleteTransaction = exports.updateTransaction = exports.addTransaction = exports.getTransactionById = exports.getAllTransactions = void 0;
const postgresql_1 = require("@mikro-orm/postgresql");
const Transaction_1 = require("../entities/Transaction");
const mikro_orm_config_1 = __importDefault(require("../mikro-orm.config"));
const date_fns_1 = require("date-fns");
const getAllTransactions = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10) {
    const orm = yield postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = orm.em.fork();
    const offset = (page - 1) * limit;
    const transactions = yield em.find(Transaction_1.Transaction, { deleted: false }, { orderBy: { date: "DESC" }, limit, offset });
    const totalCount = yield em.count(Transaction_1.Transaction, { deleted: false });
    return { transactions, totalCount };
});
exports.getAllTransactions = getAllTransactions;
const getTransactionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const orm = yield postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = orm.em.fork();
    const transaction = yield em.findOne(Transaction_1.Transaction, { id });
    if (!transaction) {
        throw new Error(`Transaction with ID ${id} not found`);
    }
    return transaction;
});
exports.getTransactionById = getTransactionById;
const addTransaction = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const orm = yield postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = orm.em.fork();
    if (!data.date || !data.description || !data.amount || !data.Currency) {
        throw new Error("All fields (date, description, amount, Currency) are required.");
    }
    if (data.deleted) {
        throw new Error("'deleted' field is not allowed.");
    }
    const duplicate = yield em.findOne(Transaction_1.Transaction, {
        date: data.date,
        description: data.description,
        deleted: false,
    });
    if (duplicate) {
        throw new Error("Transaction already exists");
    }
    const transaction = em.create(Transaction_1.Transaction, {
        date: new Date(data.date),
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        Currency: data.Currency,
        deleted: false,
    });
    yield em.persistAndFlush(transaction);
    return transaction;
});
exports.addTransaction = addTransaction;
const updateTransaction = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const orm = postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = (yield orm).em.fork();
    const transaction = yield em.findOne(Transaction_1.Transaction, { id, deleted: false });
    if (!transaction || transaction.deleted) {
        throw new Error("Transaction not found or is deleted");
    }
    if (data.amount !== undefined && data.amount <= 0) {
        throw new Error("Amount must be greater than zero");
    }
    // Check if the data being updated is identical to an existing transaction
    const duplicate = yield em.findOne(Transaction_1.Transaction, {
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
    yield em.persistAndFlush(transaction);
    return transaction;
});
exports.updateTransaction = updateTransaction;
const deleteTransaction = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const orm = postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = (yield orm).em.fork();
    const transaction = yield em.findOne(Transaction_1.Transaction, { id });
    if (!transaction) {
        throw new Error("Transaction not found");
    }
    transaction.deleted = true;
    yield em.flush();
    return transaction;
});
exports.deleteTransaction = deleteTransaction;
const deleteTrans = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    const orm = yield postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = orm.em.fork();
    const transactions = yield em.find(Transaction_1.Transaction, { id: { $in: ids } });
    if (transactions.length === 0) {
        throw new Error("No transactions found with the provided IDs.");
    }
    transactions.forEach((transaction) => {
        transaction.deleted = true;
    });
    yield em.flush();
    return transactions;
});
exports.deleteTrans = deleteTrans;
const BATCH_SIZE = 100;
const processCSV = (rows) => __awaiter(void 0, void 0, void 0, function* () {
    const orm = yield postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    const em = orm.em.fork();
    const transactions = [];
    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    let hasNewTransactions = false;
    // Step 1: Filter and validate rows
    for (const row of rows) {
        const [date, description, amount, Currency] = row;
        const parsedDate = date.split("-").reverse().join("-");
        const dateObject = new Date(parsedDate);
        if (!date ||
            !(0, date_fns_1.isValid)(dateObject) ||
            !description ||
            !amount ||
            isNaN(parseFloat(amount)) ||
            parseFloat(amount) <= 0 ||
            !Currency) {
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
    const duplicates = yield em.find(Transaction_1.Transaction, {
        $or: validRows.map((row) => ({
            date: row.dateObject,
            description: row.description,
            deleted: false,
        })),
    });
    const duplicateMap = {};
    for (const d of duplicates !== null && duplicates !== void 0 ? duplicates : []) {
        const key = `${d.date.getTime()}-${d.description}`;
        duplicateMap[key] = true;
    }
    const batchDuplicateMap = {};
    // Step 3: Create transactions for non-duplicate rows
    for (const row of validRows) {
        const key = `${row.dateObject.getTime()}-${row.description}`;
        if (duplicateMap[key] || batchDuplicateMap[key]) {
            duplicateRows.push(row);
            continue;
        }
        batchDuplicateMap[key] = true;
        hasNewTransactions = true;
        transactions.push(em.create(Transaction_1.Transaction, {
            date: row.dateObject,
            description: row.description,
            amount: row.amount,
            Currency: row.Currency,
            deleted: false,
        }));
        if (transactions.length >= BATCH_SIZE) {
            yield em.persistAndFlush(transactions);
            transactions.length = 0;
        }
    }
    if (!hasNewTransactions) {
        throw new Error("Transactions are already Updated.");
    }
    if (transactions.length > 0) {
        yield em.persistAndFlush(transactions);
    }
    return {
        message: "CSV file processed successfully",
        transactions,
        invalidRows,
        duplicateRows,
    };
});
exports.processCSV = processCSV;
