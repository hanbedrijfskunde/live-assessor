import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadFromLocalStorage, saveToLocalStorage } from "../../src/utils";

// jsdom's localStorage is not reliably functional under Vitest, so we back the
// global with a minimal in-memory Storage and test the util's contract directly.
function makeStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

describe("localStorage helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and loads JSON round-trip", () => {
    const value = { a: 1, b: ["x", "y"], nested: { ok: true } };
    saveToLocalStorage("promef_test", value);
    expect(loadFromLocalStorage("promef_test", null)).toEqual(value);
  });

  it("returns the default when the key is absent", () => {
    expect(loadFromLocalStorage("missing_key", "DEFAULT")).toBe("DEFAULT");
  });

  it("returns the default when stored data is corrupt JSON", () => {
    localStorage.setItem("corrupt", "{ this is not json");
    expect(loadFromLocalStorage("corrupt", "FALLBACK")).toBe("FALLBACK");
  });
});
