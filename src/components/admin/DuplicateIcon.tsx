import { Button, Tooltip } from "@mui/material";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import { ApiHelper } from "@churchapps/apphelper";
import { ElementInterface } from "@/helpers";

interface Props {
  data: ElementInterface;
  onDuplicate?: () => void;
}

export function DuplicateIcon(props: Props) {

  const handleDuplicate = () => {
    const { id, ...rest } = props.data;
    const duplicateElement = { ...rest };
    duplicateElement.sort = duplicateElement.sort + 0.1;
    ApiHelper.post("/elements?duplicate=1", [duplicateElement], "ContentApi").then(() => { props?.onDuplicate(); });
  };

  return (
    <Tooltip title="Duplicate" arrow placement="top">
      <Button size="small" color="secondary" variant="contained" sx={{ minWidth: "auto", padding: "4px 4px" }} onClick={handleDuplicate}>
        <CopyAllIcon fontSize="small" />
      </Button>
    </Tooltip>
  );
}
