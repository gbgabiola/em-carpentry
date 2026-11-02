const ownerId = "30000000-0000-4000-8000-000000000001";
const outsiderId = "30000000-0000-4000-8000-000000000002";
export function syntheticSession(owner = true) {
  const id = owner ? ownerId : outsiderId;
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const user = {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "synthetic-owner@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  return {
    access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, role: "authenticated", exp: 4102444800, aud: "authenticated" })}.synthetic-signature`,
    refresh_token: "synthetic-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 4102444800,
    user,
  };
}
