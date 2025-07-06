import { PersonHelper as BasePersonhelper } from "@churchapps/apphelper/dist/helpers/PersonHelper";
import type { PersonInterface } from "@churchapps/apphelper/dist/interfaces/PersonInterface";

export class PersonHelper extends BasePersonhelper {
  static person: PersonInterface;
}
