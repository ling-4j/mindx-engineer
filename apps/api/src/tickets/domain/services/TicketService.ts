import { Ticket, CreateTicketDTO } from '../models/Ticket.js';
import { TicketRepository } from '../../ports/TicketRepository.js';
import { TicketProvider } from '../../ports/TicketProvider.js';

export class TicketService {
    constructor(
        private ticketRepository: TicketRepository,
        private ticketProvider?: TicketProvider
    ) { }

    async fetchExternalTickets(filters?: any): Promise<Ticket[]> {
        if (!this.ticketProvider) throw new Error('Ticket provider not configured');
        // If filters is empty, we still respect the default ID > 1500 in the provider
        return this.ticketProvider.fetchTickets(filters || []);
    }

    async getExternalTicket(id: string): Promise<Ticket | null> {
        if (!this.ticketProvider) throw new Error('Ticket provider not configured');
        return this.ticketProvider.fetchTicketById(id);
    }

    async fetchUnprocessed(): Promise<Ticket[]> {
        if (!this.ticketProvider) throw new Error('Ticket provider not configured');
        return this.ticketProvider.fetchUnprocessedTickets();
    }

    async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
        const ticket: Ticket = {
            id: Math.random().toString(36).substring(2, 9),
            title: dto.title,
            description: dto.description,
            status: 'open',
            priority: dto.priority,
            tags: dto.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.ticketRepository.save(ticket);
        return ticket;
    }

    async listTickets(filters?: any): Promise<Ticket[]> {
        return this.ticketRepository.findAll(filters);
    }

    async getTicketDetails(id: string): Promise<Ticket | null> {
        const local = await this.ticketRepository.findById(id);
        if (local) return local;

        // If not found locally, try Odoo if it looks like an Odoo ID (numeric) or just try anyway
        if (this.ticketProvider) {
            try {
                return await this.ticketProvider.fetchTicketById(id);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    async createExternalTicket(dto: CreateTicketDTO): Promise<Ticket> {
        if (!this.ticketProvider) throw new Error('Ticket provider not configured');
        return this.ticketProvider.createTicket(dto);
    }

    async updateTicketStatus(id: string, status: any): Promise<void> {
        await this.ticketRepository.update(id, { status, updatedAt: new Date() });
    }
}
