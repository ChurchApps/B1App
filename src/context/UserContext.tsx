import React from "react";
import type { LoginUserChurchInterface, PersonInterface, UserContextInterface, UserInterface } from "@churchapps/helpers";

const UserContext = React.createContext<UserContextInterface | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = React.useState<UserInterface | null>(null);
  const [person, setPerson] = React.useState<PersonInterface | null>(null);
  const [userChurch, setUserChurch] = React.useState<LoginUserChurchInterface | null>(null);
  const [userChurches, setUserChurches] = React.useState<LoginUserChurchInterface[] | null>(null);

  return <UserContext.Provider value={{
    user,
    setUser,
    userChurch,
    setUserChurch,
    userChurches,
    setUserChurches,
    person,
    setPerson
  } as UserContextInterface}>{children} </UserContext.Provider>;
};

export default UserContext;


