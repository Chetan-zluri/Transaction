import { Transaction } from "../entities/Transaction";

describe("Transaction Entity", () => {
  it("should create a transaction entity", () => {
    const transaction = new Transaction();
    transaction.date = new Date("2025-01-10");
    transaction.description = "Test Transaction";
    transaction.amount = 100;
    transaction.currency = "USD";
    expect(transaction).toHaveProperty("date");
    expect(transaction).toHaveProperty("description");
    expect(transaction).toHaveProperty("amount");
    expect(transaction).toHaveProperty("currency");
  });
});
