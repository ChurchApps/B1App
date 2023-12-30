import { Button } from "@mui/material";
import { ElementInterface } from "@/helpers";
import { StyleHelper } from "@/helpers/StyleHelper";

interface Props {
  element: ElementInterface;
}

export function ButtonLink({ element }: Props) {
  return (
    <Button
      href={element.answers?.buttonLinkUrl}
      variant={element.answers?.buttonLinkVariant || "contained"}
      color={element.answers?.buttonLinkColor}
      target={element.answers?.external === "true" ? "_blank" : "_self"}
      fullWidth={element.answers?.fullWidth === "true"}
      style={StyleHelper.getStyles(element)}
    >
      {element.answers?.buttonLinkText}
    </Button>
  );
}
