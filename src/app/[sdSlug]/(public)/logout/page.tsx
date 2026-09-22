import { Layout } from "@/components";
import { LogoutPage } from "@churchapps/apphelper/login";

export const dynamic = "force-dynamic";

export default function Logout() {
  return (
    <Layout withoutNavbar>
      <LogoutPage />
    </Layout>
  );
}
