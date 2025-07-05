import { Layout } from "@/components";
import { LogoutPage } from "@churchapps/apphelper/dist/pageComponents/LogoutPage";

export default function Logout() {
  return (
    <Layout withoutNavbar withoutFooter>
      <LogoutPage />
    </Layout>
  );
}
