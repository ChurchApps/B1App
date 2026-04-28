"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Icon,
  Skeleton,
  Typography
} from "@mui/material";
import { ApiHelper, Locale, PersonHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { getInitials } from "../util";

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

export const CommunityDetail = ({ id, config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();

  const { data: personData, isLoading: personLoading } = useQuery<PersonWithPrivacy | null>({
    queryKey: ["community-person", id],
    queryFn: async () => {
      const data = await ApiHelper.get(`/people/${id}`, "MembershipApi");
      return data || null;
    },
    enabled: !!id
  });

  const householdId = personData?.householdId;
  const { data: household = null } = useQuery<HouseholdMember[]>({
    queryKey: ["community-household", householdId],
    queryFn: async () => {
      const hh = await ApiHelper.get(`/people/household/${householdId}`, "MembershipApi");
      return Array.isArray(hh) ? hh : [];
    },
    enabled: !!householdId
  });

  const person: PersonWithPrivacy | null | undefined = personLoading ? undefined : (personData ?? null);

  const currentPersonId = UserHelper.person?.id;
  const isOwnProfile = !!currentPersonId && currentPersonId === person?.id;

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
          textAlign: "center"
        }}
      >
        {photo ? (
          <Box
            component="img"
            src={photo}
            alt={person?.name?.display || Locale.label("mobile.components.member")}
            sx={{
              width: 120,
              height: 120,
              borderRadius: "60px",
              objectFit: "cover",
              border: "4px solid rgba(255,255,255,0.3)",
              mb: `${mobileTheme.spacing.md}px`
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
              mb: `${mobileTheme.spacing.md}px`
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
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}
        >
          {person?.name?.display || Locale.label("mobile.components.unknown")}
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            mt: "4px",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}
        >
          {(person as any)?.membershipStatus || Locale.label("mobile.details.churchMember")}
        </Typography>
      </Box>
    );
  };

  const QuickAction = ({
    icon,
    label,
    onClick,
    ariaLabel,
    background
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
        minWidth: 72
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
          boxShadow: mobileTheme.shadows.md
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
          label={Locale.label("mobile.details.edit")}
          ariaLabel={Locale.label("mobile.details.editProfile")}
          background="#4CAF50"
          onClick={() => router.push("/mobile/profileEdit")}
        />
      );
    }
    actions.push(
      <QuickAction
        key="msg"
        icon="message"
        label={Locale.label("mobile.details.message")}
        ariaLabel={Locale.label("mobile.details.sendMessage")}
        onClick={handleMessage}
      />
    );
    if (primaryPhone) {
      actions.push(
        <QuickAction
          key="call"
          icon="phone"
          label={Locale.label("mobile.details.call")}
          ariaLabel={Locale.label("mobile.details.call")}
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
          label={Locale.label("mobile.details.email")}
          ariaLabel={Locale.label("mobile.details.sendEmail")}
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
          flexWrap: "wrap"
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
    subValue
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
        bgcolor: tc.surface,
        borderRadius: "16px",
        boxShadow: mobileTheme.shadows.sm,
        px: "16px",
        py: "16px",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: mobileTheme.shadows.md } : undefined
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "24px",
          bgcolor: tc.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mr: "16px"
        }}
      >
        <Icon sx={{ fontSize: 24, color: tc.primary }}>{icon}</Icon>
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
            whiteSpace: "pre-wrap"
          }}
        >
          {value}
        </Typography>
        {subValue && (
          <Typography sx={{ fontSize: 14, color: tc.textSecondary, mt: "2px" }}>{subValue}</Typography>
        )}
      </Box>
      {onClick && <Icon sx={{ color: tc.textSecondary, fontSize: 24 }}>chevron_right</Icon>}
    </Box>
  );

  const renderDetailsSection = () => {
    const rows: React.ReactNode[] = [];
    if (email) {
      rows.push(
        <ContactRow
          key="email"
          icon="email"
          label={Locale.label("mobile.details.emailAddress")}
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
          label={phone ? Locale.label("mobile.details.mobilePhone") : Locale.label("mobile.details.phoneNumber")}
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
          label={Locale.label("mobile.details.address")}
          value={line1 || city || ""}
          subValue={line2 || undefined}
          onClick={addressLine1 ? openAddress : undefined}
        />
      );
    }
    if (rows.length === 0) return null;
    return (
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: "16px" }}>
          {Locale.label("mobile.details.contactInformation")}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rows}
        </Box>
      </Box>
    );
  };

  const renderHousehold = () => {
    const others = (household || []).filter((h) => h.id !== person?.id);
    if (others.length === 0) return null;
    const formatName = (display: string) => {
      const parts = display.trim().split(" ");
      if (parts.length > 1) {
        return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
      }
      return { firstName: display, lastName: "" };
    };
    return (
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: "16px" }}>
          {Locale.label("mobile.details.householdMembers")}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {others.map((h) => {
            const hphoto = getPhoto(h);
            const display = h.name?.display || Locale.label("mobile.components.unknown");
            const { firstName, lastName } = formatName(display);
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
                  bgcolor: tc.surface,
                  borderRadius: "12px",
                  boxShadow: mobileTheme.shadows.sm,
                  px: "16px",
                  py: "12px",
                  cursor: "pointer",
                  "&:hover": { boxShadow: mobileTheme.shadows.md }
                }}
              >
                {hphoto ? (
                  <Box
                    component="img"
                    src={hphoto}
                    alt={display}
                    sx={{ width: 48, height: 48, borderRadius: "24px", objectFit: "cover", flexShrink: 0, mr: "16px" }}
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
                      mr: "16px"
                    }}
                  >
                    {getInitials(h)}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline" }}>
                    <Typography
                      component="span"
                      sx={{ fontSize: 16, fontWeight: 600, color: tc.text, lineHeight: 1.3, mr: lastName ? "4px" : 0 }}
                    >
                      {firstName}
                    </Typography>
                    {lastName && (
                      <Typography
                        component="span"
                        sx={{ fontSize: 16, fontWeight: 800, color: tc.text, lineHeight: 1.3 }}
                      >
                        {lastName}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: tc.textSecondary, mt: "2px" }}>
                    {h.householdRole || Locale.label("mobile.details.householdMember")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "18px",
                    bgcolor: tc.iconBackground,
                    color: tc.textSecondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <Icon sx={{ fontSize: 20 }}>chevron_right</Icon>
                </Box>
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
          textAlign: "center"
        }}
      >
        <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
          {Locale.label("mobile.details.contactInfoNotAvailable")}
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
          alignItems: "center"
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
        textAlign: "center"
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
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>person_off</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        {Locale.label("mobile.details.personNotFound")}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        {Locale.label("mobile.details.personNotFoundDescription")}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => router.push("/mobile/community")}
        sx={{
          borderColor: tc.primary,
          color: tc.primary,
          textTransform: "none",
          fontWeight: 500,
          borderRadius: `${mobileTheme.radius.md}px`
        }}
      >
        {Locale.label("mobile.details.backToCommunity")}
      </Button>
    </Box>
  );

  const isPrivate = !!person?.optedOut;

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pb: "32px" }}>
      {person === undefined && (
        <Box sx={{ p: "16px" }}>{renderSkeleton()}</Box>
      )}
      {person === null && (
        <Box sx={{ p: "16px" }}>{renderNotFound()}</Box>
      )}
      {person && isPrivate && (
        <Box sx={{ p: "16px" }}>{renderPrivateProfile()}</Box>
      )}
      {person && !isPrivate && (() => {
        const details = renderDetailsSection();
        const householdSection = renderHousehold();
        return (
          <>
            <Box sx={{ px: "16px", pt: "16px" }}>
              {renderHero()}
            </Box>
            <Box sx={{ px: "16px", mt: "16px", mb: "24px" }}>
              {renderQuickActions()}
            </Box>
            {details && (
              <Box sx={{ px: "16px", mb: "24px" }}>
                {details}
              </Box>
            )}
            {householdSection && (
              <Box sx={{ px: "16px", mb: "24px" }}>
                {householdSection}
              </Box>
            )}
          </>
        );
      })()}
    </Box>
  );
};

export default CommunityDetail;
