import { useState } from "react";
import { Box, Collapse, IconButton, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { LinkInterface } from "@churchapps/apphelper";

interface Props {
  link?: LinkInterface;
  links?: LinkInterface[];
  handleClose?: (event: Event | React.SyntheticEvent) => void;
}

const RecursiveList = ({ links, handleClose }: Props) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => { setOpen(!open); };
  return (
    <>
      {links?.map((item: LinkInterface) => (
        <Box key={item.id}>
          {item?.children ? (
            <Box>
              <ListItem disablePadding secondaryAction={<IconButton sx={{ color: "black !important" }} onClick={handleClick}>{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>}>
                <ListItemButton href={item.url} onClick={handleClose} sx={{ pl: 2 }}>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <RecursiveList key={item.id} links={item?.children} handleClose={handleClose} />
                </List>
              </Collapse>
            </Box>
          ) : (
            <ListItem disablePadding>
              <ListItemButton href={item.url} onClick={handleClose} sx={{ pl: 2 }}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )}
        </Box>
      ))}
    </>
  );
};

const CascadingListMenu = ({ link, handleClose }: Props) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => { setOpen(!open); };
  return (
    <>
      {link?.children ? (
        <>
          <ListItem disablePadding secondaryAction={<IconButton sx={{ color: "black !important" }} onClick={handleClick}>{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>}>
            <ListItemButton href={link.url} onClick={handleClose}>
              <ListItemText primary={link.text} />
            </ListItemButton>
          </ListItem>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <RecursiveList key={link.id} links={link?.children} handleClose={handleClose} />
            </List>
          </Collapse>
        </>
      ) : (
        <ListItem key={link.id} disablePadding>
          <ListItemButton href={link.url} onClick={handleClose}>
            <ListItemText primary={link.text} />
          </ListItemButton>
        </ListItem>
      )}
    </>
  );
};

export default CascadingListMenu;
