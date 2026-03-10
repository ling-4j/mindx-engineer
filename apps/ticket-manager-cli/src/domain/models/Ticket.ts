export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTicketDTO {
    title: string;
    description: string;
    priority: TicketPriority;
    tags?: string[];
}
