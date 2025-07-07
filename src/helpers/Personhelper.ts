import { PersonHelper as BasePersonhelper } from "@churchapps/apphelper/dist/helpers/PersonHelper";
import type { PersonInterface } from "@churchapps/helpers";

export class PersonHelper extends BasePersonhelper {
  static person: PersonInterface;
}
