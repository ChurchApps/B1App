import "react-activity/dist/Dots.css";
import "@churchapps/apphelper-website/dist/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/styles/sidebar.css";
import "@churchapps/apphelper-markdown/dist/components/markdownEditor/editor.css";
import ClientLayout from "./ClientLayout";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'ChurchApps',
  description: 'Open Source Software for Churches',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await EnvironmentHelper.initServerSide();

  return (
    <html className={roboto.className}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
