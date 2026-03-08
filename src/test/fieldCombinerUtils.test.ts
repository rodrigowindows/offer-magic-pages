import { describe, it, expect } from "vitest";
import {
  applyCleanup,
  combineFieldValues,
  validateCombinedField,
  getAllColumnNames,
  isCombinedField,
  getSourceColumns,
  createPresetField,
  autoDetectCombinedFields,
} from "@/utils/fieldCombinerUtils";

describe("applyCleanup", () => {
  it("trims whitespace", () => {
    expect(applyCleanup("  hello  ", ["trim"])).toBe("hello");
  });

  it("converts to uppercase", () => {
    expect(applyCleanup("hello", ["uppercase"])).toBe("HELLO");
  });

  it("converts to lowercase", () => {
    expect(applyCleanup("HELLO", ["lowercase"])).toBe("hello");
  });

  it("removes special characters", () => {
    expect(applyCleanup("hello@#world!", ["removeSpecialChars"])).toBe("helloworld");
  });

  it("removes duplicate spaces", () => {
    expect(applyCleanup("hello   world  test", ["removeDuplicateSpaces"])).toBe("hello world test");
  });

  it("applies multiple rules in order", () => {
    expect(applyCleanup("  Hello World!  ", ["trim", "uppercase", "removeSpecialChars"])).toBe("HELLO WORLD");
  });

  it("handles empty string", () => {
    expect(applyCleanup("", ["trim", "uppercase"])).toBe("");
  });
});

describe("combineFieldValues", () => {
  const row = { first: "John", last: "Doe", city: "Miami" };

  it("combines with space separator", () => {
    const result = combineFieldValues(row, {
      id: "1", name: "Full Name", sourceColumns: ["first", "last"],
      separator: " ", cleanupRules: ["trim"],
    });
    expect(result).toBe("John Doe");
  });

  it("combines with comma separator", () => {
    const result = combineFieldValues(row, {
      id: "2", name: "Name City", sourceColumns: ["first", "city"],
      separator: ", ", cleanupRules: ["trim"],
    });
    expect(result).toBe("John, Miami");
  });

  it("handles __NONE__ separator", () => {
    const result = combineFieldValues(row, {
      id: "3", name: "Concat", sourceColumns: ["first", "last"],
      separator: "__NONE__", cleanupRules: [],
    });
    expect(result).toBe("JohnDoe");
  });

  it("handles missing columns gracefully", () => {
    const result = combineFieldValues(row, {
      id: "4", name: "Missing", sourceColumns: ["first", "nonexistent"],
      separator: " ", cleanupRules: [],
    });
    expect(result).toBe("John ");
  });
});

describe("validateCombinedField", () => {
  const availableColumns = ["first", "last", "city"];

  it("passes with valid config", () => {
    const result = validateCombinedField(
      { id: "1", name: "Full Name", sourceColumns: ["first", "last"], separator: " ", cleanupRules: [] },
      availableColumns
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails with empty name", () => {
    const result = validateCombinedField(
      { id: "1", name: "", sourceColumns: ["first"], separator: " ", cleanupRules: [] },
      availableColumns
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Nome do campo é obrigatório");
  });

  it("fails with no source columns", () => {
    const result = validateCombinedField(
      { id: "1", name: "Test", sourceColumns: [], separator: " ", cleanupRules: [] },
      availableColumns
    );
    expect(result.valid).toBe(false);
  });

  it("fails with missing columns", () => {
    const result = validateCombinedField(
      { id: "1", name: "Test", sourceColumns: ["first", "unknown"], separator: " ", cleanupRules: [] },
      availableColumns
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("unknown"))).toBe(true);
  });
});

describe("getAllColumnNames", () => {
  it("merges original and combined", () => {
    const result = getAllColumnNames(["a", "b"], [
      { id: "1", name: "c", sourceColumns: [], separator: "", cleanupRules: [] },
    ]);
    expect(result).toEqual(["a", "b", "c"]);
  });
});

describe("isCombinedField", () => {
  const fields = [{ id: "1", name: "Full Name", sourceColumns: [], separator: "", cleanupRules: [] }];

  it("returns true for combined field", () => {
    expect(isCombinedField("Full Name", fields)).toBe(true);
  });

  it("returns false for regular field", () => {
    expect(isCombinedField("other", fields)).toBe(false);
  });
});

describe("getSourceColumns", () => {
  const fields = [{ id: "1", name: "Full Name", sourceColumns: ["first", "last"], separator: "", cleanupRules: [] }];

  it("returns source columns", () => {
    expect(getSourceColumns("Full Name", fields)).toEqual(["first", "last"]);
  });

  it("returns empty for unknown field", () => {
    expect(getSourceColumns("unknown", fields)).toEqual([]);
  });
});

describe("createPresetField", () => {
  it("creates fullName preset when columns exist", () => {
    const result = createPresetField("fullName", ["Input First Name", "Input Last Name"]);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Full Name");
    expect(result!.sourceColumns).toEqual(["Input First Name", "Input Last Name"]);
  });

  it("returns null when no columns match", () => {
    const result = createPresetField("fullName", ["random_col"]);
    expect(result).toBeNull();
  });

  it("creates fullAddress preset with partial columns", () => {
    const result = createPresetField("fullAddress", ["Owner Fix - Mailing Address"]);
    expect(result).not.toBeNull();
    expect(result!.sourceColumns).toEqual(["Owner Fix - Mailing Address"]);
  });
});

describe("autoDetectCombinedFields", () => {
  it("detects address-only when only address column exists", () => {
    const result = autoDetectCombinedFields(["Owner Fix - Mailing Address"]);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Property Address Only");
  });

  it("detects full address when address and city exist", () => {
    const result = autoDetectCombinedFields(["Owner Fix - Mailing Address", "Owner Fix - Mailing City"]);
    expect(result.some(f => f.name === "Full Address")).toBe(true);
  });

  it("detects name fields", () => {
    const result = autoDetectCombinedFields(["Input First Name", "Input Last Name"]);
    expect(result.some(f => f.name === "Full Name")).toBe(true);
  });

  it("returns empty for unrecognized columns", () => {
    const result = autoDetectCombinedFields(["random1", "random2"]);
    expect(result).toHaveLength(0);
  });
});
