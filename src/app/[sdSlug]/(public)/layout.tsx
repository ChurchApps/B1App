import "react-activity/dist/Dots.css";
import "@/styles/vendor/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/styles/sidebar.css";
import "@/styles/master-detail.css";
import "@youversion/platform-react-ui/styles.css";
import ClientLayout from "@/app/ClientLayout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <link rel="stylesheet" href="/apphelper/css/markdown/editor.css" />
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
