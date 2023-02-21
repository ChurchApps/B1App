import { AppearanceInterface } from "@/appBase/helpers";
import React from "react";
import { Helmet } from "react-helmet"
import { ConfigHelper } from "../helpers";

interface Props { appearance?: AppearanceInterface }

export const Theme: React.FC<Props> = (props) => {

  const defaultColors = {
    primaryColor: "#08A0CC",
    primaryContrast: "#FFFFFF",
    secondaryColor: "#FFBA1A",
    secondaryContrast: "#000000"
  }

  let css = null;

  if (props.appearance?.primaryColor) {
    css = (<style type="text/css">{`
      :root { 
        --primaryColor: ${props.appearance?.primaryColor || defaultColors.primaryColor}; 
        --primaryContrast: ${props.appearance?.primaryContrast || defaultColors.primaryContrast}; 
        --secondaryColor: ${props.appearance?.secondaryColor || defaultColors.secondaryColor};
        --secondaryContrast: ${props.appearance?.secondaryContrast || defaultColors.secondaryContrast};
      }
      `}</style>);
  }

  return (<Helmet>{css}</Helmet>);
}

