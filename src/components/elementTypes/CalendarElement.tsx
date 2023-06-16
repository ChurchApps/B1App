import { ElementInterface } from "@/helpers";
import { GroupCalendar } from "../eventCalendar/GroupCalendar";
import { CuratedCalendar } from "../admin/calendar/CuratedCalendar";

interface Props {
  element: ElementInterface;
  churchId: string;
}

export const CalendarElement = ({ element, churchId }: Props) => {
  return (
    <div>
      {element.answers.calendarType === "group" ? (
        <GroupCalendar churchId={churchId} groupId={element.answers.calendarId} canEdit={false} />
      ) : (
        <CuratedCalendar churchId={churchId} curatedCalendarId={element.answers.calendarId} mode="view" />
      )}
    </div>
  );
};
