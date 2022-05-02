import express from "express";
import { createQueryBuilder, getManager, getRepository } from "typeorm";
import { requireWithUserAsync } from "../middleware/requireWithUserAsync";
import { Board } from "../models/Board";
import { priorityEnum, Ticket } from "../models/Ticket";

const ticketRoute = express.Router();

ticketRoute.get("/search/byDescription/:description", async (req, res) => {
    const description = req.params.description;
    const query = await getRepository(Ticket)
        .createQueryBuilder("ticket")
        .select(["ticket.description", "ticket.comment"])
        .where("LOWER(ticket.description) like LOWER(:desc)", { desc: `%${description}%` })
        .getMany();

    return res.status(200).json(query);
});

ticketRoute.post("/add/byBoardId/:boardId", async (req, res) => {
    interface Request {
        comment: string;
        description: string;
    }
    const boardId = req.params.boardId;

    const lastIndex = await getRepository(Ticket)
        .createQueryBuilder("ticket")
        .leftJoin("ticket.board", "board")
        .where("board.id=:boardId", { boardId: boardId })
        .getCount();

    const board = await Board.findOne(boardId, {
        relations: ["tickets"],
    });

    const ticket = new Ticket();
    ticket.comment = req.body.comment;
    ticket.description = req.body.description;
    ticket.index = lastIndex;
    board?.tickets.push(ticket);
    await board?.save();

    return res.status(201).json(board);
});

ticketRoute.get("/get-all-tickets-debug", async (req, res) => {
    const query = await getRepository(Ticket)
        .createQueryBuilder("ticket")
        .select(["ticket.description", "ticket.comment"])
        .getMany();

    return res.status(200).json(query);
});

ticketRoute.patch("/byId/:ticketId", requireWithUserAsync, async (req, res) => {
        const ticketId = req.params.ticketId;
        const ticketComment = req.body.ticketComment;
        const ticketDescription = req.body.ticketDescription;
        if (!ticketId) {
            return res.status(500).send("Error: Please include Ticket ID");
        }
        const ticket = await Ticket.findOne(ticketId);
        if (!ticket) {
            return res.status(500).send("Error: No such a ticket ID");
        }
        if (ticketComment || ticketComment === "") {
            ticket.comment = ticketComment;
        }
        if (ticketDescription) {
            ticket.description = ticketDescription;
        }
        await ticket.save();

        return res.status(200).send("Ticket updated");
    }
);

ticketRoute.delete("/byId/:ticketId", async (req, res) => {
    const ticketId = req.params.ticketId;
    if (!ticketId) {
        return res.status(500).send("Error: Ticket id invalid");
    }
    try {
        const ticket = await getManager().query(
            `
                SELECT board_id, index
                FROM ticket
                WHERE id=$1
            `,
            [ticketId]
        );

        if (!ticket) {
            throw "Ticket Does Not Exist!";
        }
        await getManager().query(
            `
                DELETE FROM ticket
                WHERE id=$1
            `,
            [ticketId]
        );
        await getManager().query(
            `
                UPDATE ticket
                SET index = index - 1
                WHERE board_id=$1 and index > $2
            `,
            [ticket[0].board_id, ticket[0].index]
        );
    } catch (err) {
        console.log(err);
        return res.status(500).send("Error: Ticket failed to remove");
    }
    return res.status(200).send("Ticket removed");
});

ticketRoute.post("/byId/:ticketId", async (req, res) => {
    const ticketId = req.params.ticketId;
    if (!ticketId) {
        return res.status(400).send();
    }
    
    await createQueryBuilder()
        .update(Ticket)
        .set({closeDate: ()=>"NOW()"})
        .where("ticket.id = :searchTicketId", {searchTicketId: ticketId})
        .execute();
    return res.status(200).send();
});

ticketRoute.put("/byId/:ticketId/:priorityTicket", async (req, res) => {
    const ticketId = req.params.ticketId;
    const ticketPriority = req.params.priorityTicket;
    if (!ticketId) {
        return res.status(400).send("Error: Ticket ID  is empty");
    }
    if(!ticketPriority)
    {
        return res.status(400).send("Error: Priority is empty!")
    }
    if(parseInt(ticketPriority)!=priorityEnum.HIGH||parseInt(ticketPriority)!=priorityEnum.MEDIUM||parseInt(ticketPriority)!=priorityEnum.LOW)
    {
        return res.status(400).send("Error: Wrong Enum only 0-2")
    }
    await createQueryBuilder()
        .update(Ticket)
        .set({priority: ()=> ticketPriority})
        .where("ticket.id = :searchTicketId", {searchTicketId: ticketId})
        .execute();
    return res.status(200).send("Success: Ticket priority was updated to "+ ticketPriority);

    
});

export { ticketRoute };