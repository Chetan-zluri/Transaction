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
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const transaction_controller_1 = require("./controllers/transaction.controller");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    // app.use("/api/transactions", transactionRoutes);
    // const upload = multer({
    //   dest: "uploads/", // Temporary folder to store uploaded files
    //   limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB size limit
    //   fileFilter: (req, file, cb) => {
    //     const ext = path.extname(file.originalname);
    //     if (ext !== ".csv") {
    //       return cb(new Error("Only CSV files are allowed"));
    //     }
    //     cb(null, true);
    //   },
    // });
    // app.use(upload.single("file"));
    app.post("/api/upload", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    // app.get("/error", () => {
    //   throw new Error("Test internal server error");
    // });
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ message: `Internal server error: ${err.message}` });
    });
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    return app;
});
const appfinal = main().catch((err) => {
    console.error(err);
    process.exit(1);
});
exports.default = appfinal;
