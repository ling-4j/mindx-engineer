import fs from 'fs-extra';
import { Ticket, TicketStatus } from '../../domain/models/Ticket.js';
import { TicketRepository } from '../../ports/TicketRepository.js';

export class JsonTicketRepository implements TicketRepository {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
        fs.ensureFileSync(this.filePath);
        if (fs.readFileSync(this.filePath, 'utf8').trim() === '') {
            fs.writeJsonSync(this.filePath, []);
        }
    }

    async save(ticket: Ticket): Promise<void> {
        const tickets = await this.readAll();
        tickets.push(ticket);
        await fs.writeJson(this.filePath, tickets, { spaces: 2 });
    }

    async findById(id: string): Promise<Ticket | null> {
        const tickets = await this.readAll();
        return tickets.find(t => t.id === id) || null;
    }

    async findAll(filters?: { status?: TicketStatus, priority?: string, tags?: string[] }): Promise<Ticket[]> {
        let tickets = await this.readAll();
        if (filters) {
            if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
            if (filters.priority) tickets = tickets.filter(t => t.priority === filters.priority);
            if (filters.tags) {
                tickets = tickets.filter(t => filters.tags!.every(tag => t.tags.includes(tag)));
            }
        }
        return tickets;
    }

    async update(id: string, updates: Partial<Ticket>): Promise<void> {
        const tickets = await this.readAll();
        const index = tickets.findIndex(t => t.id === id);
        if (index !== -1) {
            tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date() };
            await fs.writeJson(this.filePath, tickets, { spaces: 2 });
        }
    }

    private async readAll(): Promise<Ticket[]> {
        return fs.readJson(this.filePath);
    }
}
