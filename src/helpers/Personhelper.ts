import { PersonHelper as BasePersonhelper } from "@/appBase/helpers";
import { PersonInterface } from "@/appBase/interfaces/Membership";

export class PersonHelper extends BasePersonhelper {
  static person: PersonInterface;
}
