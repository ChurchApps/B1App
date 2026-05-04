import { WebPushHelper as SharedWebPushHelper } from "@churchapps/apphelper";

// Configure once at module load so any caller of WebPushHelper.subscribe / .getRegistration
// uses the B1App PWA scope and appName.
SharedWebPushHelper.configure({ scope: "/mobile", appName: "B1AppPwa" });

export const WebPushHelper = SharedWebPushHelper;
