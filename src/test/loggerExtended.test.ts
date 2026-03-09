import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, setLogCallback } from "@/utils/logger";

describe("logger extended", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setLogCallback(null);
  });

  it("logger.info calls console.log", () => {
    logger.info("test info");
    expect(console.log).toHaveBeenCalled();
  });

  it("logger.debug calls console.log", () => {
    logger.debug("test debug");
    expect(console.log).toHaveBeenCalled();
  });

  it("logger.avm uses [AVM] prefix", () => {
    logger.avm("valuation test");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[AVM]"),
      undefined
    );
  });

  it("logger.db uses [DB] prefix", () => {
    logger.db("query test");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[DB]"),
      undefined
    );
  });

  it("logger.request includes requestId", () => {
    logger.request("req-123", "fetching data");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("req-123"),
      undefined
    );
  });

  it("sanitizes nested sensitive data", () => {
    const callback = vi.fn();
    setLogCallback(callback);
    logger.error("nested", { config: { authorization: "Bearer xyz", name: "ok" } });
    const nested = callback.mock.calls[0][0].data.config;
    expect(nested.authorization).toBe("[REDACTED]");
    expect(nested.name).toBe("ok");
  });

  it("sanitizes token keys", () => {
    const callback = vi.fn();
    setLogCallback(callback);
    logger.error("tokens", { accessToken: "abc", password: "123", user: "safe" });
    const data = callback.mock.calls[0][0].data;
    expect(data.accessToken).toBe("[REDACTED]");
    expect(data.password).toBe("[REDACTED]");
    expect(data.user).toBe("safe");
  });
});
