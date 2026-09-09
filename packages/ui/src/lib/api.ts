import { cookies } from "next/headers";

const prefix = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/** Server Component / Server 里调 Nest。Cookie 从当前请求带过去。 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const cookie = (await cookies()).toString();
  const url = path.startsWith("http") ? path : `${prefix}${path}`;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...init?.headers,
      cookie,
    },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<T>;
}
