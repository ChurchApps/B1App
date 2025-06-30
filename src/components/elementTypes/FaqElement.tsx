import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import MuiAccordionSummary, { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import { ElementInterface } from "@/helpers";
import { MarkdownPreviewLight } from "@churchapps/apphelper";

interface Props {
  element: ElementInterface;
  textColor: string;
}

const Accordion = styled((props: AccordionProps) => (<MuiAccordion disableGutters elevation={0} square {...props} />))(({ theme }) => ({
  background: "transparent",
  "&:before": { display: "none" },
}));


const AccordionSummary = styled((props: AccordionSummaryProps & { iconColor: string }) => (<MuiAccordionSummary expandIcon={<DoubleArrowIcon sx={{ color: props.iconColor }} />} {...props} />))(({ theme }) => ({
  flexDirection: "row-reverse",
  backgroundColor: "transparent",
  marginTop: 10,
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "rotate(90deg)" },
  "& .MuiAccordionSummary-content": { marginLeft: theme.spacing(1) },
  "& .MuiAccordionSummary-content.Mui-expanded": { marginLeft: theme.spacing(1) }
}));

const SimpleAccordionSummary = styled((props: AccordionSummaryProps) => (<MuiAccordionSummary {...props} />))(({ theme }) => ({
  flexDirection: "row-reverse",
  backgroundColor: "transparent",
  "& .MuiAccordionSummary-content": {  marginTop:0, marginBottom:0, marginLeft: theme.spacing(1) },
  "& .MuiAccordionSummary-content.Mui-expanded": { marginLeft: theme.spacing(1) }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme, color }) => ({
  marginLeft: theme.spacing(1),
  color: color,
}));



export const FaqElement = ({ element, textColor }: Props) => {
  const simple = element?.answers?.headingType==="link";
  return (
    <>
      <Accordion id={"el-" + element.id} style={(simple) ? {marginTop:0} : null }>
        {!simple && <AccordionSummary iconColor={element?.answers?.iconColor || "#03a9f4"}>
          <Typography variant="h6" fontWeight={600} color={textColor === "dark" ? "#444" : "#eee"}>
            {element?.answers?.title}
          </Typography>
        </AccordionSummary>}
        {simple && <SimpleAccordionSummary><a style={{display:"block", textAlign:"center", width:"100%"}}>{element?.answers?.title}</a></SimpleAccordionSummary>}
        <AccordionDetails color={textColor === "dark" ? "#444" : "#eee"}>
          <MarkdownPreviewLight value={element?.answers?.description} />
        </AccordionDetails>
      </Accordion>
    </>);
}
