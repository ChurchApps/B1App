import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";

// Issue #1078: in the group calendar's event editor, Insert Image -> Upload
// always ends in "Image processing completed, but upload failed". The gallery
// asks the API for a presigned S3 POST and the browser sends the file straight
// to the bucket, but the B1App Content-Security-Policy connect-src had no S3
// host, so Chrome refused the request before it left the page.
//
// The local API stores files on disk and returns no presigned post, so this
// stands in for production: requestUpload answers with an S3-shaped post and
// the bucket answers 204 like S3 does.
test.describe("Issue 1078 - event description image upload", () => {
  const GROUP_ID = "GRP00000023";
  const S3_URL = "https://churchapps-content.s3.us-east-2.amazonaws.com/";
  const IMAGE = fileURLToPath(new URL("../public/images/sample-profile.png", import.meta.url));

  test("uploading a desktop image posts it to S3 without an upload failed alert", async ({ page }) => {
    const alerts: string[] = [];
    page.on("dialog", (d) => { alerts.push(d.message()); d.dismiss().catch(() => {}); });

    let presignRequested = false;
    let uploadedToS3 = false;
    await page.route("**/content/gallery/requestUpload", async (route) => {
      presignRequested = true;
      const { fileName } = route.request().postDataJSON();
      const key = "CHU00000001/gallery/0/" + fileName;
      await route.fulfill({ json: { url: S3_URL, key, fields: { key, "Content-Type": "image/png", acl: "public-read", Policy: "test", "X-Amz-Signature": "test" } } });
    });
    await page.route(S3_URL, async (route) => {
      uploadedToS3 = true;
      await route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    });

    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /Events/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Events/i }).click();

    const addBtn = page.getByRole("button", { name: /^Add Event$/i });
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    await addBtn.click();

    const eventDialog = page.getByRole("dialog").filter({ hasText: /New Event/i });
    await expect(eventDialog).toBeVisible({ timeout: 5000 });
    await eventDialog.getByRole("button", { name: "Insert Image" }).click();

    const gallery = page.getByRole("dialog").filter({ hasText: "Select a Photo" });
    await expect(gallery).toBeVisible({ timeout: 10000 });
    await gallery.getByRole("tab", { name: "Upload" }).click();
    await gallery.locator("#fileUpload").setInputFiles(IMAGE);
    await expect(gallery.locator(".cropper-crop-box")).toBeVisible({ timeout: 10000 });

    // The cropped image is ready a moment after the crop box settles; until
    // then Update is a no-op, so retry it until the presign request goes out.
    await expect(async () => {
      await gallery.getByRole("button", { name: "Update" }).click();
      expect(presignRequested).toBe(true);
    }).toPass({ timeout: 10000 });

    await expect.poll(() => ({ uploadedToS3, alerts }), { timeout: 10000 }).toEqual({ uploadedToS3: true, alerts: [] });
  });
});
