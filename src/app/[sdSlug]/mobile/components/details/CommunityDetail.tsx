"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { KeyValues, PageHead, PersonAvatar, Plate, PlateSection, QuietEmpty, RecordLayout, Row, RowList, TextLink } from "../kit";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface HouseholdMember extends PersonInterface {
  householdRole?: string;
}

interface PersonWithPrivacy extends PersonInterface {
  optedOut?: boolean;
  allowDirectMessages?: boolean;
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
    enabled: !!householdId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const person: PersonWithPrivacy | null | undefined = personLoading ? undefined : (personData ?? null);

  const currentPersonId = UserHelper.person?.id;
  const isOwnProfile = !!currentPersonId && currentPersonId === person?.id;

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

  const mapsHref = addressLine1
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addressLine1}, ${city || ""} ${state || ""} ${zip || ""}`.replace(/\s+/g, " ").trim())}`
    : "";

  const handleMessage = () => {
    if (!person?.id) return;
    router.push(`/mobile/messages/${person.id}`);
  };

  const name = person?.name?.display || Locale.label("mobile.components.unknown");

  const identity = (showActions: boolean) => (
    <Box sx={{ px: { xs: "16px", md: 0 }, pt: { xs: "4px", md: 0 }, pb: { xs: "18px", md: 0 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flexDirection: { md: "column" }, textAlign: { md: "center" } }}>
        <PersonAvatar person={person} name={name} size={72} />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: { xs: 26, md: 24 }, lineHeight: { xs: "32px", md: "30px" }, fontWeight: 650, letterSpacing: "-0.02em", color: tc.text, overflowWrap: "anywhere" }}>
            {name}
          </Typography>
          <Typography sx={{ mt: "2px", color: tc.textSecondary, fontSize: 15, lineHeight: "22px" }}>
            {(person as any)?.membershipStatus || Locale.label("mobile.details.churchMember")}
          </Typography>
        </Box>
      </Box>
      {showActions && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mt: "16px", justifyContent: { md: "center" } }}>
          {person?.allowDirectMessages !== false && (
            <Button variant="contained" onClick={handleMessage} aria-label={Locale.label("mobile.details.sendMessage")}>
              {Locale.label("mobile.details.message")}
            </Button>
          )}
          {primaryPhone && <Button variant="outlined" href={`tel:${primaryPhone}`}>{Locale.label("mobile.details.call")}</Button>}
          {phone && <Button variant="outlined" href={`sms:${phone}`} aria-label={Locale.label("mobile.details.sendText")}>{Locale.label("mobile.details.text")}</Button>}
          {isOwnProfile && <Button variant="outlined" onClick={() => router.push("/mobile/profileEdit")}>{Locale.label("mobile.details.editProfile")}</Button>}
        </Box>
      )}
    </Box>
  );

  const contactItems = [
    { label: Locale.label("mobile.details.email"), value: email ? <TextLink href={`mailto:${email}`} sx={{ fontWeight: 400, fontSize: 15, whiteSpace: "normal", overflowWrap: "anywhere" }}>{email}</TextLink> : null },
    { label: Locale.label(phone ? "mobile.details.mobilePhone" : "mobile.details.phoneNumber"), value: primaryPhone || null },
    {
      label: Locale.label("mobile.details.address"),
      value: hasAddress
        ? (
          <Box
            component={mapsHref ? "a" : "span"}
            href={mapsHref || undefined}
            target={mapsHref ? "_blank" : undefined}
            rel={mapsHref ? "noopener noreferrer" : undefined}
            sx={{ color: "inherit", textDecoration: "none", "&:hover": { textDecoration: mapsHref ? "underline" : "none" } }}
          >
            {[addressLine1, addressLine2].filter(Boolean).join(", ")}
            {(addressLine1 || addressLine2) && <br />}
            {[city, state, zip].filter(Boolean).join(", ")}
          </Box>
        )
        : null
    }
  ].filter((i) => i.value);

  const others = (household || []).filter((h) => h.id !== person?.id);

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: "16px", px: { xs: "16px", md: 0 } }}>
      <Skeleton variant="rounded" width={72} height={72} sx={{ borderRadius: "14px" }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={32} />
        <Skeleton variant="text" width="30%" height={18} />
      </Box>
    </Box>
  );

  if (person === undefined) return renderSkeleton();

  if (person === null) {
    return (
      <PageHead title={Locale.label("mobile.details.personNotFound")} lede={Locale.label("mobile.details.personNotFoundDescription")}>
        <Button variant="outlined" onClick={() => router.push("/mobile/community")}>{Locale.label("mobile.details.backToCommunity")}</Button>
      </PageHead>
    );
  }

  const isPrivate = !!person.optedOut;

  return (
    <RecordLayout identity={identity(!isPrivate)}>
      <Plate>
        {(isPrivate || (contactItems.length === 0 && others.length === 0)) && (
          <PlateSection><QuietEmpty>{Locale.label("mobile.details.contactInfoNotAvailable")}</QuietEmpty></PlateSection>
        )}
        {!isPrivate && contactItems.length > 0 && (
          <PlateSection title={Locale.label("mobile.details.contactInformation")}>
            <KeyValues items={contactItems} />
          </PlateSection>
        )}
        {!isPrivate && others.length > 0 && (
          <PlateSection title={Locale.label("mobile.details.householdMembers")}>
            <RowList>
              {others.map((h) => (
                <Row
                  key={h.id}
                  href={`/mobile/community/${h.id}`}
                  leading={<PersonAvatar person={h} />}
                  title={h.name?.display || Locale.label("mobile.components.unknown")}
                  subtitle={h.householdRole || Locale.label("mobile.details.householdMember")}
                  chevron
                />
              ))}
            </RowList>
          </PlateSection>
        )}
      </Plate>
    </RecordLayout>
  );
};

export default CommunityDetail;
