import React from "react";
import { UserContextInterface } from "../../interfaces";
import { UserHelper } from "../../helpers/UserHelper";
import { ChurchInterface } from "../../interfaces";
import { NavItem } from "./NavItem";

export interface Props { churches: ChurchInterface[], currentChurch: ChurchInterface, context: UserContextInterface }

export const ChurchList: React.FC<Props> = props => {

  if (props.churches.length < 2) return <></>;
  else {
    let result: JSX.Element[] = [];
    const churches = props.churches.filter(c => c.apis.length > 0)
    churches.forEach(c => {
      const church = c;
      const churchName = c.name;
      result.push(<NavItem key={church.id} selected={(c.id === props.currentChurch.id) && true} onClick={() => UserHelper.selectChurch(props.context, church.id, null)} label={churchName} icon="church" />);
    });

    return <>{result}</>;
  }
};
