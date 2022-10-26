import { ChurchInterface, UserInterface } from "./Access";
import { PersonInterface } from "./Membership";

export interface UserContextInterface {
  user: UserInterface,
  setUser: (user: UserInterface) => void,
  person: PersonInterface,
  setPerson: (person: PersonInterface) => void,
  church: ChurchInterface,
  setChurch: (church: ChurchInterface) => void,
  churches: ChurchInterface[],
  setChurches: (churches: ChurchInterface[]) => void,
}
