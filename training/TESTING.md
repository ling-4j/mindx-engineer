# Testing Guide: Ticket Manager CLI

This document explains how to run the automated tests for `apps/ticket-manager-cli`.

---

## Test Location

```
apps/ticket-manager-cli/src/tests/
├── unit/
│   └── TicketService.test.ts        ← Domain logic tests (16 tests)
└── integration/
    └── OdooTicketProvider.test.ts   ← Adapter tests with mocked Odoo (16 tests)
```

---

## Prerequisites

Make sure you are in the CLI app directory and have dependencies installed:

```powershell
cd apps/ticket-manager-cli
npm install
```

---

## Running Tests

### Run All Tests (Unit + Integration)

```powershell
npm run test
```

### Run Only Unit Tests

```powershell
npx vitest run src/tests/unit
```

### Run Only Integration Tests

```powershell
npx vitest run src/tests/integration
```

### Run with Verbose Output (see each test name)

```powershell
npx vitest run --reporter=verbose
```

### Watch Mode (auto re-runs on file save)

```powershell
npx vitest
```

---

## What the Tests Cover

### Unit Tests — `TicketService.test.ts`
Tests the **domain service in complete isolation** using in-memory mocks.
No files, no Odoo, no network — pure business logic.

| Test Group | Tests | What it verifies |
|---|---|---|
| `createTicket()` | 4 | Status defaults to `open`, ID is assigned, tags default to `[]`, `save()` is called |
| `listTickets()` | 2 | Returns from repository, handles empty list |
| `getTicketDetails()` | 3 | Finds local, falls back to Odoo, returns null if nowhere |
| `updateTicketStatus()` | 1 | Calls `repo.update()` with correct status |
| `fetchExternalTickets()` | 2 | Calls provider, throws if no provider |
| `fetchUnprocessed()` | 2 | Calls provider, throws if no provider |
| `createExternalTicket()` | 2 | Calls provider with DTO, throws if no provider |

### Integration Tests — `OdooTicketProvider.test.ts`
Tests the **Odoo adapter** with a mocked internal `execute` method.
The mock intercepts all XML-RPC calls — no real Odoo connection needed.

| Test Group | Tests | What it verifies |
|---|---|---|
| `fetchTickets()` | 5 | Correct field mapping, stage → status, empty results |
| `Tag resolution` | 3 | Tag IDs resolved to names, empty tags, caching works |
| `Priority mapping` | 4 | `0`→`low`, `1`→`medium`, `2`→`high`, `3`→`urgent` |
| `fetchTicketById()` | 2 | Returns ticket when found, `null` when not found |
| `fetchUnprocessedTickets()` | 2 | Returns results, handles empty |

---

## Expected Output

When all tests pass, you should see:

```
 ✓ src/tests/unit/TicketService.test.ts            (16)
 ✓ src/tests/integration/OdooTicketProvider.test.ts (16)

 Test Files  2 passed (2)
      Tests  32 passed (32)
```

---

## How Mocking Works

### Unit Tests — Mock Repository & Provider

```typescript
// Create a fake in-memory repository
const mockRepo = (): TicketRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
});

// Inject into service — no real files needed
const service = new TicketService(mockRepo(), mockProvider());
```

### Integration Tests — Mock Odoo XML-RPC

```typescript
// Force UID to skip real authentication
(provider as any).uid = 1;

// Replace the internal execute() method with a mock
(provider as any).execute = vi.fn().mockImplementation((model, method, args) => {
    if (model === 'helpdesk.ticket') return Promise.resolve(fakeTickets);
    if (model === 'helpdesk.tag')    return Promise.resolve(fakeTags);
});
```

---

## Hexagonal Architecture and Testability

The tests demonstrate the key benefit of Hexagonal Architecture:

```
TicketService ──uses──► TicketRepository (PORT)
                              ▲
                        MockRepository
                        (injected in tests)
                        JsonTicketRepository
                        (injected in production)
```

Because `TicketService` only depends on the **interface (port)**, not the concrete class, able to swap in a mock with zero code changes to the domain logic.
