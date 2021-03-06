import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, DraggableProvided, DraggableStateSnapshot, Droppable, DroppableProvided, DroppableStateSnapshot, DropResult } from "react-beautiful-dnd"
import { produce } from "immer";
import { KeyedMutator } from 'swr';

import { IWorkspace, useFetchWorkspaceById } from '../hooks/swr/useFetchWorkspace';
import { getEndpoint } from '../utils/apiEndpoints';

import styles from '../styles/Workspace.module.scss';
import { TicketModal } from '../components/TicketModal';
import { TicketModalState } from '../interfaces/TicketModalState';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { postDataAsync } from '../utils/postDataAsync';
import { BoardModalState } from '../interfaces/BoardModalState';
import { EditBoardModal } from '../components/EditBoardModal';
import { Plus } from '../components/svg/Plus';
import {  ICount } from '../interfaces/ICount';

const Workspace = (): JSX.Element => {
    const { id } = useParams();

    const [ticketModalState, setTicketModalState] = useState<TicketModalState>({ state: "closed" });
    const [boardModalState, setBoardModalState] = useState<BoardModalState>({ state: "closed" });
    
    const [count, setCount] = useState<ICount|null>(null);

    const { workspaceData, isWorkspaceLoading, workspaceHasError, mutateWorkspace } = useFetchWorkspaceById(id!);

    useEffect(()=>{
        (async function(){
            const raw = await fetch(`${getEndpoint("get_count")}/${id}`);
            const parsed = await raw.json();
            setCount(parsed);
            console.log(parsed);
        }());
    },[workspaceData])

    const dragEnd = async (result: DropResult, mutate: KeyedMutator<IWorkspace>) => {
        const { source, destination } = result;
        if (!destination) {
            return;
        }
        const sourceBoardId = source.droppableId;
        const destinationBoardId = destination.droppableId;

        const sourceTicketIndex = source.index;
        const destinationTicketIndex = destination.index;
        const ticketMoved = workspaceData.boards.find((board) => board.id === sourceBoardId)?.tickets[sourceTicketIndex];
        // Mutated cache here, this is now out of sync with the backend!
        mutate(
            produce<IWorkspace>((draft) => {
                const sourceBoard = draft.boards.find((board) => board.id === sourceBoardId);
                const destinationBoard = draft.boards.find((board) => board.id === destinationBoardId)
                const moveTicket = sourceBoard?.tickets[sourceTicketIndex];

                sourceBoard?.tickets.splice(sourceTicketIndex, 1);
                destinationBoard?.tickets.splice(destinationTicketIndex, 0, moveTicket!);
            })
            , false)
        await postDataAsync(`${getEndpoint("board_update_ticket")}`, {
            source: {
                boardId: sourceBoardId,
                ticketIndex: sourceTicketIndex,
                ticketId: ticketMoved?.id
            },
            target: {
                boardId: destinationBoardId,
                ticketIndex: destinationTicketIndex
            }
        }, false)
        mutate();
    }

    if (isWorkspaceLoading) {
        // TODO: Add loading spinner
        return <h1>Loading...</h1>
    }
    if (workspaceHasError) {
        console.log(workspaceHasError);
        return <h1>Error</h1>
    }

    return (
        <div className={styles.outerWrap}>
            <img className={styles.background} src='/assets/backgroundHex.svg' alt="background"/>
            <AnimatePresence>
                {ticketModalState.state === "edit" && <TicketModal state={ticketModalState.state} id={ticketModalState.id} boardId={ticketModalState.boardId} description={ticketModalState.description} comment={ticketModalState.comment} closeDate={ticketModalState.closeDate} priority={ticketModalState.priority} closeModal={() => setTicketModalState({ state: "closed" })} mutateWorkspace={mutateWorkspace} />}
                {ticketModalState.state === "new" && <TicketModal state={ticketModalState.state} boardId={ticketModalState.boardId} closeModal={() => setTicketModalState({ state: "closed" })} mutateWorkspace={mutateWorkspace} />}
                {boardModalState.state === "edit" && <EditBoardModal state={boardModalState.state} id={boardModalState.board.id} name={boardModalState.board.name} closeModal={() => setBoardModalState({ state: "closed" })} mutateWorkspace={mutateWorkspace}/>}
                {boardModalState.state === "new" && <EditBoardModal state={boardModalState.state} workspaceId={boardModalState.workspace.id} closeModal={() => setBoardModalState({ state: "closed" })} mutateWorkspace={mutateWorkspace} />}
            </AnimatePresence>

            <div className={styles.wrapper}>
                <DragDropContext onDragEnd={(result) => dragEnd(result, mutateWorkspace)}>
                    {workspaceData.boards.map((board) => (
                        <div key={board.id} className={styles.boardWrapper}>
                            <div className={styles.boardHead}>
                                <button className={styles.addTicket} onClick={async () => {
                                    setTicketModalState({
                                        state: "new",
                                        boardId: board.id
                                    });
                                }}>
                                    <Plus />
                                </button>
                                <h2>{board.name}</h2>
                                <button className={styles.boardSetting} style={board.name.toLowerCase() === "unassigned".toLowerCase() ? { pointerEvents: "none" } : {}} onClick={()=>{
                                    setBoardModalState({state:"edit", board: board});
                                }}>
                                    {board.name.toLowerCase() !== "unassigned".toLowerCase() && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z" />
                                    </svg>}
                                </button>
                            </div>
                            <Droppable droppableId={board.id}>
                                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className={styles.board} style={snapshot.isDraggingOver ? { backgroundColor: 'rgba(0, 238, 255,.6)' } : {}}>
                                        {board.tickets.map((ticket, index) => (
                                            <Draggable draggableId={ticket.id} index={index} key={ticket.id}>
                                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                    <div ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps} className={styles.ticket} style={{ ...provided.draggableProps.style }} onClick={() => {
                                                        console.log(ticket);
                                                        
                                                        setTicketModalState({
                                                            state: "edit",
                                                            id: ticket.id,
                                                            boardId: board.id,
                                                            description: ticket.description,
                                                            comment: ticket.comment,
                                                            priority: ticket.priority,
                                                            closeDate: ticket.closeDate
                                                        });
                                                    }}>
                                                        <div data-priority={ticket.priority} className={styles.priority}></div>
                                                        <span data-closed={ticket.closeDate?true:false}>{ticket.description}</span>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </DragDropContext>
                <div className={styles.addWrapper}>
                <div className={styles.counter}>
                    {count&&<div><p>Total Open Tickets: {count?.open}</p></div>}
                    {count&&<div><p>Total Closed Tickets: {count?.closed}</p></div>}
                </div>
                    <button onClick={(e)=>{
                        setBoardModalState({state:"new", workspace: workspaceData});
                    }}>
                        <Plus />
                    </button>
                </div>
            </div>
        </div>
    )
}

export { Workspace };
