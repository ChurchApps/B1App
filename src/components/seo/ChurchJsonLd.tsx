import React from "react";
import Script from "next/script";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props { config: ConfigurationInterface; }

export function ChurchJsonLd({ config }: Props) {
  const church = config.church;
  if (!church?.name) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: church.name,
    url: "https://" + (church.subDomain || config.keyName) + ".b1.church"
  };

  const logo = config.appearance?.logoLight || config.appearance?.logoDark;
  if (logo) data.logo = logo;

  if (church.address1) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: church.address2 ? church.address1 + ", " + church.address2 : church.address1,
      addressLocality: church.city,
      addressRegion: church.state,
      postalCode: church.zip,
      addressCountry: church.country
    };
  }

  return <Script id="church-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
