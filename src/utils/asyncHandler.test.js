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
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler_1 = require("./asyncHandler");
describe("asyncHandler", () => {
    it("should call the provided function and pass the result to the response", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = {};
        const res = {
            send: jest.fn(),
        };
        const next = jest.fn();
        const mockHandler = jest.fn((req, res) => __awaiter(void 0, void 0, void 0, function* () {
            res.send({ success: true });
        }));
        const wrappedHandler = (0, asyncHandler_1.asyncHandler)(mockHandler);
        yield wrappedHandler(req, res, next);
        expect(mockHandler).toHaveBeenCalledTimes(1); // Ensure the handler is called
        expect(res.send).toHaveBeenCalledWith({ success: true }); // Ensure the response is sent
        expect(next).not.toHaveBeenCalled(); // Ensure next is not called for success
    }));
    it("should catch errors and call next with the error", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = {};
        const res = {};
        const next = jest.fn();
        const error = new Error("Test error");
        const mockHandler = jest.fn(() => __awaiter(void 0, void 0, void 0, function* () {
            throw error; // Simulate an error
        }));
        const wrappedHandler = (0, asyncHandler_1.asyncHandler)(mockHandler);
        yield wrappedHandler(req, res, next);
        expect(mockHandler).toHaveBeenCalledTimes(1); // Ensure the handler is called
        expect(next).toHaveBeenCalledTimes(1); // Ensure next is called once
        expect(next).toHaveBeenCalledWith(error); // Ensure next is called with the error
    }));
});
