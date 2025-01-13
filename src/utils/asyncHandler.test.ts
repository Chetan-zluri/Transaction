import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "./asyncHandler";

describe("asyncHandler", () => {
  it("should call the provided function and pass the result to the response", async () => {
    const req = {} as Request;
    const res = {
      send: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    const mockHandler = jest.fn(async (req: Request, res: Response) => {
      res.send({ success: true });
    });

    const wrappedHandler = asyncHandler(mockHandler);

    await wrappedHandler(req, res, next);

    expect(mockHandler).toHaveBeenCalledTimes(1); // Ensure the handler is called
    expect(res.send).toHaveBeenCalledWith({ success: true }); // Ensure the response is sent
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called for success
  });

  it("should catch errors and call next with the error", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();
    const error = new Error("Test error");

    const mockHandler = jest.fn(async () => {
      throw error; // Simulate an error
    });

    const wrappedHandler = asyncHandler(mockHandler);

    await wrappedHandler(req, res, next);

    expect(mockHandler).toHaveBeenCalledTimes(1); // Ensure the handler is called
    expect(next).toHaveBeenCalledTimes(1); // Ensure next is called once
    expect(next).toHaveBeenCalledWith(error); // Ensure next is called with the error
  });
});
