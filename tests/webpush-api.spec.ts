import { test, expect } from "@playwright/test";

/** Contract test for POST /messaging/webpush/subscribe device enrollment (server-side, not browser PushManager). */

const API_BASE = "http://localhost:8084";

async function loginAndGetMessagingJwt() {
  const res = await fetch(`${API_BASE}/membership/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@b1.church", password: "password" })
  });
  const body = await res.json() as any;
  const grace = body.userChurches.find((uc: any) => uc.church.id === "CHU00000001");
  return {
    membershipJwt: grace.apis.find((a: any) => a.keyName === "MembershipApi").jwt,
    messagingJwt: grace.apis.find((a: any) => a.keyName === "MessagingApi").jwt,
    personId: grace.person.id as string
  };
}

test.describe("Web push — API contract", () => {
  test("POST /messaging/webpush/subscribe enrolls a webpush device row", async () => {
    const { messagingJwt, personId } = await loginAndGetMessagingJwt();

    // Recognizable endpoint so we can query it later; real services use fcm.googleapis.com / push.services.mozilla.com.
    const stamp = Date.now();
    const subscription = {
      endpoint: `https://example-push.test/endpoint/${stamp}`,
      keys: {
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        auth: "tBHItJI5svbpez7KI4CCXg"
      }
    };

    const subRes = await fetch(`${API_BASE}/messaging/webpush/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${messagingJwt}` },
      body: JSON.stringify({ subscription, appName: "B1AppPwa", deviceInfo: "playwright-test-agent" })
    });
    expect(subRes.status).toBe(200);
    const subBody = await subRes.json() as any;
    expect(subBody.success).toBe(true);
    expect(typeof subBody.id).toBe("string");

    // Idempotency: server upserts by churchId + fcmToken, should reuse same id.
    const subRes2 = await fetch(`${API_BASE}/messaging/webpush/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${messagingJwt}` },
      body: JSON.stringify({ subscription, appName: "B1AppPwa", deviceInfo: "playwright-test-agent-2" })
    });
    expect(subRes2.status).toBe(200);
    const subBody2 = await subRes2.json() as any;
    expect(subBody2.success).toBe(true);
    expect(subBody2.id).toBe(subBody.id);

    // Cleanup so the test is rerun-safe — unsubscribe by endpoint.
    const unsubRes = await fetch(`${API_BASE}/messaging/webpush/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    expect(unsubRes.status).toBe(200);

    // Sanity: personId is reported (just to assert the JWT really resolved).
    expect(personId).toBe("PER00000082");
  });

  test("rejects malformed subscription with success:false", async () => {
    const { messagingJwt } = await loginAndGetMessagingJwt();

    const res = await fetch(`${API_BASE}/messaging/webpush/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${messagingJwt}` },
      body: JSON.stringify({ subscription: { endpoint: "https://example/x" } }) // missing keys
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid/i);
  });
});
