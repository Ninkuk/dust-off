import { pickIndexFromSeed, seededShuffle } from "@/lib/seeded-shuffle";

type Item = { id: string };

const items: Item[] = Array.from({ length: 50 }, (_, i) => ({
  id: `item-${i}`,
}));

describe("seededShuffle", () => {
  it("is deterministic for the same items and seed", () => {
    const a = seededShuffle(items, 42);
    const b = seededShuffle(items, 42);
    expect(a).toEqual(b);
  });

  it("produces different output for different seeds", () => {
    const a = seededShuffle(items, 1);
    const b = seededShuffle(items, 2);
    expect(a).not.toEqual(b);
  });

  it("preserves length and multiset of elements without mutating input", () => {
    const inputCopy = items.map((i) => ({ ...i }));
    const out = seededShuffle(items, 7);

    expect(out).toHaveLength(items.length);
    expect([...out].sort((x, y) => x.id.localeCompare(y.id))).toEqual(
      [...items].sort((x, y) => x.id.localeCompare(y.id)),
    );
    // input array/objects untouched
    expect(items).toEqual(inputCopy);
  });

  it("pins anchored ids to the head in original relative order", () => {
    const abcde: Item[] = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
    ];
    const out = seededShuffle(abcde, 123, {
      anchorIds: new Set(["c", "a"]),
    });

    expect(out[0]).toEqual({ id: "a" });
    expect(out[1]).toEqual({ id: "c" });
    // rest are the remaining ids, in some order
    const restIds = out.slice(2).map((i) => i.id).sort();
    expect(restIds).toEqual(["b", "d", "e"]);
  });

  it("supports idOf override for anchoring objects without an id field", () => {
    type Named = { name: string };
    const named: Named[] = [
      { name: "alpha" },
      { name: "beta" },
      { name: "gamma" },
    ];
    const out = seededShuffle(named, 5, {
      anchorIds: new Set(["gamma"]),
      idOf: (n) => n.name,
    });

    expect(out[0]).toEqual({ name: "gamma" });
    expect(out.map((n) => n.name).sort()).toEqual(
      ["alpha", "beta", "gamma"].sort(),
    );
  });

  it("handles empty and single-element inputs", () => {
    expect(seededShuffle([], 1)).toEqual([]);
    expect(seededShuffle([{ id: "solo" }], 1)).toEqual([{ id: "solo" }]);
  });
});

describe("pickIndexFromSeed", () => {
  it("returns 0 for length <= 0", () => {
    expect(pickIndexFromSeed("scope", 1, 0)).toBe(0);
    expect(pickIndexFromSeed("scope", 1, -1)).toBe(0);
  });

  it("returns an integer within [0, length) for a positive length", () => {
    for (let seed = 0; seed < 20; seed++) {
      const idx = pickIndexFromSeed("scope", seed, 10);
      expect(Number.isInteger(idx)).toBe(true);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(10);
    }
  });

  it("is deterministic for the same scope, seed, and length", () => {
    const a = pickIndexFromSeed("scope", 99, 10);
    const b = pickIndexFromSeed("scope", 99, 10);
    expect(a).toBe(b);
  });

  it("can differ across scopes for the same seed", () => {
    const scopes = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const indices = scopes.map((scope) => pickIndexFromSeed(scope, 1, 10));
    const distinct = new Set(indices);
    expect(distinct.size).toBeGreaterThan(1);
  });
});
