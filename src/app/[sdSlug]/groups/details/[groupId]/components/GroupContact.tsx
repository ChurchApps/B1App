"use client";

import { GroupInterface, GroupMemberInterface } from "@churchapps/apphelper";
import { Button, FormControl } from "@mui/material";

interface Props {
    leaders: GroupMemberInterface[];
    group: GroupInterface;
}

export function GroupContact(props: Props) {

    const getSelectLeaders = () => {
        const result: JSX.Element[] = [];
        props.leaders.forEach((l) => {
            result.push(<option value={l.personId} key={l.personId}>{l.person.name.display}</option>);
        });
        return result;
    }

    return <>
        <div style={{ marginLeft: "20px" }}>
            <h2>Contact Group Leader:</h2>
            <form>
                <FormControl>
                    <label className="formItem">Contact:</label>
                    <select id="contact" name="contact" className="formInputs">
                        {getSelectLeaders()}
                    </select>
                </FormControl><br />
                <FormControl>
                    <label className="formItem">First Name:</label>
                    <input type="text" id="first" name="first" className="formInputs"></input>
                </FormControl><br />
                <FormControl>
                    <label className="formItem">Last Name:</label>
                    <input type="text" id="last" name="last" className="formInputs"></input>
                </FormControl><br />
                <FormControl>
                    <label className="formItem">Email Address:</label>
                    <input type="email" id="email" name="email" className="formInputs"></input>
                </FormControl><br />
                <FormControl>
                    <label className="formItem">Phone Number:</label>
                    <input type="number" id="phone" name="phone" className="formInputs"></input>
                </FormControl><br />
                <FormControl>
                    <label className="formItem">Message:</label>
                    <textarea id="message" name="message" className="formInputs"></textarea>
                </FormControl><br />
                <FormControl>
                    <Button>Submit</Button>
                </FormControl>
            </form>
        </div>
    </>
}
