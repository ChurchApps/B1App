import type { ElementInterface, SectionInterface } from "@/helpers/interfaces";

const getAnswers = (el: ElementInterface): Record<string, unknown> => {
  if (el.answers) return el.answers as Record<string, unknown>;
  if (el.answersJSON) {
    try { return JSON.parse(el.answersJSON) || {}; } catch { return {}; }
  }
  return {};
};

const walkElements = (elements: ElementInterface[] | undefined, visit: (el: ElementInterface) => void) => {
  if (!elements) return;
  for (const el of elements) {
    visit(el);
    walkElements(el.elements, visit);
  }
};

const walkSections = (sections: SectionInterface[] | undefined, visit: (el: ElementInterface) => void) => {
  if (!sections) return;
  for (const section of sections) {
    walkElements(section.elements, visit);
    walkSections(section.sections, visit);
  }
};

export const collectCuratedCalendarIds = (sections?: SectionInterface[]): string[] => {
  const ids = new Set<string>();
  walkSections(sections, (el) => {
    if (el.elementType !== "calendar") return;
    const answers = getAnswers(el);
    if (answers.calendarType === "curated" && typeof answers.calendarId === "string" && answers.calendarId) {
      ids.add(answers.calendarId);
    }
  });
  return Array.from(ids);
};

export const containsElementType = (sections: SectionInterface[] | undefined, elementType: string): boolean => {
  let found = false;
  walkSections(sections, (el) => { if (el.elementType === elementType) found = true; });
  return found;
};
