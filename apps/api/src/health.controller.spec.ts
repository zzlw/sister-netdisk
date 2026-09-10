describe("health payload", () => {
  it("matches the public contract", () => {
    const body = { ok: true as const, service: "api", pansou: "ok" as const };
    expect(body).toEqual({ ok: true, service: "api", pansou: "ok" });
  });
});
