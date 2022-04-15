import express from "express";
import { getRepository } from "typeorm";
import { requireWithUserAsync } from "../middleware/requireWithUserAsync";
import { User } from "../models/User";

const userRouter = express.Router();

userRouter.get("/workspaces", requireWithUserAsync, async (req, res) => {
    if (!req.user) {
        return res.status(403).send("Error: Not Auth");
    }
    const workspaces = await getRepository(User).createQueryBuilder("user")
    .select("user.id")
    .leftJoinAndSelect("user.workspaces","workspace")
    .where("user.id=:userId",{userId: req.user.id})
    .getMany();
    
    return res.status(200).json(workspaces);
});

userRouter.patch("/update", requireWithUserAsync, async (req, res) => {
    if (!req.user) {
        return res.status(403).send("Error: Not Auth");
    }
});

userRouter.delete("/delete", requireWithUserAsync, async(req,res)=>{
    if (!req.user) {
        return res.status(403).send("Error: Not Auth");
    }
})

export { userRouter };