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
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const transaction_routes_1 = __importDefault(require("../routes/transaction.routes"));
const transaction_controller_1 = require("../controllers/transaction.controller");
jest.mock("../controllers/transaction.controller", () => ({
    getAllTransactionsController: jest.fn((req, res) => res.status(200).json([{ id: 1, description: "Test Transaction" }])),
    getTransactionByIdController: jest.fn((req, res) => res.status(200).json({ id: 1, description: "Test Transaction" })),
    addTransactionController: jest.fn((req, res) => res.status(201).json({ id: 1, description: "Test Transaction" })),
    updateTransactionController: jest.fn((req, res) => res.status(200).json({
        message: "Transaction updated successfully",
        transaction: { id: 1, description: "Updated Transaction" },
    })),
    deleteTransactionController: jest.fn((req, res) => res.status(200).json({
        message: "Transaction marked as deleted successfully",
    })),
    deleteTransactionsController: jest.fn((req, res) => res.status(200).json({
        message: "3 transactions deleted successfully.",
        deletedTransactions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    })),
    uploadCSVController: jest.fn((req, res) => res.status(200).json({
        message: "CSV file processed successfully",
        transactions: [{ id: 1, description: "CSV Transaction" }],
        invalidRows: [],
    })),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use("/api/transactions", transaction_routes_1.default);
const upload = (0, multer_1.default)({
    dest: "uploads/", // Temporary folder to store uploaded files
    limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB size limit
    fileFilter: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        if (ext !== ".csv") {
            return cb(new Error("Only CSV files are allowed"));
        }
        cb(null, true);
    },
});
app.post("/api/upload", upload.single("file"), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, transaction_controller_1.uploadCSVController)(req, res, next);
    }
    catch (error) {
        next(error);
    }
}));
app.get("/", (_, res) => {
    res.status(200).json({ message: "Server is running!" });
});
// Add route that throws an error
app.get("/error", () => {
    throw new Error("Test internal server error");
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: `Internal server error: ${err.message}` });
});
describe("Server", () => {
    it("should return server running message", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Server is running!" });
    }));
    it("should handle CSV upload and processing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .attach("file", Buffer.from("2022-01-01,Test Transaction,100,USD"), "transactions.csv");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "CSV file processed successfully",
            transactions: [{ id: 1, description: "CSV Transaction" }],
            invalidRows: [],
        });
    }));
    it("should handle internal server errors", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/error");
        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/Internal server error/);
    }));
});
