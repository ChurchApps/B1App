import { Button, Icon } from "@mui/material";
import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export function DonateLinkElement({ element }: Props) {

  return (
    <div
      style={{
        display: "flex",
        justifyContent: element.answers?.alignment || "left",
        margin: "15px 0",
      }}
    >
      <Button
        variant="contained"
        size="small"
        startIcon={<Icon>volunteer_activism</Icon>}
        href={`${element.answers?.url}?fundId=${element.answers?.fundId}&amounts=${element.answers?.amounts}`}
        target="_blank"
      >
        {element.answers?.text || "Donate Now"}
      </Button>
    </div>
  );
}
