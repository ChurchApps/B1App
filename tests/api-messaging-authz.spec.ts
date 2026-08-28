import { test, expect, request, type APIRequestContext } from "@playwright/test";

/**
 * Request-only authz checks for the messaging API (spec-im-01 write gate, spec-chat-04 read gate).
 * No browser UI - every case is a raw HTTP status assertion against the local demo stack.
 */

const MESSAGING = "http://localhost:8084/messaging";
const CHURCH_ID = "CHU00000001";
const OTHER_GROUP = "GRP00000016"; // Men's Bible Study - volunteer is not a member
const OWN_GROUP = "GRP00000025"; // Greeters Ministry - volunteer is a member
const STREAM_ID = "STR00000002";

type Identity = { ctx: APIRequestContext; jwt: string };

async function login(email: string): Promise<Identity> {
  const ctx = await request.newContext();
  const res = await ctx.post("http://localhost:8084/membership/users/login", {
    data: { email, password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`);
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID);
  if (!uc) throw new Error(`${email} has no membership in ${CHURCH_ID}`);
  // Members without an explicit MessagingApi role permission fall back to the church JWT, which is
  // exactly what UserHelper.setupApiHelper hands ApiHelper in the browser.
  const jwt = (uc.apis || []).find((a: any) => a.keyName === "MessagingApi")?.jwt || uc.jwt;
  if (!jwt) throw new Error(`no messaging JWT for ${email}`);
  return { ctx, jwt };
}

const get = (id: Identity, path: string) => id.ctx.get(MESSAGING + path, { headers: { Authorization: `Bearer ${id.jwt}` } });
const post = (id: Identity, path: string, data: any) =>
  id.ctx.post(MESSAGING + path, { headers: { Authorization: `Bearer ${id.jwt}`, "Content-Type": "application/json" }, data });

test.describe("Messaging API authorization", () => {
  test.describe.configure({ mode: "serial" });

  let volunteer: Identity;
  let demo: Identity;
  let otherGroupConversationId: string;
  let hostConversationId: string;

  test.beforeAll(async () => {
    volunteer = await login("volunteer@b1.church");
    demo = await login("demo@b1.church");

    const convRes = await post(demo, "/conversations", [{ contentType: "group", contentId: OTHER_GROUP, title: "authz spec", visibility: "public", allowAnonymousPosts: false, groupId: OTHER_GROUP }]);
    expect(convRes.status()).toBe(200);
    otherGroupConversationId = (await convRes.json())[0].id;

    const hostRes = await get(demo, `/conversations/current/${CHURCH_ID}/streamingLiveHost/${STREAM_ID}`);
    expect(hostRes.status()).toBe(200);
    hostConversationId = (await hostRes.json()).id;
  });

  test("non-member cannot list conversations for a group they are not in", async () => {
    expect((await get(volunteer, `/conversations/messages/group/${OTHER_GROUP}`)).status()).toBe(401);
    expect((await get(volunteer, `/conversations/messages/group/${OWN_GROUP}`)).status()).toBe(200);
    expect((await get(demo, `/conversations/messages/group/${OTHER_GROUP}`)).status()).toBe(200);
  });

  test("non-member cannot read that group's messages and it is filtered out of the timeline", async () => {
    expect((await get(volunteer, `/messages/conversation/${otherGroupConversationId}`)).status()).toBe(401);
    const timeline = await get(volunteer, `/conversations/timeline/ids?ids=${otherGroupConversationId}`);
    expect(timeline.status()).toBe(200);
    expect(await timeline.json()).toEqual([]);

    expect((await get(demo, `/messages/conversation/${otherGroupConversationId}`)).status()).toBe(200);
  });

  test("host chat requires chat.host", async () => {
    expect((await get(volunteer, `/conversations/${CHURCH_ID}/streamingLiveHost/${STREAM_ID}`)).status()).toBe(401);
    expect((await get(volunteer, `/conversations/current/${CHURCH_ID}/streamingLiveHost/${STREAM_ID}`)).status()).toBe(401);
    expect((await post(volunteer, "/connections", [{ conversationId: hostConversationId, socketId: "authz-spec-volunteer", displayName: "Rachel" }])).status()).toBe(401);

    expect((await get(demo, `/conversations/${CHURCH_ID}/streamingLiveHost/${STREAM_ID}`)).status()).toBe(200);
    expect((await get(demo, `/conversations/current/${CHURCH_ID}/streamingLiveHost/${STREAM_ID}`)).status()).toBe(200);
    expect((await post(demo, "/connections", [{ conversationId: hostConversationId, socketId: "authz-spec-demo", displayName: "Demo" }])).status()).toBe(200);
  });

  // spec-im-01: the write gate.
  test("non-member cannot post into a group conversation", async () => {
    const res = await post(volunteer, "/messages", [{ conversationId: otherGroupConversationId, content: "should not land", messageType: "message" }]);
    expect(res.status()).toBe(401);

    const after = await get(demo, `/messages/conversation/${otherGroupConversationId}`);
    expect(await after.json()).toEqual([]);
  });
});
