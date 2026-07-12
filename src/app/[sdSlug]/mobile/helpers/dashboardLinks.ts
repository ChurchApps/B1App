import { type LinkInterface } from "@churchapps/helpers";

// Dashboard shows hero + 2 featured (church-configured order) and an Explore grid
// (engagement-sorted); everything past HOME_TABS_COUNT lives on the More page.
// Both pages must partition the same way or links appear twice or not at all.
export const HOME_TABS_COUNT = 7;
export const FEATURED_COUNT = 3;

export const hasVotdLink = (links: LinkInterface[]): boolean => links.some((l) => l.linkType === "votd");

// The verse card is the VOTD entry point, so the votd link never also gets a card.
export const dashboardBaseLinks = (links: LinkInterface[]): LinkInterface[] =>
  links.filter((l) => l.linkType !== "votd");

export const splitExplore = (sortedRest: LinkInterface[]) => {
  const exploreSlots = HOME_TABS_COUNT - FEATURED_COUNT;
  const showMore = sortedRest.length > exploreSlots + 1;
  return {
    explore: showMore ? sortedRest.slice(0, exploreSlots) : sortedRest,
    overflow: showMore ? sortedRest.slice(exploreSlots) : [],
    showMore
  };
};
