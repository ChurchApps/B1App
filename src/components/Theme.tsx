import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import React from "react";
import { Helmet } from "react-helmet";


export const Theme = () => {
  const defaultColors = {
    primaryColor: "#FFFFFF",
    primaryContrast: "#333333",
    secondaryColor: "#1b75bc",
    secondaryContrast: "#FFFFFF",
  };

  let css = null;

  css = (
    <style type="text/css">{`
      :root { 
        --primaryColor: ${defaultColors.primaryColor}; 
        --primaryContrast: ${defaultColors.primaryContrast}; 
        --secondaryColor: ${defaultColors.secondaryColor};
        --secondaryContrast: ${defaultColors.secondaryContrast};
      }
      `}</style>
  );


  return <Helmet>{css}</Helmet>;
};
