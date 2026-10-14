"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Dialog, DialogActions, DialogContent, IconButton, InputBase, Stack, Typography, useMediaQuery } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Locale, PersonHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { mobileTheme } from "./mobileTheme";
import { getInitials } from "./util";

const tc = mobileTheme.colors;

export const PageHead = ({ title, lede, children, sx }: { title: React.ReactNode; lede?: React.ReactNode; children?: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Box sx={[{ px: { xs: "16px", md: 0 }, pt: { xs: "4px", md: 0 }, pb: { xs: "18px", md: "24px" } }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Typography component="h1" sx={{ fontSize: { xs: 28, md: 30 }, lineHeight: { xs: "34px", md: "36px" }, fontWeight: 650, letterSpacing: "-0.02em", color: tc.text, overflowWrap: "anywhere" }}>
      {title}
    </Typography>
    {lede && <Typography component="div" sx={{ mt: "4px", color: tc.textSecondary, fontSize: 15, lineHeight: "22px" }}>{lede}</Typography>}
    {children && <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: "8px", mt: "16px", alignItems: "center" }}>{children}</Stack>}
  </Box>
);

export const Plate = ({ children, sx, className, ...rest }: { children: React.ReactNode; sx?: SxProps<Theme> } & Omit<React.HTMLAttributes<HTMLDivElement>, "color">) => (
  <Box
    {...rest}
    className={className ? `kit-plate ${className}` : "kit-plate"}
    sx={[
      {
        bgcolor: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: "10px",
        mx: { xs: "12px", md: 0 },
        "& > section + section, & > .plate-sec + .plate-sec": { borderTop: `1px solid ${tc.border}` }
      }, ...(Array.isArray(sx) ? sx : [sx])
    ]}
  >
    {children}
  </Box>
);

export const Eyebrow = ({ children, component = "h2", id }: { children: React.ReactNode; component?: React.ElementType; id?: string }) => (
  <Typography component={component} id={id} sx={{ fontSize: 12, lineHeight: "18px", fontWeight: 650, letterSpacing: "0.07em", textTransform: "uppercase", color: tc.eyebrow, m: 0 }}>
    {children}
  </Typography>
);

type LinkTarget = { href?: string; onClick?: (e: React.MouseEvent) => void };

const linkSx = (danger?: boolean): SxProps<Theme> => ({
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
  color: danger ? tc.error : tc.link,
  textDecoration: "none",
  background: "none",
  border: 0,
  p: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  fontFamily: "inherit",
  "&:hover": { textDecoration: "underline" },
  "&:focus-visible": { outline: `2px solid ${tc.primary}`, outlineOffset: 2, borderRadius: "2px" },
  "&:disabled": { color: tc.disabled, cursor: "default", textDecoration: "none" }
});

export const TextLink = ({ href, onClick, children, danger, disabled, sx, ...rest }: LinkTarget & { children: React.ReactNode; danger?: boolean; disabled?: boolean; sx?: SxProps<Theme> } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick" | "color">) => {
  const style = [linkSx(danger), ...(Array.isArray(sx) ? sx : [sx])];
  if (href && !disabled) {
    const external = /^https?:/.test(href);
    return external
      ? <Box component="a" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} sx={style} {...rest}>{children}</Box>
      : <Box component={Link} href={href} onClick={onClick} sx={style} {...rest}>{children}</Box>;
  }
  return <Box component="button" type="button" onClick={onClick} disabled={disabled} sx={style} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</Box>;
};

export const PlateSection = ({ title, action, children, sx, id }: { title?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode; sx?: SxProps<Theme>; id?: string }) => {
  const autoId = React.useId();
  const headingId = id ? `${id}-h` : autoId;
  return (
    <Box component="section" id={id} aria-labelledby={title ? headingId : undefined} className="plate-sec" sx={[{ px: { xs: "16px", md: "24px" }, py: { xs: "18px", md: "22px" } }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {(title || action) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", mb: "10px", minHeight: 22 }}>
          {title ? <Eyebrow id={headingId}>{title}</Eyebrow> : <span />}
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
};

export const BackVerb = ({ label, href, onClick }: LinkTarget & { label: React.ReactNode }) => (
  <Box sx={{ px: { xs: "16px", md: 0 }, pb: "12px" }}>
    <TextLink href={href} onClick={onClick}><ArrowBackIcon sx={{ fontSize: 18 }} />{label}</TextLink>
  </Box>
);

// One `?view=` slice per record: the plate is the default view, "All …" links open a slice, BackVerb clears it.
export const useSliceView = (param = "view") => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams?.get(param) || "";
  const setView = React.useCallback((next: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (next) params.set(param, next); else params.delete(param);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname || "/mobile/dashboard", { scroll: true });
  }, [router, pathname, searchParams, param]);
  return [view, setView] as const;
};

export const Row = ({ href, onClick, leading, title, subtitle, trailing, chevron, sx, ...rest }: LinkTarget & {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  sx?: SxProps<Theme>;
} & Omit<React.HTMLAttributes<HTMLElement>, "title" | "onClick" | "color">) => {
  const interactive = !!(href || onClick);
  const style: SxProps<Theme> = [
    {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      minHeight: 56,
      py: "8px",
      textDecoration: "none",
      color: "inherit",
      width: "100%",
      textAlign: "left",
      background: "none",
      border: 0,
      px: 0,
      font: "inherit",
      cursor: interactive ? "pointer" : "default",
      "& + &": { borderTop: `1px solid ${tc.border}` },
      "&:focus-visible": { outline: `2px solid ${tc.primary}`, outlineOffset: -2 }
    }, ...(Array.isArray(sx) ? sx : [sx])
  ];
  const body = (
    <>
      {leading}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="span" sx={{ display: "block", fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, overflowWrap: "anywhere" }}>{title}</Typography>
        {subtitle && <Typography component="span" sx={{ display: "block", fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{subtitle}</Typography>}
      </Box>
      {trailing}
      {chevron && <ChevronRightIcon sx={{ color: tc.textSecondary, fontSize: 20, flex: "none" }} />}
    </>
  );
  if (href) return <Box component={Link} href={href} onClick={onClick} className="kit-row" sx={style} {...rest}>{body}</Box>;
  if (onClick) return <Box component="button" type="button" onClick={onClick} className="kit-row" sx={style} {...rest}>{body}</Box>;
  return <Box className="kit-row" sx={style} {...rest}>{body}</Box>;
};

export const RowList = ({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Box sx={[{ display: "flex", flexDirection: "column", "& > .kit-row + .kit-row": { borderTop: `1px solid ${tc.border}` } }, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Box>
);

export type BadgeTone = "ok" | "warn" | "bad" | "neu" | "pri";

const toneColors: Record<BadgeTone, [string, string]> = {
  ok: [tc.successBg, tc.success],
  warn: [tc.warningBg, tc.warning],
  bad: [tc.errorBg, tc.error],
  neu: [tc.neutralBg, tc.neutral],
  pri: [tc.chip, tc.onChip]
};

export const StatusBadge = ({ tone = "neu", dot, children }: { tone?: BadgeTone; dot?: boolean; children: React.ReactNode }) => (
  <Box component="span" sx={{
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: 24,
    px: "10px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flex: "none",
    bgcolor: toneColors[tone][0],
    color: toneColors[tone][1],
    "&::before": dot ? { content: "\"\"", width: 7, height: 7, borderRadius: "50%", bgcolor: "currentColor" } : undefined
  }}>
    {children}
  </Box>
);

// Chips carry their qualifier inside the pill: <Pill qualifier="Leader">Prayer Team</Pill>.
export const Pill = ({ children, qualifier, href, onClick }: LinkTarget & { children: React.ReactNode; qualifier?: React.ReactNode }) => {
  const sx: SxProps<Theme> = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: 32,
    px: "12px",
    borderRadius: 999,
    bgcolor: tc.chip,
    color: tc.onChip,
    fontSize: 13.5,
    fontWeight: 500,
    whiteSpace: "nowrap",
    textDecoration: "none",
    border: 0,
    fontFamily: "inherit",
    cursor: href || onClick ? "pointer" : "default"
  };
  const body = <>{children}{qualifier && <Box component="span" sx={{ opacity: 0.75, fontWeight: 400 }}>{qualifier}</Box>}</>;
  if (href) return <Box component={Link} href={href} onClick={onClick} sx={sx}>{body}</Box>;
  if (onClick) return <Box component="button" type="button" onClick={onClick} sx={sx}>{body}</Box>;
  return <Box component="span" sx={sx}>{body}</Box>;
};

export const PillRow = ({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Box sx={[{ display: "flex", flexWrap: "wrap", gap: "8px" }, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Box>
);

// Filter pills (years, series, categories). Scrolls sideways on phone instead of wrapping.
export function FilterPills<T extends string | number>({ options, value, onChange, label }: { options: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <Box role="group" aria-label={label} sx={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Box
            key={String(o.value)}
            component="button"
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            sx={{
              height: 34,
              px: "14px",
              borderRadius: 999,
              border: `1px solid ${on ? "transparent" : tc.control}`,
              bgcolor: on ? tc.selected : "transparent",
              color: on ? tc.onSelected : tc.text,
              fontSize: 14,
              fontWeight: on ? 600 : 500,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flex: "none",
              cursor: "pointer"
            }}
          >
            {o.label}
          </Box>
        );
      })}
    </Box>
  );
}

// Mutually exclusive views of the same data (list/calendar, upcoming/past).
export function ViewToggle<T extends string>({ options, value, onChange, label }: { options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <Box role="group" aria-label={label} sx={{ display: "inline-flex", border: `1px solid ${tc.control}`, borderRadius: "6px", overflow: "hidden", flex: "none" }}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Box
            key={o.value}
            component="button"
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            sx={{
              height: 34,
              px: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: 13.5,
              fontWeight: on ? 600 : 500,
              fontFamily: "inherit",
              border: 0,
              borderLeft: i ? `1px solid ${tc.control}` : 0,
              bgcolor: on ? tc.selected : "transparent",
              color: on ? tc.onSelected : tc.textSecondary,
              cursor: "pointer",
              "& svg": { fontSize: 18 }
            }}
          >
            {o.icon}{o.label}
          </Box>
        );
      })}
    </Box>
  );
}

export const QuietEmpty = ({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Typography sx={[{ color: tc.textSecondary, fontSize: 15, lineHeight: "22px" }, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Typography>
);

// A dead artwork URL falls back to the deep brand panel instead of the browser's broken-image glyph.
export const hideBrokenImage = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.visibility = "hidden"; };

export const Thumb = ({ src, alt = "", width = 96, height = 54, children }: { src?: string | null; alt?: string; width?: number | string; height?: number | string; children?: React.ReactNode }) => (
  <Box sx={{ width, height, flex: "none", borderRadius: "6px", bgcolor: tc.primaryDeep, overflow: "hidden", position: "relative" }}>
    {src && <Box component="img" src={src} alt={alt} loading="lazy" onError={hideBrokenImage} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
    {children}
  </Box>
);

export const KeyValues = ({ items }: { items: { label: React.ReactNode; value: React.ReactNode }[] }) => (
  <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 16px", fontSize: 15, m: 0 }}>
    {items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "").map((i, idx) => (
      <React.Fragment key={idx}>
        <Box component="dt" sx={{ color: tc.textSecondary }}>{i.label}</Box>
        <Box component="dd" sx={{ m: 0, minWidth: 0, overflowWrap: "anywhere" }}>{i.value}</Box>
      </React.Fragment>
    ))}
  </Box>
);

export const BigNumber = ({ children, caption }: { children: React.ReactNode; caption?: React.ReactNode }) => (
  <Box>
    <Typography sx={{ fontSize: 34, lineHeight: "40px", fontWeight: 650, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: tc.text }}>{children}</Typography>
    {caption && <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{caption}</Typography>}
  </Box>
);

// Short edits: bottom sheet on phone, centered dialog on desktop.
export const Sheet = ({ open, onClose, title, children, actions, maxWidth = "sm" }: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md";
}) => {
  const phone = useMediaQuery("(max-width:599.95px)");
  const titleId = React.useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby={titleId}
      sx={phone ? { "& .MuiDialog-container": { alignItems: "flex-end" } } : undefined}
      slotProps={{
        paper: {
          sx: {
            bgcolor: tc.surface,
            backgroundImage: "none",
            borderRadius: phone ? "16px 16px 0 0" : "10px",
            m: phone ? 0 : 4,
            width: phone ? "100%" : undefined,
            maxWidth: phone ? "100%" : undefined,
            maxHeight: phone ? "92vh" : undefined,
            pb: phone ? mobileTheme.safe.bottom : 0
          }
        }
      }}
    >
      {phone && <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: tc.border, mx: "auto", mt: "8px" }} />}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: "20px", pt: phone ? "8px" : "18px", pb: "4px" }}>
        <Typography id={titleId} component="h2" sx={{ flex: 1, fontSize: 18, lineHeight: "24px", fontWeight: 650, color: tc.text }}>{title}</Typography>
        <IconButton onClick={onClose} aria-label={Locale.label("common.close")} sx={{ color: tc.textSecondary, mr: "-8px" }}><CloseIcon /></IconButton>
      </Box>
      <DialogContent sx={{ px: "20px", pt: "8px" }}>{children}</DialogContent>
      {actions && <DialogActions sx={{ px: "20px", pb: "18px", pt: 0, gap: "8px", "& > :not(style) ~ :not(style)": { ml: 0 } }}>{actions}</DialogActions>}
    </Dialog>
  );
};

// Desktop record layout (B1Admin): identity column | plate. Stacks on phone.
export const RecordLayout = ({ identity, children }: { identity: React.ReactNode; children: React.ReactNode }) => (
  <Box sx={{
    display: { xs: "block", md: "grid" },
    gridTemplateColumns: { md: "304px 1fr" },
    bgcolor: { md: tc.surface },
    border: { md: `1px solid ${tc.border}` },
    borderRadius: { md: "10px" }
  }}>
    <Box sx={{ p: { md: "24px" }, borderRight: { md: `1px solid ${tc.border}` }, minWidth: 0 }}>{identity}</Box>
    <Box sx={{
      minWidth: 0,
      "& > .kit-plate": { border: { md: 0 }, borderRadius: { md: 0 }, bgcolor: { md: "transparent" }, mx: { md: 0 } },
      "& > .kit-plate > section": { px: { md: "32px" } }
    }}>
      {children}
    </Box>
  </Box>
);

export const personPhoto = (p?: PersonInterface | null): string => {
  if (!p) return "";
  try {
    return PersonHelper.getPhotoUrl(p) || "";
  } catch {
    return (p as { photo?: string }).photo || "";
  }
};

export const PersonAvatar = ({ person, name, src, size = 40 }: { person?: PersonInterface | null; name?: string; src?: string | null; size?: number }) => {
  const photo = src ?? personPhoto(person);
  const [failed, setFailed] = React.useState(false);
  return (
    <Box sx={{ width: size, height: size, flex: "none", borderRadius: size >= 64 ? "14px" : "10px", bgcolor: tc.chip, color: tc.onChip, display: "grid", placeItems: "center", fontWeight: 600, fontSize: Math.round(size * 0.36), overflow: "hidden" }}>
      {photo && !failed
        ? <Box component="img" src={photo} alt="" loading="lazy" onError={() => setFailed(true)} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        : getInitials(person || name || "")}
    </Box>
  );
};

export const SearchField = ({ value, onChange, label, placeholder = label, onEnter, height = 52, testId, sx }: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  testId?: string;
  onEnter?: () => void;
  height?: number;
  sx?: SxProps<Theme>;
}) => (
  <Box sx={[{ height, borderRadius: height >= 52 ? "12px" : "8px", border: `1px solid ${tc.control}`, bgcolor: tc.background, display: "flex", alignItems: "center", gap: "10px", pl: "14px", pr: "6px", "&:focus-within": { outline: `2px solid ${tc.primary}`, outlineOffset: -1 } }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <SearchIcon sx={{ color: tc.textSecondary, fontSize: 22 }} />
    <InputBase
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onEnter ? (e) => { if (e.key === "Enter") onEnter(); } : undefined}
      placeholder={placeholder}
      inputProps={{ "aria-label": label, enterKeyHint: "search", "data-testid": testId }}
      sx={{ fontSize: 16, color: tc.text }}
    />
    {value && (
      <IconButton size="small" onClick={() => onChange("")} aria-label={Locale.label("mobile.screens.clear")} sx={{ color: tc.textSecondary }}>
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
    )}
  </Box>
);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const Highlight = ({ text, term }: { text: string; term: string }) => {
  const needle = term.trim();
  if (!needle) return <>{text}</>;
  return <>{text.split(new RegExp(`(${escapeRegExp(needle)})`, "gi")).map((part, i) => (part.toLowerCase() === needle.toLowerCase() ? <b key={i} style={{ fontWeight: 700 }}>{part}</b> : <React.Fragment key={i}>{part}</React.Fragment>))}</>;
};
