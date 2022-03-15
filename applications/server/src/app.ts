import express from "express";
import dotenv from "dotenv";
import { createConnection } from "typeorm";

import connectionConfig from "./utils/connectionConfig";

import { ticketRoute } from "./routes/ticketRoute"
import { workspaceRoute } from "./routes/workspaceRoute";

dotenv.config();
createConnection(connectionConfig);
const app = express();

app.use(express.json());

app.use("/ticket", ticketRoute);
app.use("/workspace", workspaceRoute);

app.get("/",(req,res)=>{
    return res.send("Test from server");
})

app.listen(process.env.PORT||"8080",()=>{
    console.log(`Server running at http://localhost:${process.env.PORT||"8080"}/`);
})