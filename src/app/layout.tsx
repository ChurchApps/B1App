import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@churchapps/apphelper/dist/components/markdownEditor/editor.css";
import ClientLayout from "./ClientLayout";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";



export const metadata = {
  title: 'ChurchApps',
  description: 'Open Source Software for Churches',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  EnvironmentHelper.init();
  await EnvironmentHelper.initLocale();

  return (
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
