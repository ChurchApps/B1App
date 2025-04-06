import React from "react";
import { PlanItemInterface } from "@/helpers";

interface Props {
  planItem: PlanItemInterface,
}

export const PlanItem = (props: Props) => {

  const getChildren = () => {
    const result: JSX.Element[] = [];
    props.planItem.children?.forEach((c, index) => {
      result.push(
        <>
          <PlanItem key={c.id} planItem={c} />
        </>
      );
    });
    return result;
  }

  const getHeaderRow = () => <>
    {getChildren()}
  </>

  const getItemRow = () => <>
    <div className="planItem">
      <div>{formatTime(props.planItem.seconds)}</div>
      <div>
        {props.planItem.label}
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getSongRow = () => <>
    <div className="planItem">
      <div>{formatTime(props.planItem.seconds)}</div>
      <div>
        {props.planItem.label}
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getDescriptionRow = () => <div className="planItemDescription">{props.planItem.description}</div>

  const getPlanItem = () => {
    switch (props.planItem.itemType) {
      case "header": return getHeaderRow();
      case "song":
      case "arrangementKey":
        return getSongRow();
      case "item": return getItemRow();
    }
  }

  const formatTime = (seconds: number) => {
    let minutes = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return minutes + ":" + (secs < 10 ? "0" : "") + secs;
  }

  return (<>
    {getPlanItem()}
  </>)
};

