import { Request, Response, NextFunction } from "express";
import Papa from "papaparse";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  deleteTrans,
  processCSV,
  getTransactionById,
} from "../services/transaction.Service";

export const getAllTransactionsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.page
        ? parseInt(req.query.limit as string, 10)
        : 10;
      if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
        return res.status(400).json({ error: "Invalid Query parameters" });
      }
      const { transactions, totalCount } = await getAllTransactions(
        page,
        limit
      );
      const totalPages = Math.ceil(totalCount / limit);
      res.status(200).json({ transactions, totalPages, totalCount });
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  }
);

export const getTransactionByIdController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const transaction = await getTransactionById(Number(id));
      res.status(200).json(transaction);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === `Transaction with ID ${id} not found`) {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  }
);

export const addTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
      const transaction = await addTransaction({
        date,
        description,
        amount,
        Currency,
      });
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Transaction already exists") {
          return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: "Error adding transaction" });
      }
    }
  }
);

export const updateTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { date, description, amount, Currency } = req.body;
      const transaction = await updateTransaction(Number(id), {
        date,
        description,
        amount,
        Currency,
      });
      res
        .status(200)
        .json({ message: "Transaction updated successfully", transaction });
    } catch (error: any) {
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
  }
);

export const deleteTransactionsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ids } = req.body; // Get the array of IDs from the request body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid input: Array of IDs is required." });
    }
    try {
      const deletedTransactions = await deleteTrans(ids);
      res.status(200).json({
        message: `${deletedTransactions.length} transactions deleted successfully.`,
        deletedTransactions,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "An error occurred while deleting transactions." });
    }
  }
);

export const deleteTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const transaction = await deleteTransaction(Number(id));
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res
        .status(200)
        .json({ message: "Transaction marked as deleted successfully" });
    } catch (error: any) {
      if (error.message === "Transaction not found") {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(500).json({ message: "Error deleting transaction" });
    }
  }
);

export const uploadCSVController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");

      if (!fileContent) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "The file is empty" });
      }

      const rows: any[] = [];
      Papa.parse<string>(fileContent, {
        header: false, // Adjust to true if the CSV has a header
        skipEmptyLines: true,
        beforeFirstChunk: (chunk: string) => {
          if (chunk.charAt(0) === "\uFEFF") {
            chunk = chunk.slice(1); // Remove BOM
          }
          return chunk;
        },
        complete: (result) => {
          rows.push(...result.data);
        },
        error: (error: Error) => {
          throw new Error(`Error parsing CSV file: ${error.message}`);
        },
      });

      const { message, transactions, invalidRows, duplicateRows } =
        await processCSV(rows); // Only transactions are returned

      // Clean up the uploaded file after processing
      fs.unlinkSync(filePath);

      res.status(200).json({
        message,
        transactions, // Only transactions are included in the response
        invalidRows,
        duplicateRows, // Include invalid rows in the response
      });
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Ensure the file is deleted even on error
      }
      console.error("Error processing CSV file:", error);
      const errorMessage =
        error instanceof Error
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
  }
);
