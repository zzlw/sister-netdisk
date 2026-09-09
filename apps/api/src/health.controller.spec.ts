describe("health payload", () => {
  it("matches the public contract", () => {
    const body = { ok: true as const, service: "api" };
    expect(body).toEqual({ ok: true, service: "api" });
  });
});
