import { ConnectionOptions } from "typeorm";
import dotenv from "dotenv";

import { Board } from "../models/Board";
import { Ticket } from "../models/Ticket";
import { Organization } from "../models/Organization";
import { Team } from "../models/Team";
import { User } from "../models/User";
import { Workspace } from "../models/Workspace";

dotenv.config();
const connectionConfig:ConnectionOptions = {
    type:"postgres",
    url: process.env.DATABASE_URL,
    logging: false,
    synchronize: true,
    entities:[
        Board,
        Ticket,
        Organization,
        Team,
        User,
        Workspace
    ]
}

export { connectionConfig };