export class MetaHelper {
  static getMetaData = (title?:string, description?:string, ogImage?:string, ogDescription?:string) => {
    if (!title) title = "B1.church - Free Church Websites and Mobile Apps";
    if (!description) description = "Providing a simple and seemless way for your congregation to connect is a critical need in the modern church. B1.church provides a way to do this at home, at church or wherever they may be, via their phone.";
    if (!ogImage) ogImage = "https://content.churchapps.org/40/settings/ogImage.png?dt=1717512299395";
    if (!ogDescription) ogDescription = description;

    return {
      title,
      description,
      openGraph: {
        title,
        description:  ogDescription,
        images: [ogImage],
      },
    };
  }
}
