import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, setLogCallback } from "@/utils/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setLogCallback(null);
  });

  it("logger.error calls console.error", () => {
    logger.error("test error");
    expect(console.error).toHaveBeenCalled();
  });

  it("logger.warn calls console.warn", () => {
    logger.warn("test warning");
    expect(console.warn).toHaveBeenCalled();
  });

  it("fires callback when set", () => {
    const callback = vi.fn();
    setLogCallback(callback);
    logger.error("callback test");
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        message: "callback test",
      })
    );
  });

  it("sanitizes sensitive data in callback", () => {
    const callback = vi.fn();
    setLogCallback(callback);
    logger.error("sensitive", { apikey: "secret123", name: "safe" });
    const callData = callback.mock.calls[0][0].data;
    expect(callData.apikey).toBe("[REDACTED]");
    expect(callData.name).toBe("safe");
  });
});
