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
      target={element.answers?.external === "true" ? "_blank" : "_self"}
      fullWidth={element.answers?.fullWidth === "true"}
      id={"el-" + element.id}
      data-testid={`button-link-${element.id}`}
      aria-label={element.answers?.buttonLinkText || "Button link"}
    >
      {element.answers?.buttonLinkText}
    </Button>
  );
}
