import React from "react";
import { PlanItemInterface } from "@/helpers";
import { SongDialog } from "./SongDialog";

interface Props {
  planItem: PlanItemInterface,
}

export const PlanItem = (props: Props) => {
  const [dialogKeyId, setDialogKeyId] = React.useState<string>(null);

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
        <a href="about:blank" onClick={(e) => { e.preventDefault(); setDialogKeyId(props.planItem.relatedId); }}>
          {props.planItem.label}
        </a>
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
    {dialogKeyId && <SongDialog arrangementKeyId={dialogKeyId} onClose={() => { setDialogKeyId(null); }} />}
  </>)
};

