import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import MuiAccordionSummary, { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@churchapps/apphelper";

interface Props {
  element: ElementInterface;
  textColor: string;
}

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  background: "transparent",
  "&:before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<DoubleArrowIcon sx={{ color: "#03a9f4" }} />}
    {...props}
  />
))(({ theme }) => ({
  flexDirection: "row-reverse",
  backgroundColor: "transparent",
  marginTop: 10,
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    marginLeft: theme.spacing(1),
    // color: "#00000080",
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme, color }) => ({
  marginLeft: theme.spacing(1),
  color: color,
}));

export const FaqElement = ({ element, textColor }: Props) => (
  <>
    <Accordion id={"el-" + element.id}>
      <AccordionSummary>
        <Typography variant="h6" fontWeight={600} color={textColor === "dark" ? "#444" : "#eee"}>
          {element?.answers?.title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails color={textColor === "dark" ? "#444" : "#eee"}>
        <MarkdownPreview value={element?.answers?.description} />
      </AccordionDetails>
    </Accordion>
  </>
);
