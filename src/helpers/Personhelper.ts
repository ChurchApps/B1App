import { PersonHelper as BasePersonhelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";

export class PersonHelper extends BasePersonhelper {
  static person: PersonInterface;
}
