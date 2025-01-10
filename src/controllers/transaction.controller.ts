import { Request, Response, NextFunction } from "express";
import csvParser from "csv-parser";
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
    res.status(200).json(transaction);
  }
);

export const deleteTransactionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
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

    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          const { transactions, invalidRows } = await processCSV(rows);
          fs.unlinkSync(filePath); // Clean up uploaded file
          res.status(200).json({
            message: "CSV file processed successfully",
            transactions,
            invalidRows, // Include invalid rows for reference (optional)
          });
        } catch (error) {
          fs.unlinkSync(filePath); // Ensure cleanup in case of error
          res.status(500).json({
            message: `Error processing transactions: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
      })
      .on("error", (error) => {
        fs.unlinkSync(filePath); // Ensure cleanup in case of error
        res.status(500).json({ message: "Error processing CSV file", error });
      });
  }
);
