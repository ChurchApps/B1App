import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "..";

interface Props {
  element: ElementInterface;
}

export const FaqElement = ({ element }: Props) => {
  // console.log("ELEMENT: ", element);

  return (
    <>
      <Accordion style={{ borderRadius: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{element.answers.faqTitle}</Typography>
        </AccordionSummary>
        <AccordionDetails
          style={{ backgroundColor: "#eeeeee", borderRadius: 3 }}
        >
          <MarkdownPreview value={element.answers.text || ""} />
        </AccordionDetails>
      </Accordion>
    </>
  );
};
