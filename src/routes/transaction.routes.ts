import { Router } from "express";
import {
  getAllTransactionsController,
  addTransactionController,
  updateTransactionController,
  deleteTransactionController,
  deleteTransactionsController,
  uploadCSVController,
  getTransactionByIdController,
} from "../controllers/transaction.controller";

const router = Router();

router.get("/", getAllTransactionsController);
router.post("/", addTransactionController);
router.put("/update/:id", updateTransactionController);
router.delete("/delete/:id", deleteTransactionController);
router.delete("/delete-multiple", deleteTransactionsController);
router.post("/upload", uploadCSVController);
router.get("/:id", getTransactionByIdController);
export default router;
