import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "./index.js";

const adminEmail = (
  process.env.DEV_ADMIN_EMAIL ?? "admin@example.com"
).toLowerCase();
const adminPassword = process.env.DEV_ADMIN_PASSWORD ?? "password";
const adminName = process.env.DEV_ADMIN_NAME ?? "本地管理员";
const userEmail = (
  process.env.DEV_USER_EMAIL ?? "user@example.com"
).toLowerCase();
const userPassword = process.env.DEV_USER_PASSWORD ?? "password";
const userName = process.env.DEV_USER_NAME ?? "本地会员";

function newId() {
  return randomBytes(16).toString("hex");
}

async function upsertLocalUser(opts: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  passwordEnv: string;
}) {
  if (opts.password.length < 8) {
    throw new Error(`${opts.passwordEnv} 至少 8 位`);
  }
  const hashed = await hashPassword(opts.password);
  const now = new Date();
  const existing = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, opts.email))
    .limit(1);

  if (existing[0]) {
    const userId = existing[0].id;
    await db
      .update(schema.user)
      .set({ role: opts.role, name: opts.name, updatedAt: now })
      .where(eq(schema.user.id, userId));
    const accounts = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, userId));
    const credential = accounts.find((row) => row.providerId === "credential");
    if (credential) {
      await db
        .update(schema.account)
        .set({ password: hashed, updatedAt: now })
        .where(eq(schema.account.id, credential.id));
    } else {
      await db.insert(schema.account).values({
        id: newId(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(
      `已重置本地${opts.role === "admin" ? "员工" : "会员"} ${opts.email} / ${opts.password}`,
    );
    return;
  }

  const userId = newId();
  await db.insert(schema.user).values({
    id: userId,
    name: opts.name,
    email: opts.email,
    emailVerified: true,
    role: opts.role,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(schema.account).values({
    id: newId(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashed,
    createdAt: now,
    updatedAt: now,
  });
  console.log(
    `已写入本地${opts.role === "admin" ? "员工" : "会员"} ${opts.email} / ${opts.password}`,
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("拒绝在生产跑 db:seed。本地账密只存在开发库。");
  }
  if (adminEmail === userEmail) {
    throw new Error("DEV_ADMIN_EMAIL 和 DEV_USER_EMAIL 不能相同");
  }
  await upsertLocalUser({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: "admin",
    passwordEnv: "DEV_ADMIN_PASSWORD",
  });
  await upsertLocalUser({
    email: userEmail,
    password: userPassword,
    name: userName,
    role: "user",
    passwordEnv: "DEV_USER_PASSWORD",
  });
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
