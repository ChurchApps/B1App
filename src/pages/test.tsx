import { Container, TextField } from "@mui/material";
import { useState } from "react";
import {io} from "socket.io-client";

export default function Localhost() {


  const socket = io("wss://socket.churchapps.org", {
    reconnectionDelayMax: 10000,
    auth: {
      token: "123"
    },
    query: {
      "my-key": "my-value"
    }
  });

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on("error", (error) => {
    console.log("error", error);
  });

  socket.on("ping", () => {
    console.log("ping");
  });

  socket.io.on("reconnect", (attempt) => {
    console.log("reconnect", attempt);
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log("reconnect attempt", attempt);
  });

  socket.io.on("reconnect_error", (error) => {
    console.log("reconnect error", error);
  });

  socket.io.on("reconnect_failed", () => {
    console.log("reconnect_failed");
  });

  return (

    <Container>
      Test Page
    </Container>

  );
}
