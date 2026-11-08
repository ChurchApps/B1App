import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveNotificationUrl } from "../../src/app/[sdSlug]/mobile/helpers/notificationUrl.ts";

// ChurchAppsSupport#1495: request decisions and note alerts did nothing when tapped.
describe("deriveNotificationUrl", () => {
  it("opens My Requests for event and room request decisions", () => {
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", message: "Your event request \"Family issues\" was rejected." } as any), "/mobile/myRequests");
    assert.equal(deriveNotificationUrl({ contentType: "eventBooking", contentId: "b1" }), "/mobile/myRequests");
  });

  it("follows the server link before the fallbacks", () => {
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", link: "/mobile/events/e1" }), "/mobile/events/e1");
  });

  it("opens group notes in the group's chat", () => {
    assert.equal(deriveNotificationUrl({ contentType: "groupNote", contentId: "g1" }), "/mobile/groups/g1?openChat=1&chatTab=notes");
  });

  it("follows an absolute B1 Admin link for notes the app cannot show", () => {
    const link = "https://admin.b1.church/groups/g1?view=calendar";
    assert.equal(deriveNotificationUrl({ contentType: "eventNote", contentId: "e1", link }), link);
  });

  it("ignores links that are neither app paths nor http(s)", () => {
    assert.equal(deriveNotificationUrl({ contentType: "eventNote", contentId: "e1", link: "javascript:alert(1)" }), undefined);
  });
});
