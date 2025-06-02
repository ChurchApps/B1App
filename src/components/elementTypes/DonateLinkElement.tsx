import { Box, Button } from "@mui/material";
import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export function DonateLinkElement({ element }: Props) {
  const amounts = (element.answers?.amounts && element.answers.amounts.length > 0) ? JSON.parse(element.answers.amounts) : [];

  return (
    <div id={"el-" + element.id}>
      <Box sx={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", marginBottom: "15px" }}>
        <h4 style={{ marginTop: 10, marginBottom: 15 }}>
          {element.answers?.text?.toUpperCase() || "DONATE NOW"}
        </h4>
        {amounts?.map((a: number, index: number) => (
          <Button
            variant="outlined"
            size="small"
            key={index}
            sx={{ minWidth: "70px", marginRight: "10px", marginTop: "5px", borderWidth: "2px", borderRadius: "10px", fontWeight: "bold" }}
            href={`${element.answers?.url}?amount=${a}&fundId=${element.answers?.fundId}`}
            target="_blank"
          >
            $ {a}
          </Button>
        ))}
        <Button
          variant="outlined"
          size="small"
          sx={{ marginTop: "5px", borderWidth: "2px", borderRadius: "10px", fontWeight: "bold" }}
          href={`${element.answers?.url}?fundId=${element.answers?.fundId}`}
          target="_blank"
        >
          Other
        </Button>
      </Box>
    </div>
  );
}
