import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";
import type { Metadata } from "next";

export class MetaHelper {
  static getMetaData = (title?: string, description?: string, ogImage?: string, ogDescription?: string, appearance?: AppearanceInterface): Metadata => {
    if (!title) title = "B1.church - Free Church Websites and Mobile Apps";
    if (!description) description = "Providing a simple and seemless way for your congregation to connect is a critical need in the modern church. B1.church provides a way to do this at home, at church or wherever they may be, via their phone.";
    if (!ogImage) ogImage = "https://content.churchapps.org/40/settings/ogImage.png?dt=1717512299395";
    if (!ogDescription) ogDescription = description;

    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        type: "website",
        title,
        description: ogDescription,
        images: [{ url: ogImage, width: 1200, height: 630 }]
      }
    };

    if (appearance?.favicon_16x16) {
      metadata.icons = {
        icon: appearance.favicon_16x16,
        shortcut: appearance.favicon_16x16,
        apple: appearance.favicon_400x400 || appearance.favicon_16x16
      };
    }

    return metadata;
  };
}
