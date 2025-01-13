import { Request, Response, NextFunction } from "express";
import csvParser from "csv-parser";
import Papa, { ParseError } from "papaparse";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  processCSV,
} from "../services/transaction.Service";

export const getAllTransactionsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const transactions = await getAllTransactions();
    res.status(200).json(transactions);
  }
);

export const addTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date, description, amount, Currency } = req.body;
    const transaction = await addTransaction({
      date,
      description,
      amount,
      Currency,
    });
    res.status(201).json(transaction);
  }
);

export const updateTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
      .json({ message: "Transction updated Succesfully", transaction });
  }
);

export const deleteTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const transaction = await deleteTransaction(Number(id));
    res
      .status(200)
      .json({ message: "Transaction marked as deleted successfully" });
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

      const rows: any[] = [];
      Papa.parse<string>(fileContent, {
        header: false, // Adjust to true if the CSV has a header
        skipEmptyLines: true,
        beforeFirstChunk: (chunk: string) => {
          // Remove BOM if it exists
          if (chunk.charCodeAt(0) === 0xfeff) {
            chunk = chunk.slice(1);
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

      const { transactions, invalidRows } = await processCSV(rows);

      // Clean up the uploaded file after processing
      fs.unlinkSync(filePath);

      res.status(200).json({
        message: "CSV file processed successfully",
        transactions,
        invalidRows,
      });
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Ensure the file is deleted even on error
      }

      res.status(500).json({
        message: `Error processing transactions: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }
);
