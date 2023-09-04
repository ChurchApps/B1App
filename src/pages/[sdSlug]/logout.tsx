import { Layout } from "@/components";
import { LogoutPage } from "@churchapps/apphelper";

export default function Logout() {
  return (
    <Layout withoutNavbar withoutFooter>
      <LogoutPage />
    </Layout>
  );
}
