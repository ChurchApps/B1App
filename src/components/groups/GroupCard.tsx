import Link from "next/link";
import { Typography, Card, CardMedia, CardContent } from "@mui/material";
import { GroupInterface, MarkdownPreviewLight } from "@churchapps/apphelper";

interface Props {
  group: GroupInterface;
}

export default function GroupCard(props: Props) {

  return (
    <Link href={"/groups/details/" + props.group.slug}>
      <Card>
        <CardMedia component="img" image={props.group.photoUrl} alt={props.group.name} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" style={{marginBottom:0}}>
            {props.group.name}
          </Typography>
          <div style={{ height:95, overflow:"hidden" }}>
            <div style={{fontSize:14}}>
              <span style={{float:"right"}}>{props.group.meetingLocation}</span>
              <span>{props.group.meetingTime}</span>
            </div>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              <MarkdownPreviewLight value={props.group.about} />
            </Typography>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
