"use client";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper, EventInterface, GroupInterface, GroupMemberInterface, InputBox } from "@churchapps/apphelper";
import { Button, SelectChangeEvent, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from "react";

interface Props {
    config: ConfigurationInterface
    group: GroupInterface;
    onChange: (group: GroupInterface) => void;
}

export function LeaderEdit(props: Props) {

    const [formEdits, setFormEdits] = useState<GroupInterface>(props.group);
    let [hidden, setHidden] = useState("none");

    useEffect(() => {
        setFormEdits(props.group);
        console.log("group is", props.group);
    }, [props.group])

    const hideForm = () => {
        if (hidden === "none") {
            setHidden("block");
            console.log("showing")
        } else {
            setHidden("none");
            console.log("hiding")
        }
        return;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const val = e.target.value;
        const fe = { ...formEdits }
        switch (e.target.name) {
            case "name": fe.name = val; break;
            case "meetingTime": fe.meetingTime = val; break;
            case "meetingLocation": fe.meetingLocation = val; break;
            case "about": fe.about = val; break;
        }
        setFormEdits(fe);
        console.log(fe);
    }

    const handleSubmit = async () => {
        ApiHelper.post("/groups", [formEdits], "MembershipApi").then((groups: GroupInterface[]) => {
            hideForm();
            props.onChange(groups[0]);
        });
    }

    return <>
        <div style={{ textAlign: "right", float: "right", marginTop: 20 }}>
            <Button onClick={hideForm}><EditIcon /></Button>
        </div>

        <div>
            <form style={{ display: hidden, marginTop: 20 }}>
                <InputBox saveFunction={handleSubmit} cancelFunction={hideForm}>
                    <TextField fullWidth label="Group Name" name="name" value={formEdits.name || ""} onChange={handleChange} />
                    <TextField fullWidth label="Meeting Time" name="meetingTime" value={formEdits.meetingTime || ""} onChange={handleChange} />
                    <TextField fullWidth label="Meeting Location" name="meetingLocation" value={formEdits.meetingLocation || ""} onChange={handleChange} />
                    <TextField fullWidth label="Description" name="about" value={formEdits.about || ""} onChange={handleChange} multiline />
                </InputBox>
            </form>
        </div>
    </>
}