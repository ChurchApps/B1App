"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Icon,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { ApiHelper, PersonHelper, UserHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface HouseholdMember extends PersonInterface {
  householdRole?: string;
}

interface PersonWithPrivacy extends PersonInterface {
  optedOut?: boolean;
}

export const CommunityDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [person, setPerson] = React.useState<PersonWithPrivacy | null | undefined>(undefined);
  const [household, setHousehold] = React.useState<HouseholdMember[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setPerson(undefined);
    setHousehold(null);

    ApiHelper.get(`/people/${id}`, "MembershipApi")
      .then((data: PersonWithPrivacy) => {
        if (cancelled) return;
        setPerson(data || null);
        if (data?.householdId) {
          ApiHelper.get(`/people/household/${data.householdId}`, "MembershipApi")
            .then((hh: HouseholdMember[]) => {
              if (!cancelled) setHousehold(Array.isArray(hh) ? hh : []);
            })
            .catch(() => {
              if (!cancelled) setHousehold([]);
            });
        } else {
          setHousehold([]);
        }
      })
      .catch(() => {
        if (!cancelled) setPerson(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentPersonId = UserHelper.person?.id;
  const isOwnProfile = !!currentPersonId && currentPersonId === person?.id;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/mobile/community");
  };

  const getInitials = (p?: PersonInterface | null) => {
    if (!p) return "?";
    const f = (p.name?.first || "").trim().charAt(0).toUpperCase();
    const l = (p.name?.last || "").trim().charAt(0).toUpperCase();
    return (f + l).trim() || (p.name?.display || "?").charAt(0).toUpperCase();
  };

  const getPhoto = (p?: PersonInterface | null): string => {
    if (!p) return "";
    try {
      return PersonHelper.getPhotoUrl(p) || "";
    } catch {
      return (p as any).photo || "";
    }
  };

  const contact = (person as any)?.contactInfo || {};
  const phone: string = contact.mobilePhone || "";
  const homePhone: string = contact.homePhone || "";
  const email: string = contact.email || "";
  const primaryPhone = phone || homePhone;
  const addressLine1 = contact.address1 || "";
  const addressLine2 = contact.address2 || "";
  const city = contact.city || "";
  const state = contact.state || "";
  const zip = contact.zip || "";
  const hasAddress = !!(addressLine1 || city || state || zip);

  const openAddress = () => {
    if (!addressLine1) return;
    const q = encodeURIComponent(
      `${addressLine1}, ${city || ""} ${state || ""} ${zip || ""}`.replace(/\s+/g, " ").trim()
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener,noreferrer");
  };

  const handleMessage = () => {
    if (!person?.id) return;
    router.push(`/mobile/messages/${person.id}`);
  };

  const renderBack = () => (
    <IconButton
      aria-label="Back"
      onClick={handleBack}
      sx={{
        width: 40,
        height: 40,
        bgcolor: tc.surface,
        color: tc.text,
        boxShadow: mobileTheme.shadows.sm,
        mb: `${mobileTheme.spacing.md}px`,
        "&:hover": { bgcolor: tc.surface },
      }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const renderHero = () => {
    const photo = getPhoto(person);
    return (
      <Box
        sx={{
          position: "relative",
          borderRadius: `${mobileTheme.radius.xl}px`,
          overflow: "hidden",
          boxShadow: mobileTheme.shadows.md,
          background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
          p: `${mobileTheme.spacing.lg}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {photo ? (
          <Box
            component="img"
            src={photo}
            alt={person?.name?.display || "Member"}
            sx={{
              width: 120,
              height: 120,
              borderRadius: "60px",
              objectFit: "cover",
              border: "4px solid rgba(255,255,255,0.3)",
              mb: `${mobileTheme.spacing.md}px`,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "60px",
              bgcolor: "rgba(255,255,255,0.2)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 44,
              border: "4px solid rgba(255,255,255,0.3)",
              mb: `${mobileTheme.spacing.md}px`,
            }}
          >
            {getInitials(person)}
          </Box>
        )}
        <Typography
          sx={{
            fontSize: 26,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.2,
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {person?.name?.display || "Unknown"}
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            mt: "4px",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {(person as any)?.membershipStatus || "Church Member"}
        </Typography>
      </Box>
    );
  };

  const QuickAction = ({
    icon,
    label,
    onClick,
    ariaLabel,
    background,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    ariaLabel: string;
    background?: string;
  }) => (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        minWidth: 72,
      }}
      aria-label={ariaLabel}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "28px",
          bgcolor: background || tc.primary,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: mobileTheme.shadows.md,
        }}
      >
        <Icon sx={{ fontSize: 24 }}>{icon}</Icon>
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.text }}>{label}</Typography>
    </Box>
  );

  const renderQuickActions = () => {
    const actions: React.ReactNode[] = [];
    if (isOwnProfile) {
      actions.push(
        <QuickAction
          key="edit"
          icon="edit"
          label="Edit"
          ariaLabel="Edit profile"
          background="#4CAF50"
          onClick={() => router.push("/mobile/profileEdit")}
        />
      );
    } else {
      actions.push(
        <QuickAction
          key="msg"
          icon="message"
          label="Message"
          ariaLabel="Send message"
          onClick={handleMessage}
        />
      );
    }
    if (primaryPhone) {
      actions.push(
        <QuickAction
          key="call"
          icon="phone"
          label="Call"
          ariaLabel="Call"
          onClick={() => {
            window.location.href = `tel:${primaryPhone}`;
          }}
        />
      );
    }
    if (email) {
      actions.push(
        <QuickAction
          key="email"
          icon="email"
          label="Email"
          ariaLabel="Send email"
          onClick={() => {
            window.location.href = `mailto:${email}`;
          }}
        />
      );
    }
    if (actions.length === 0) return null;
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: `${mobileTheme.spacing.md}px`,
          flexWrap: "wrap",
        }}
      >
        {actions}
      </Box>
    );
  };

  const ContactRow = ({
    icon,
    label,
    value,
    onClick,
    subValue,
  }: {
    icon: string;
    label: string;
    value: string;
    onClick?: () => void;
    subValue?: string;
  }) => (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: mobileTheme.shadows.md } : undefined,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "24px",
          bgcolor: tc.iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 22, color: tc.primary }}>{icon}</Icon>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: tc.textSecondary, mb: "2px" }}>
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: tc.text,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {value}
        </Typography>
        {subValue && (
          <Typography sx={{ fontSize: 13, color: tc.textSecondary, mt: "2px" }}>{subValue}</Typography>
        )}
      </Box>
      {onClick && <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>}
    </Box>
  );

  const renderDetailsSection = () => {
    const rows: React.ReactNode[] = [];
    if (email) {
      rows.push(
        <ContactRow
          key="email"
          icon="email"
          label="Email Address"
          value={email}
          onClick={() => {
            window.location.href = `mailto:${email}`;
          }}
        />
      );
    }
    if (primaryPhone) {
      rows.push(
        <ContactRow
          key="phone"
          icon="phone"
          label={phone ? "Mobile Phone" : "Phone Number"}
          value={primaryPhone}
          onClick={() => {
            window.location.href = `tel:${primaryPhone}`;
          }}
        />
      );
    }
    if (hasAddress) {
      const line1 = [addressLine1, addressLine2].filter(Boolean).join(", ");
      const line2 = [city, state, zip].filter(Boolean).join(", ");
      rows.push(
        <ContactRow
          key="address"
          icon="location_on"
          label="Address"
          value={line1 || city || ""}
          subValue={line2 || undefined}
          onClick={addressLine1 ? openAddress : undefined}
        />
      );
    }
    if (rows.length === 0) return null;
    return (
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          Contact Information
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {rows}
        </Box>
      </Box>
    );
  };

  const renderHousehold = () => {
    const others = (household || []).filter((h) => h.id !== person?.id);
    if (others.length === 0) return null;
    return (
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          Household Members
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {others.map((h) => {
            const hphoto = getPhoto(h);
            return (
              <Box
                key={h.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/mobile/community/${h.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/mobile/community/${h.id}`);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${mobileTheme.spacing.md}px`,
                  bgcolor: tc.surface,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  boxShadow: mobileTheme.shadows.sm,
                  p: `${mobileTheme.spacing.md}px`,
                  cursor: "pointer",
                  "&:hover": { boxShadow: mobileTheme.shadows.md },
                }}
              >
                {hphoto ? (
                  <Box
                    component="img"
                    src={hphoto}
                    alt={h.name?.display || "Member"}
                    sx={{ width: 48, height: 48, borderRadius: "24px", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "24px",
                      bgcolor: tc.primaryLight,
                      color: tc.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(h)}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                    {h.name?.display || "Unknown"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>
                    {h.householdRole || "Household Member"}
                  </Typography>
                </Box>
                <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderPrivateProfile = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      {renderHero()}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
          Contact info not available
        </Typography>
      </Box>
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          p: `${mobileTheme.spacing.lg}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Skeleton variant="circular" width={120} height={120} />
        <Skeleton variant="text" width="50%" height={32} sx={{ mt: `${mobileTheme.spacing.md}px` }} />
        <Skeleton variant="text" width="35%" height={18} />
      </Box>
    </Box>
  );

  const renderNotFound = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>person_off</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        Person Not Found
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        This profile could not be found.
      </Typography>
      <Button
        variant="outlined"
        onClick={() => router.push("/mobile/community")}
        sx={{
          borderColor: tc.primary,
          color: tc.primary,
          textTransform: "none",
          fontWeight: 500,
          borderRadius: `${mobileTheme.radius.md}px`,
        }}
      >
        Back to Community
      </Button>
    </Box>
  );

  const isPrivate = !!person?.optedOut;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      {person === undefined && renderSkeleton()}
      {person === null && renderNotFound()}
      {person && isPrivate && renderPrivateProfile()}
      {person && !isPrivate && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.lg}px` }}>
          {renderHero()}
          {renderQuickActions()}
          {renderDetailsSection()}
          {renderHousehold()}
        </Box>
      )}
    </Box>
  );
};

export default CommunityDetail;
