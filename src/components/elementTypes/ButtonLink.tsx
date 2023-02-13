import { Button } from "@mui/material";
import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export function ButtonLink({ element }: Props) {
  return (
    <Button
      href={element.answers?.buttonLinkUrl}
      variant={element.answers?.buttonLinkVariant || "contained"}
      color={element.answers?.buttonLinkColor}
      target={element.answers?.buttonLinkIsExternal === "true" ? "_blank" : "_self"}
    >
      {element.answers?.buttonLinkText}
    </Button>
  );
}
