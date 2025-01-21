import { Router } from "express";
import {
  getAllTransactionsController,
  addTransactionController,
  updateTransactionController,
  deleteTransactionController,
  uploadCSVController,
  getTransactionByIdController,
} from "../controllers/transaction.controller";

const router = Router();

router.get("/", getAllTransactionsController);
router.post("/", addTransactionController);
router.put("/update/:id", updateTransactionController);
router.delete("/delete/:id", deleteTransactionController);
router.post("/upload", uploadCSVController);
router.get("/:id", getTransactionByIdController);

export default router;
