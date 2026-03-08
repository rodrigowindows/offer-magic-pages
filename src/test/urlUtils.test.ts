import { describe, it, expect } from "vitest";
import {
  generatePropertySlug,
  generatePropertyUrl,
  generateDirectPropertyUrlBySlug,
  generateTrackedPropertyUrlBySlug,
} from "@/utils/urlUtils";

describe("generatePropertySlug", () => {
  it("converts address to URL-friendly slug", () => {
    expect(generatePropertySlug({ address: "123 Main St" })).toBe("123-main-st");
  });

  it("removes special characters", () => {
    expect(generatePropertySlug({ address: "456 Oak Ave #2B" })).toBe("456-oak-ave-2b");
  });

  it("handles multiple spaces", () => {
    expect(generatePropertySlug({ address: "789  Elm   Rd" })).toBe("789-elm-rd");
  });

  it("lowercases everything", () => {
    expect(generatePropertySlug({ address: "100 BROADWAY" })).toBe("100-broadway");
  });
});

describe("generatePropertyUrl", () => {
  const prop = { id: "abc", address: "123 Main St", city: "Miami", state: "FL", zip_code: "33101" };

  it("generates URL with slug and source", () => {
    const url = generatePropertyUrl(prop, "email");
    expect(url).toContain("/property/123-main-st");
    expect(url).toContain("src=email");
  });

  it("uses existing slug if available", () => {
    const url = generatePropertyUrl({ ...prop, slug: "custom-slug" });
    expect(url).toContain("/property/custom-slug");
  });

  it("defaults source to sms", () => {
    const url = generatePropertyUrl(prop);
    expect(url).toContain("src=sms");
  });
});

describe("generateDirectPropertyUrlBySlug", () => {
  it("generates direct URL", () => {
    const url = generateDirectPropertyUrlBySlug("test-slug", "email");
    expect(url).toBe("https://offer.mylocalinvest.com/property/test-slug?src=email");
  });

  it("defaults to sms source", () => {
    const url = generateDirectPropertyUrlBySlug("my-prop");
    expect(url).toContain("src=sms");
  });
});

describe("generateTrackedPropertyUrlBySlug", () => {
  it("generates tracked URL with slug and source", () => {
    const url = generateTrackedPropertyUrlBySlug("test-slug", "qr");
    expect(url).toContain("slug=test-slug");
    expect(url).toContain("src=qr");
  });

  it("includes campaign when provided", () => {
    const url = generateTrackedPropertyUrlBySlug("test-slug", "email", "spring-2026");
    expect(url).toContain("campaign=spring-2026");
  });
});
