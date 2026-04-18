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
import { ApiHelper, PersonHelper } from "@churchapps/apphelper";
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
  const addressLine1 = contact.address1 || "";
  const addressLine2 = contact.address2 || "";
  const city = contact.city || "";
  const state = contact.state || "";
  const zip = contact.zip || "";
  const hasAddress = !!(addressLine1 || city || state || zip);
  const formattedAddress = [
    [addressLine1, addressLine2].filter(Boolean).join(", "),
    [city, state, zip].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  const smsTarget = phone;

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
    const avatarSx = {
      width: 96,
      height: 96,
      borderRadius: "48px",
      flexShrink: 0,
      overflow: "hidden",
    } as const;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {photo ? (
          <Box component="img" src={photo} alt={person?.name?.display || "Member"} sx={{ ...avatarSx, objectFit: "cover" }} />
        ) : (
          <Box
            sx={{
              ...avatarSx,
              bgcolor: tc.primaryLight,
              color: tc.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 32,
            }}
          >
            {getInitials(person)}
          </Box>
        )}
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text, mt: `${mobileTheme.spacing.md}px` }}>
          {person?.name?.display || "Unknown"}
        </Typography>
        {(person as any)?.membershipStatus && (
          <Typography sx={{ fontSize: 14, color: tc.textSecondary, mt: "4px" }}>
            {(person as any).membershipStatus}
          </Typography>
        )}
      </Box>
    );
  };

  const ActionButton = ({
    icon,
    label,
    onClick,
    ariaLabel,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    ariaLabel: string;
  }) => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <IconButton
        aria-label={ariaLabel}
        onClick={onClick}
        sx={{
          width: 48,
          height: 48,
          bgcolor: tc.iconBackground,
          color: tc.primary,
          "&:hover": { bgcolor: tc.iconBackground },
        }}
      >
        <Icon sx={{ fontSize: 20 }}>{icon}</Icon>
      </IconButton>
      <Typography sx={{ fontSize: 12, color: tc.textSecondary, fontWeight: 500 }}>{label}</Typography>
    </Box>
  );

  const renderActions = () => {
    const actions: React.ReactNode[] = [];
    if (phone)
      actions.push(
        <ActionButton
          key="call"
          icon="phone"
          label="Call"
          ariaLabel="Call"
          onClick={() => {
            window.location.href = `tel:${phone}`;
          }}
        />
      );
    if (smsTarget)
      actions.push(
        <ActionButton
          key="text"
          icon="chat"
          label="Text"
          ariaLabel="Send SMS"
          onClick={() => {
            window.location.href = `sms:${smsTarget}`;
          }}
        />
      );
    if (email)
      actions.push(
        <ActionButton
          key="email"
          icon="email"
          label="Email"
          ariaLabel="Email"
          onClick={() => {
            window.location.href = `mailto:${email}`;
          }}
        />
      );
    if (actions.length === 0) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          justifyContent: "center",
          gap: `${mobileTheme.spacing.lg}px`,
        }}
      >
        {actions}
      </Box>
    );
  };

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: `${mobileTheme.spacing.md}px`, py: "10px" }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "20px",
          bgcolor: tc.iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 20, color: tc.primary }}>{icon}</Icon>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{label}</Typography>
        <Typography sx={{ fontSize: 14, color: tc.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );

  const renderDetailsCard = () => {
    const rows: React.ReactNode[] = [];
    if (email) rows.push(<DetailRow key="email" icon="email" label="Email" value={email} />);
    if (phone) rows.push(<DetailRow key="mobile" icon="phone_iphone" label="Mobile" value={phone} />);
    if (homePhone) rows.push(<DetailRow key="home" icon="phone" label="Home" value={homePhone} />);
    if (hasAddress) rows.push(<DetailRow key="addr" icon="place" label="Address" value={formattedAddress} />);
    if (rows.length === 0) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Typography
          sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}
        >
          Contact
        </Typography>
        {rows}
      </Box>
    );
  };

  const renderHousehold = () => {
    const others = (household || []).filter((h) => h.id !== person?.id);
    if (others.length === 0) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Typography
          sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}
        >
          Household
        </Typography>
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
                height: 48,
                px: "4px",
                borderRadius: `${mobileTheme.radius.md}px`,
                cursor: "pointer",
                "&:hover": { bgcolor: tc.iconBackground },
              }}
            >
              {hphoto ? (
                <Box
                  component="img"
                  src={hphoto}
                  alt={h.name?.display || "Member"}
                  sx={{ width: 40, height: 40, borderRadius: "20px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "20px",
                    bgcolor: tc.primaryLight,
                    color: tc.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(h)}
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tc.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.name?.display || "Unknown"}
                </Typography>
                {h.householdRole && (
                  <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{h.householdRole}</Typography>
                )}
              </Box>
              <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
            </Box>
          );
        })}
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
          borderRadius: `${mobileTheme.radius.lg}px`,
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Skeleton variant="circular" width={96} height={96} />
        <Skeleton variant="text" width="40%" height={28} sx={{ mt: `${mobileTheme.spacing.md}px` }} />
        <Skeleton variant="text" width="30%" height={18} />
      </Box>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Skeleton variant="text" width="20%" height={24} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="50%" />
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {renderHero()}
          {renderActions()}
          {renderDetailsCard()}
          {renderHousehold()}
        </Box>
      )}
    </Box>
  );
};

export default CommunityDetail;
