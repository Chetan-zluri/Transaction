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
exports.uploadCSVController = exports.deleteTransactionController = exports.deleteTransactionsController = exports.updateTransactionController = exports.addTransactionController = exports.getTransactionByIdController = exports.getAllTransactionsController = void 0;
const papaparse_1 = __importDefault(require("papaparse"));
const fs_1 = __importDefault(require("fs"));
const asyncHandler_1 = require("../utils/asyncHandler");
const transaction_Service_1 = require("../services/transaction.Service");
exports.getAllTransactionsController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.page
            ? parseInt(req.query.limit, 10)
            : 10;
        if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
            return res.status(400).json({ error: "Invalid Query parameters" });
        }
        const { transactions, totalCount } = yield (0, transaction_Service_1.getAllTransactions)(page, limit);
        const totalPages = Math.ceil(totalCount / limit);
        res.status(200).json({ transactions, totalPages, totalCount });
    }
    catch (error) {
        res.status(500).json({ message: "Database error" });
    }
}));
exports.getTransactionByIdController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const transaction = yield (0, transaction_Service_1.getTransactionById)(Number(id));
        res.status(200).json(transaction);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === `Transaction with ID ${id} not found`) {
                res.status(404).json({ message: error.message });
            }
            else {
                res.status(500).json({ message: error.message });
            }
        }
        else {
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
}));
exports.addTransactionController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, description, amount, Currency, deleted } = req.body;
        if (!date || !description || !amount || !Currency) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (deleted !== undefined) {
            return res
                .status(400)
                .json({ message: "'deleted' field is not allowed." });
        }
        const transaction = yield (0, transaction_Service_1.addTransaction)({
            date,
            description,
            amount,
            Currency,
        });
        res.status(201).json(transaction);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "Transaction already exists") {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: "Error adding transaction" });
        }
    }
}));
exports.updateTransactionController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { date, description, amount, Currency } = req.body;
        const transaction = yield (0, transaction_Service_1.updateTransaction)(Number(id), {
            date,
            description,
            amount,
            Currency,
        });
        res
            .status(200)
            .json({ message: "Transaction updated successfully", transaction });
    }
    catch (error) {
        if (error.message === "Transaction not found or is deleted") {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (error.message === "Transaction already exists with the same data") {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === "Amount must be greater than zero") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error updating transaction" });
    }
}));
exports.deleteTransactionsController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body; // Get the array of IDs from the request body
    if (!Array.isArray(ids) || ids.length === 0) {
        return res
            .status(400)
            .json({ message: "Invalid input: Array of IDs is required." });
    }
    try {
        const deletedTransactions = yield (0, transaction_Service_1.deleteTrans)(ids);
        res.status(200).json({
            message: `${deletedTransactions.length} transactions deleted successfully.`,
            deletedTransactions,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "An error occurred while deleting transactions." });
    }
}));
exports.deleteTransactionController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid id" });
        }
        const transaction = yield (0, transaction_Service_1.deleteTransaction)(Number(id));
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res
            .status(200)
            .json({ message: "Transaction marked as deleted successfully" });
    }
    catch (error) {
        if (error.message === "Transaction not found") {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.status(500).json({ message: "Error deleting transaction" });
    }
}));
exports.uploadCSVController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const filePath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    if (!filePath) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    try {
        const fileContent = fs_1.default.readFileSync(filePath, "utf8");
        if (!fileContent) {
            fs_1.default.unlinkSync(filePath);
            return res.status(400).json({ message: "The file is empty" });
        }
        const rows = [];
        papaparse_1.default.parse(fileContent, {
            header: false, // Adjust to true if the CSV has a header
            skipEmptyLines: true,
            beforeFirstChunk: (chunk) => {
                if (chunk.charAt(0) === "\uFEFF") {
                    chunk = chunk.slice(1); // Remove BOM
                }
                return chunk;
            },
            complete: (result) => {
                rows.push(...result.data);
            },
            error: (error) => {
                throw new Error(`Error parsing CSV file: ${error.message}`);
            },
        });
        const { message, transactions, invalidRows, duplicateRows } = yield (0, transaction_Service_1.processCSV)(rows); // Only transactions are returned
        // Clean up the uploaded file after processing
        fs_1.default.unlinkSync(filePath);
        res.status(200).json({
            message,
            transactions, // Only transactions are included in the response
            invalidRows, // Include invalid rows in the response
        });
    }
    catch (error) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath); // Ensure the file is deleted even on error
        }
        console.error("Error processing CSV file:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "An unexpected error occurred during CSV processing";
        if (errorMessage === "Transactions are already Updated.") {
            return res.status(400).json({
                message: errorMessage,
            });
        }
        res.status(500).json({
            message: errorMessage,
        });
    }
}));
