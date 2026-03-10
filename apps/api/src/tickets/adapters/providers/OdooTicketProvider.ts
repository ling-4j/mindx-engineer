import xmlrpc from 'xmlrpc';
import { Ticket, TicketStatus, TicketPriority, CreateTicketDTO } from '../../domain/models/Ticket.js';
import { TicketProvider } from '../../ports/TicketProvider.js';

export class OdooTicketProvider implements TicketProvider {
    private url: string;
    private db: string;
    private username: string;
    private apiKey: string;
    private uid: number | null = null;
    private tagCache: Map<number, string> = new Map();

    constructor(config: { url: string, db: string, username: string, apiKey: string }) {
        this.url = config.url.replace(/\/$/, '');
        this.db = config.db;
        this.username = config.username;
        this.apiKey = config.apiKey;
    }

    private async getUid(): Promise<number> {
        if (this.uid) return this.uid;
        const common = xmlrpc.createSecureClient(`${this.url}/xmlrpc/2/common`);
        return new Promise((resolve, reject) => {
            common.methodCall('authenticate', [this.db, this.username, this.apiKey, {}], (error, value) => {
                if (error) return reject(error);
                if (!value) return reject(new Error('Authentication failed'));
                this.uid = value;
                resolve(value);
            });
        });
    }

    private async execute(model: string, method: string, args: any[]): Promise<any> {
        const uid = await this.getUid();
        const models = xmlrpc.createSecureClient(`${this.url}/xmlrpc/2/object`);
        return new Promise((resolve, reject) => {
            models.methodCall('execute_kw', [this.db, uid, this.apiKey, model, method, args], (error, value) => {
                if (error) return reject(error);
                resolve(value);
            });
        });
    }

    private async resolveTagNames(tagIds: number[]): Promise<string[]> {
        if (!tagIds || tagIds.length === 0) return [];
        const unknownIds = tagIds.filter(id => !this.tagCache.has(id));
        if (unknownIds.length > 0) {
            try {
                const tags = await this.execute('helpdesk.tag', 'search_read', [[['id', 'in', unknownIds]], ['id', 'name']]);
                for (const tag of tags) {
                    this.tagCache.set(tag.id, tag.name);
                }
            } catch (e) {
                // If tag lookup fails, use IDs as fallback
                for (const id of unknownIds) this.tagCache.set(id, `tag-${id}`);
            }
        }
        return tagIds.map(id => this.tagCache.get(id) || `tag-${id}`);
    }

    async fetchTickets(filters: any[] = []): Promise<Ticket[]> {
        // Always exclude tickets with id <= 1500 (they are duplicates)
        const dedupeFilter = ['id', '>', 1500];
        const combinedFilters = filters.length > 0 ? [...filters, dedupeFilter] : [dedupeFilter];
        const records = await this.execute('helpdesk.ticket', 'search_read', [combinedFilters, ['id', 'name', 'description', 'stage_id', 'priority', 'tag_ids', 'create_date', 'write_date']]);
        return Promise.all(records.map((r: any) => this.mapToTicketWithTags(r)));
    }

    async fetchTicketById(id: string): Promise<Ticket | null> {
        const records = await this.fetchTickets([['id', '=', parseInt(id)]]);
        return records.length > 0 ? records[0] : null;
    }

    async fetchUnprocessedTickets(): Promise<Ticket[]> {
        // Assuming unprocessed means stage is 'New' (typical Odoo ID 1, but we'll use name if possible or just filter by stage)
        return this.fetchTickets([['stage_id', 'ilike', 'New']]);
    }

    async fetchNewTickets(): Promise<Ticket[]> {
        // Simple filter for today's tickets or just a wrapper around fetchTickets
        return this.fetchTickets();
    }

    async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
        const priorityMap: any = { 'low': '0', 'medium': '1', 'high': '2', 'urgent': '3' };
        const id = await this.execute('helpdesk.ticket', 'create', [{
            name: dto.title,
            description: dto.description,
            priority: priorityMap[dto.priority] || '1',
        }]);
        const ticket = await this.fetchTicketById(id.toString());
        if (!ticket) throw new Error('Failed to fetch created ticket');
        return ticket;
    }

    private async mapToTicketWithTags(record: any): Promise<Ticket> {
        const tagNames = await this.resolveTagNames(record.tag_ids || []);
        return {
            id: record.id.toString(),
            title: record.name,
            description: record.description || '',
            status: this.mapStatus(record.stage_id[1]),
            priority: this.mapPriority(record.priority),
            tags: tagNames,
            createdAt: new Date(record.create_date),
            updatedAt: new Date(record.write_date),
        };
    }

    private mapStatus(stageName: string): TicketStatus {
        const name = stageName.toLowerCase();
        if (name.includes('new')) return 'open';
        if (name.includes('progress')) return 'in_progress';
        if (name.includes('solved') || name.includes('resolved')) return 'resolved';
        return 'closed';
    }

    private mapPriority(priority: string): TicketPriority {
        switch (priority) {
            case '0': return 'low';
            case '1': return 'medium';
            case '2': return 'high';
            case '3': return 'urgent';
            default: return 'medium';
        }
    }
}
