import React from "react";
import { Paper, Box, Typography, Stack, styled, Button, Icon } from "@mui/material";

interface Props {
  id?: string;
  children?: React.ReactNode;
  headerIcon?: string;
  headerText: string;
  saveText?: string;
  headerActionContent?: React.ReactNode;
  cancelFunction?: () => void;
  deleteFunction?: () => void;
  saveFunction: () => void;
  "data-cy"?: string;
  className?: string;
  isSubmitting?: boolean;
  ariaLabelDelete?: string;
  ariaLabelSave?: string;
  saveButtonType?: "submit" | "button";
}

const CustomContextBox = styled(Box)({
  marginTop: 10,
  overflowX: "hidden",
  "& p": { color: "#666" },
  "& label": { color: "#999" },
  "& ul": { paddingLeft: 0 },
  "& li": {
    listStyleType: "none",
    marginBottom: 10,
    "& i": { marginRight: 5 }
  },
  "& td": {
    "& i": { marginRight: 5 }
  }
})

export function InputBox({
  id,
  children,
  headerIcon,
  headerText,
  saveText = "Save",
  headerActionContent,
  "data-cy": dataCy,
  cancelFunction,
  deleteFunction,
  saveFunction,
  className = "",
  isSubmitting = false,
  ariaLabelDelete = "",
  ariaLabelSave = "",
  saveButtonType = "button"
}: Props) {
  let buttons = [];
  if (cancelFunction) buttons.push(<Button key="cancel" onClick={cancelFunction} color="warning" sx={{ "&:focus": { outline: "none" } }}>Cancel</Button>);
  if (deleteFunction) buttons.push(<Button key="delete" id="delete" variant="outlined" aria-label={ariaLabelDelete} onClick={deleteFunction} color="error" sx={{ "&:focus": { outline: "none" } }}>Delete</Button>);
  if (saveFunction) buttons.push(<Button key="save" type={saveButtonType} variant="contained" disableElevation aria-label={ariaLabelSave} onClick={saveFunction} disabled={isSubmitting} sx={{ "&:focus": { outline: "none" } }}>{saveText}</Button>);

  let classNames = ["inputBox"];
  if (className) classNames.push(className);
  return (
    <Paper id={id} sx={{ padding: 2, marginBottom: 4 }} data-cy={dataCy}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} data-cy="header">
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {headerIcon && <Icon sx={{ color: "#1976d2" }}>{headerIcon}</Icon>}
          <Typography component="h2" sx={{ display: "inline-block", marginLeft: headerIcon ? 1 : 0 }} variant="h6" color="primary">
            {headerText}
          </Typography>
        </Box>
        <Box>
          {headerActionContent}
        </Box>
      </Box>
      <CustomContextBox>{children}</CustomContextBox>
      <Stack direction="row" sx={{ marginTop: 1 }} spacing={1} justifyContent="end">
        {buttons}
      </Stack>
    </Paper>
  );
}
