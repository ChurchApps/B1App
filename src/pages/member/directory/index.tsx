import React from "react";
import Link from "next/link";
import { UserHelper } from "../../../helpers";
import { DirectorySearch } from "../../../components/member/directory/DirectorySearch";
import { Person } from "../../../components/member/directory/Person";
import { Box } from "@mui/material";
import { Wrapper } from "@/components/Wrapper";


export default function Admin() {

  const [personId, setPersonId] = React.useState("");

  const handlePersonSelected = (personId: string) => { setPersonId(personId); }
  const handleBack = () => { setPersonId(""); }

  const getContent = () => personId ? <Person personId={personId} backHandler={handleBack} selectedHandler={handlePersonSelected} /> : <DirectorySearch selectedHandler={handlePersonSelected} />

  return (
    <Box sx={{ display: "flex", backgroundColor: "#EEE" }}>
      <Wrapper>
        {
          UserHelper.user?.firstName
            ? (getContent())
            : <><h1>Member Directory</h1><h3 className="text-center w-100">Please <Link href="/login/?returnUrl=/directory">Login</Link> to view Directory.</h3></>
        }
      </Wrapper>
    </Box>
  );
}
