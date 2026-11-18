// Sign-in link into B1Admin that carries the user's session across.
export const adminLoginUrl = (adminRoot: string, churchId: string, jwt: string, returnUrl = "/") => {
  // Append rather than resolve "/login", which would drop a path root like https://domain.net/admin.
  const url = new URL(adminRoot.replace(/\/+$/, "") + "/login");
  url.searchParams.set("churchId", churchId);
  url.searchParams.set("returnUrl", returnUrl);
  url.hash = "jwt=" + encodeURIComponent(jwt);
  return url.toString();
};
