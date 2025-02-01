import { useContext, createContext, useMemo, useCallback } from "react";
import Link from "next/link";
import { MenuItem } from "@mui/material";
import { usePopupState, bindHover, bindFocus, bindMenu } from "material-ui-popup-state/hooks";
import HoverMenu from "material-ui-popup-state/HoverMenu";
import { LinkInterface } from "@churchapps/apphelper";

interface MenuInterface {
  links?: LinkInterface[];
  link?: LinkInterface;
}

const CascadingContext = createContext({ parentPopupState: null, rootPopupState: null });

const CascadingMenuItem = ({ onClick, ...props }: any) => {
  const { rootPopupState } = useContext(CascadingContext);
  if (!rootPopupState) throw new Error("must be used inside a CascadingMenu");
  const handleClick = useCallback((event: any) => {
    rootPopupState.close(event);
    if (onClick) onClick(event);
  }, [rootPopupState, onClick]);
  return (<MenuItem {...props} onClick={handleClick} style={{ whiteSpace: "normal", width: 200, overflow: "hidden" }} />);
};

const CascadingSubmenu = ({ title, popupId, ...props }: any) => {
  const { parentPopupState } = useContext(CascadingContext);
  const popupState = usePopupState({ popupId, variant: "popover", parentPopupState });
  return (
    <div>
      <MenuItem {...bindHover(popupState)} {...bindFocus(popupState)} style={{ width: 200 }}>
        <span style={{ whiteSpace: "normal", width: 200, overflow: "hidden" }}>
          {title}
        </span>
      </MenuItem>
      <CascadingMenu {...props} classes={{ ...props.classes, paper: "submenu" }} anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "right" }} popupState={popupState} />
    </div>
  );
};

const CascadingMenu = ({ popupState, ...props }: any) => {
  const { rootPopupState } = useContext(CascadingContext);
  const context = useMemo(
    () => ({
      rootPopupState: rootPopupState || popupState,
      parentPopupState: popupState,
    }),
    [rootPopupState, popupState]
  );

  return (
    <CascadingContext.Provider value={context}>
      <HoverMenu {...props} {...bindMenu(popupState)} />
    </CascadingContext.Provider>
  );
};

const RecursiveMenus = ({ links }: MenuInterface) => (
  <div>
    {links.map((item: LinkInterface) => (
      <Link key={item.id} href={item.url}>
        {item?.children
          ? (<CascadingSubmenu title={item.text} popupId={item.text}>
            {item?.children && <RecursiveMenus links={item.children} />}
          </CascadingSubmenu>)
          : (<CascadingMenuItem>{item.text}</CascadingMenuItem>)
        }
      </Link>
    ))}
  </div>
);

const CascadingHoverMenus = ({ link }: MenuInterface) => {
  const popupState = usePopupState({ popupId: "demoMenu", variant: "popover" });
  return (
    <div>
      <Link key={link.id} href={link.url || ""} style={{ paddingLeft: 15, paddingRight: 15, paddingBottom: 8, fontSize:14 }} {...bindHover(popupState)} {...bindFocus(popupState)}>
        {link.text}
      </Link>
      {link?.children && <CascadingMenu popupState={popupState} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} id="stage-1">
        <RecursiveMenus links={link?.children} />
      </CascadingMenu>}
    </div>
  );
};

export default CascadingHoverMenus;
