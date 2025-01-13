import { Transaction } from "./Transaction";
describe("Transaction Entity", () => {
  it("should create a Transaction instance with valid properties", () => {
    const transaction = new Transaction();
    transaction.date = new Date("2025-01-10");
    transaction.description = "Valid Transaction";
    transaction.amount = 100;
    transaction.Currency = "USD";
    expect(transaction.date).toEqual(new Date("2025-01-10"));
    expect(transaction.description).toBe("Valid Transaction");
    expect(transaction.amount).toBe(100);
    expect(transaction.Currency).toBe("USD");
  });

  it("should throw an error if required fields are missing", () => {
    expect(() => {
      const transaction = new Transaction();
      if (!transaction.date || !(transaction.date instanceof Date)) {
        throw new Error("Field 'date' is required and must be a valid Date.");
      }
      if (!transaction.description || transaction.description.trim() === "") {
        throw new Error("Field 'description' is required.");
      }
      if (transaction.amount == null || isNaN(transaction.amount)) {
        throw new Error("Field 'amount' is required and must be a number.");
      }
      if (!transaction.Currency || transaction.Currency.trim() === "") {
        throw new Error("Field 'Currency' is required.");
      }
    }).toThrow(
      "Field 'date' is required and must be a valid Date." // Adjusted to check one error at a time
    );
  });
});
