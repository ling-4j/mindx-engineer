import { Ticket, CreateTicketDTO, TicketStatus } from '../domain/models/Ticket.js';

export interface TicketRepository {
    save(ticket: Ticket): Promise<void>;
    findById(id: string): Promise<Ticket | null>;
    findAll(filters?: { status?: TicketStatus, priority?: string, tags?: string[] }): Promise<Ticket[]>;
    update(id: string, updates: Partial<Ticket>): Promise<void>;
}
