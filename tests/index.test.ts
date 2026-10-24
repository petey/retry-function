// Copyright 2015 Yahoo Inc.
// Licensed under the MIT license.
// See the included LICENSE file for terms.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { retryFn, type AnyFunction } from "../src/index.ts";

describe("retry-function test case", () => {
  let myFunc: ReturnType<typeof vi.fn<AnyFunction>>;

  beforeEach(() => {
    myFunc = vi.fn<AnyFunction>();
  });

  describe("retryFn", () => {
    it("should not retry if first run successful", async () => {
      myFunc.mockImplementation((callback) => callback(null));

      const callback = vi.fn<AnyFunction>();
      retryFn({ method: myFunc }, callback);

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledWith(null);
        expect(myFunc).toHaveBeenCalledOnce();
      });
    });

    it("should retry fn until success", async () => {
      myFunc.mockImplementation((callback) => callback(new Error("nope")));
      myFunc.mockImplementationOnce((callback) => callback(new Error("nope")));
      myFunc.mockImplementationOnce((callback) => callback(new Error("nope")));
      myFunc.mockImplementationOnce((callback) => callback(null));

      const callback = vi.fn<AnyFunction>();
      retryFn(
        {
          method: myFunc,
          options: {
            minTimeout: 10,
            retries: 5,
          },
        },
        callback,
      );

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledWith(null);
        expect(myFunc).toHaveBeenCalledTimes(3);
      });
    });

    it("should have error if never succeeds", async () => {
      myFunc.mockImplementation((callback) => callback(new Error("nope")));

      const callback = vi.fn<AnyFunction>();
      retryFn(
        {
          method: myFunc,
          options: {
            minTimeout: 10,
            retries: 2,
          },
        },
        callback,
      );

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: "nope" }));
        expect(myFunc).toHaveBeenCalledTimes(3);
      });
    });

    it("should not continue if shouldRetry says not to", async () => {
      myFunc.mockImplementation((callback) => callback(new Error("nope")));
      myFunc.mockImplementationOnce((callback) => callback(new Error("nope")));
      myFunc.mockImplementationOnce((callback) => callback(new Error("nope")));
      myFunc.mockImplementationOnce((callback) => callback(new Error("yep")));

      const callback = vi.fn<AnyFunction>();
      retryFn(
        {
          method: myFunc,
          shouldRetry: (err) => err.message === "nope",
          options: {
            minTimeout: 10,
            retries: 5,
          },
        },
        callback,
      );

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: "yep" }));
        expect(myFunc).toHaveBeenCalledTimes(3);
      });
    });

    it("should fail if validation fails", () => {
      expect(() => retryFn({} as never, vi.fn())).toThrow();
    });

    it("should fail if callback missing", () => {
      expect(() => retryFn({ method: vi.fn() } as never, undefined as never)).toThrow(
        '"callback" must be a function',
      );
    });
  });
});
