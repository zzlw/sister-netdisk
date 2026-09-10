import { TtlCache } from "./ttl-cache";

describe("TtlCache", () => {
  it("returns values before expiry and evicts afterwards", () => {
    let now = 1_000;
    const cache = new TtlCache<string>(60_000, 8, () => now);
    cache.set("q", "hit");
    expect(cache.get("q")).toBe("hit");
    now = 61_001;
    expect(cache.get("q")).toBeUndefined();
  });

  it("does nothing when ttl is 0", () => {
    const cache = new TtlCache<string>(0);
    cache.set("q", "hit");
    expect(cache.get("q")).toBeUndefined();
  });
});
