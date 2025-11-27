import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";

interface MetadataIcons {
  icon: string;
  shortcut: string;
  apple: string;
}

interface Metadata {
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    images: string[];
  };
  icons?: MetadataIcons;
}

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
        title,
        description: ogDescription,
        images: [ogImage],
      },
    };

    if (appearance?.favicon_16x16) {
      metadata.icons = {
        icon: appearance.favicon_16x16,
        shortcut: appearance.favicon_16x16,
        apple: appearance.favicon_400x400 || appearance.favicon_16x16,
      };
    }

    return metadata;
  }
}
