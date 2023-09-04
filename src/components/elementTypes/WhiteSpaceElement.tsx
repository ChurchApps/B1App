import { Box } from "@mui/material";
import { ElementInterface, SectionInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
}

export const WhiteSpaceElement = ({ element, onEdit }: Props) => (
  <>
    <Box
      sx={{
        height: (parseInt(element.answers?.height) || 25),
        backgroundColor: onEdit ? "#9e9e9e" : "",
        opacity: 0.7,
      }}
    />
  </>
);
