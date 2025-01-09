import { Router } from "express";
import {
  getAllTransactionsController,
  addTransactionController,
  updateTransactionController,
  deleteTransactionController,
  uploadCSVController,
} from "../controllers/transaction.controller";

const router = Router();

router.get("/", getAllTransactionsController);
router.post("/", addTransactionController);
router.put("/:id", updateTransactionController);
router.delete("/:id", deleteTransactionController);
router.post("/upload", uploadCSVController);

export default router;
