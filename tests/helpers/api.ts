import { APIRequestContext, request } from "@playwright/test";

const MAIN_API = "http://localhost:8084";
const LESSONS_API = "http://localhost:8090";

export type ApiHandle = {
  request: APIRequestContext;
  jwt: string;
  churchId: string;
};

export async function getApi(identity: "demo" | "lessons-admin"): Promise<ApiHandle> {
  const ctx = await request.newContext();
  const email = identity === "lessons-admin" ? (process.env.TEST_LESSONS_ADMIN_EMAIL || "lessons-admin@demo.churchapps.org") : "demo@b1.church";
  const password = identity === "lessons-admin" ? (process.env.TEST_LESSONS_ADMIN_PASSWORD || "password") : "password";
  const churchId = identity === "lessons-admin" ? "CHU00000099" : "CHU00000001";

  const res = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok()) throw new Error(`login ${identity} failed: ${res.status()}`);
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === churchId) || body.userChurches?.[0];
  const keyName = identity === "lessons-admin" ? "LessonsApi" : "DoingApi";
  const api = uc?.apis?.find((a: any) => a.keyName === keyName);
  if (!api?.jwt) throw new Error(`${keyName} JWT not present for ${identity}`);
  return { request: ctx, jwt: api.jwt, churchId };
}

export async function apiCall(api: ApiHandle, method: "get" | "post" | "delete", url: string, body?: any) {
  const opts: any = { headers: { Authorization: `Bearer ${api.jwt}`, "Content-Type": "application/json" } };
  if (body !== undefined) opts.data = body;
  return api.request[method](url, opts);
}

export const lessonsUrl = (path: string) => `${LESSONS_API}${path}`;
export const doingUrl = (path: string) => `${MAIN_API}/doing${path}`;
