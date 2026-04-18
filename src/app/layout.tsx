import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  title: "ChurchApps",
  description: "Open Source Software for Churches",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await EnvironmentHelper.initServerSide();

  return (
    <html className={roboto.className}>
      <body>{children}</body>
    </html>
  );
}
