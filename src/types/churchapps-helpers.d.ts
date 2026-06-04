// Local augmentation: the church-wide campus work adds `campusId` to groups, but
// the installed @churchapps/helpers predates that field. Declaring it here
// (forward-compatible) lets call sites use `group.campusId` without `as any`.
// Remove once @churchapps/helpers is republished with the field.
import "@churchapps/helpers";

declare module "@churchapps/helpers" {
  interface GroupInterface {
    campusId?: string;
  }
}
