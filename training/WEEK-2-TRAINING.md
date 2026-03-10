# Week 2 Training Report: Ticket Manager CLI with Hexagonal Architecture

---

## Objectives Completed

Built a **Ticket Manager CLI** (`apps/ticket-manager-cli`) that applies Hexagonal Architecture with a local JSON storage adapter.

---

## Project Structure

```
apps/ticket-manager-cli/src/
├── domain/                        ← CORE (no external dependencies)
│   ├── models/
│   │   └── Ticket.ts              ← Entity: Ticket, TicketStatus, TicketPriority, CreateTicketDTO
│   └── services/
│       └── TicketService.ts       ← Business logic: create, list, get, update, delegate to ports
│
├── ports/                         ← CONTRACTS (interfaces only)
│   ├── TicketRepository.ts        ← save | findById | findAll | update
│   └── TicketProvider.ts          ← fetchTickets | fetchTicketById | createTicket | fetchUnprocessed
│
└── adapters/                      ← IMPLEMENTATIONS (infrastructure details)
    ├── repositories/
    │   └── JsonTicketRepository.ts  ← Reads/writes tickets.json
    ├── providers/
    │   └── OdooTicketProvider.ts    ← Communicates with Odoo XML-RPC
    └── cli/
        └── index.ts                 ← Entry point: parses CLI commands, calls TicketService
```

---

## Hexagonal Architecture Correctly Applied

### Domain (`domain/`)

`TicketService` only depends on the port interfaces, never on concrete adapters:

```typescript
export class TicketService {
  constructor(
    private ticketRepository: TicketRepository,   
    private ticketProvider?: TicketProvider       
  ) {}

  async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
    // Pure business logic — no knowledge of JSON files or Odoo
    const ticket: Ticket = { id: randomId(), ...dto, status: 'open', createdAt: new Date() };
    await this.ticketRepository.save(ticket);
    return ticket;
  }
}
```

### Ports (`ports/`)

```typescript
export interface TicketRepository {
  save(ticket: Ticket): Promise<void>;
  findById(id: string): Promise<Ticket | null>;
  findAll(filters?: any): Promise<Ticket[]>;
  update(id: string, data: Partial<Ticket>): Promise<void>;
}
```

### Adapters (`adapters/`)

```typescript
export class JsonTicketRepository implements TicketRepository {
  async findAll(): Promise<Ticket[]> {
    return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
  }
}
```

---

## CLI Commands Working

All four required commands verified:

| Command | Description | 
|---|---|---|
| `tickets create -t "Title" -d "Desc" -p high` | Creates a new local ticket | 
| `tickets list` | Lists all local tickets | 
| `tickets show <id>` | Shows details for a specific ticket | 
| `tickets update <id> --status in_progress` | Updates a ticket's status | 

---

## Key AI Workflow Applied

**Solution Exploration used to decide storage format:**
- Option A: SQLite — too heavy for a simple CLI tool
- Option B: PostgreSQL — requires a running server
- **Option C: JSON file** — simple, portable, and sufficient → **Picked**

This shows the domain (`TicketService`) is completely agnostic. We can switch from JSON to PostgreSQL simply by writing a new `PostgresTicketRepository implements TicketRepository` — no domain changes needed.

---

