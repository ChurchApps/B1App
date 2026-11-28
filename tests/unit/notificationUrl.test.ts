import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveNotificationUrl } from "../../src/app/[sdSlug]/mobile/helpers/notificationUrl.ts";

// ChurchAppsSupport#1495: request decisions and note alerts did nothing when tapped.
describe("deriveNotificationUrl", () => {
  it("opens My Requests for event and room request decisions", () => {
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", message: "Your event request \"Family issues\" was rejected." }), "/mobile/myRequests");
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", message: "Your event request \"Family issues\" was approved." }), "/mobile/myRequests");
    assert.equal(deriveNotificationUrl({ contentType: "eventBooking", contentId: "b1" }), "/mobile/myRequests");
  });

  it("leaves a linkless event reminder without a target", () => {
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", message: "Reminder: Sunday Service is coming up" }), undefined);
  });

  it("keeps a group event reminder's link", () => {
    const link = "/mobile/groups/g1?activeTab=events";
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", message: "Reminder: Sunday Service is coming up", link }), link);
  });

  it("follows the server link before the fallbacks", () => {
    assert.equal(deriveNotificationUrl({ contentType: "event", contentId: "e1", link: "/mobile/events/e1" }), "/mobile/events/e1");
  });

  // ChurchAppsSupport#1676: a reply in a request's discussion opens that request's messages.
  it("opens the request's messages for a reply to an event request", () => {
    const link = "/mobile/myRequests?request=e1";
    assert.equal(deriveNotificationUrl({ contentType: "eventRequest", contentId: "e1", message: "New message: Baptism (event request)", link }), link);
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

  // ChurchAppsSupport#1635: task assignment and task note alerts did nothing when tapped.
  it("opens My tasks on the task for task and card notifications", () => {
    assert.equal(deriveNotificationUrl({ contentType: "task", contentId: "t1", message: "New Assignment: Call Donald Clark" }), "/mobile/myTasks?task=t1");
    assert.equal(deriveNotificationUrl({ contentType: "workflowCard", contentId: "c1" }), "/mobile/myTasks?task=c1");
  });

  it("keeps a card note in the app instead of following its B1 Admin link", () => {
    assert.equal(deriveNotificationUrl({ contentType: "workflowCard", contentId: "c1", link: "https://admin.b1.church/serving/tasks/c1" }), "/mobile/myTasks?task=c1");
  });
});
