import { Ticket, CreateTicketDTO } from '../domain/models/Ticket.js';

export interface TicketProvider {
    fetchTickets(filters?: any): Promise<Ticket[]>;
    fetchTicketById(id: string): Promise<Ticket | null>;
    fetchUnprocessedTickets(): Promise<Ticket[]>;
    fetchNewTickets(): Promise<Ticket[]>;
    createTicket(dto: CreateTicketDTO): Promise<Ticket>;
}
