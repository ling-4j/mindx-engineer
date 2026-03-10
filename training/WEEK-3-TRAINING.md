# Week 3 Training Report: Odoo API Integration with Hexagonal Architecture

---

## Objectives Completed

Extended the Week 2 CLI tool to integrate with **Odoo Helpdesk API**, and also integrated the same domain into a **Web Dashboard** (`apps/web`) via a REST API (`apps/api`).

---

## What Was Built

```
┌──────────────────────────────────────────────────────────┐
│                    DRIVING ADAPTERS                      │
│                                                          │
│   CLI (`ticket-manager-cli`)   Web UI (`apps/web`)       │
│   [Commander.js commands]      [React Dashboard]         │
└────────────────┬──────────────────────┬──────────────────┘
                 │                      │ (via Express API)
         [TicketService]         [TicketService]
                 │                      │
         [TicketProvider PORT]  [TicketRepository PORT]
                 │                      │
┌────────────────▼──────────────────────▼──────────────────┐
│                   DRIVEN ADAPTERS                        │
│                                                          │
│  OdooTicketProvider          JsonTicketRepository        │
│  (XML-RPC to Odoo)           (local tickets.json)        │
└──────────────────────────────────────────────────────────┘
```

---

## Odoo Adapter — `OdooTicketProvider`

**File:** `apps/ticket-manager-cli/src/adapters/providers/OdooTicketProvider.ts`  
**File (API copy):** `apps/api/src/tickets/adapters/providers/OdooTicketProvider.ts`

### Authentication
Uses Odoo XML-RPC `authenticate` call — returns a UID that is cached for the session:

```typescript
private async getUid(): Promise<number> {
  if (this.uid) return this.uid;
  const common = xmlrpc.createSecureClient(`${this.url}/xmlrpc/2/common`);
  // ... authenticate call
}
```

### Stage → Status Mapping

| Odoo Stage | Internal Status |
|---|---|
| contains "new" | `open` |
| contains "progress" | `in_progress` |
| contains "solved"/"resolved" | `resolved` |
| other | `closed` |

---

## CLI Commands for Odoo — All Working

| Command | Description | Status |
|---|---|---|
| `tickets odoo list` | Lists all Odoo tickets with status, priority | ✅ |
| `tickets odoo new -t "Title" -d "Desc" -p high` | Creates a new Odoo ticket | ✅ Verified: ticket #1714 created |
| `tickets odoo unprocessed` | Lists tickets in "New" stage (unprocessed) | ✅ |
| `tickets odoo show <id>` | Shows full details of a specific Odoo ticket | ✅ |

---

## Web Dashboard Integration

The same `TicketService` and `OdooTicketProvider` were integrated into `apps/api` (Express) and consumed by `apps/web` (React):

### API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/tickets` | Returns all Odoo tickets (supports `?filter=new\|unprocessed`) |
| `GET /api/tickets/:id` | Returns full detail of one ticket |
| `POST /api/tickets` | Creates a new Odoo ticket |

### Web Dashboard Features
- **Filter Tabs:** All | New | Unprocessed
- **Ticket List:** Shows priority badge, status, title, creation date, tag names
- **Detail Modal:** Click any ticket → full description, timestamps, tags, priority/status badges
- **Registration Form:** Create new Odoo tickets directly from the browser

---

## Data Flow (Full Trace)

```
User clicks "New" filter tab in browser
  → React fetches GET /api/tickets?filter=new
    → Express calls ticketService.fetchExternalTickets()
      → TicketService calls ticketProvider.fetchTickets([])
        → OdooTicketProvider authenticates with Odoo
          → Queries helpdesk.ticket
          → Resolves tag IDs to names via helpdesk.tag
          → Maps Odoo records → Ticket domain objects
        → Returns Ticket[]
      → Returns to API
    → API responds: { odoo: Ticket[] }
  → React renders ticket cards with filter applied
User clicks ticket card
  → React fetches GET /api/tickets/1714
    → OdooTicketProvider.fetchTicketById("1714")
    → Returns single Ticket with full details
  → Modal opens showing description, tags, time
```

---

## Configuration (.env)

```bash
ODOO_URL=https://xxxxxxxxxxxxxxxxxxxx/
ODOO_DB=xxxxxxxxxxxxxxxx
ODOO_USERNAME=xxxxxxxxxxxxxxxx
ODOO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
USE_ODOO=true
```
