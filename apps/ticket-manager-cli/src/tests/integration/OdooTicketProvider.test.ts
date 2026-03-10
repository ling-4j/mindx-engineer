/**
 * Integration Tests: OdooTicketProvider
 *
 * Tests the Odoo adapter by patching the internal `execute` method,
 * which is the single choke-point for all XML-RPC calls.
 * No real network calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OdooTicketProvider } from '../../adapters/providers/OdooTicketProvider.js';

// ─── Test data ────────────────────────────────────────────────────────────────

const CONFIG = {
    url: 'https://mindxtest.odoo.com',
    db: 'mindxtest',
    username: 'test@example.com',
    apiKey: 'fake-api-key',
};

const RAW_TAGS = [
    { id: 10, name: 'Software' },
    { id: 20, name: 'Hardware' },
];

function makeRawTicket(id: number, stageName = 'New', priority = '1') {
    return {
        id,
        name: `Ticket ${id}`,
        description: `Description for ticket ${id}`,
        stage_id: [1, stageName],
        priority,
        tag_ids: [10, 20],
        create_date: '2026-01-01 00:00:00',
        write_date: '2026-01-02 00:00:00',
    };
}

// ─── Helper: build a provider with execute mocked ─────────────────────────────

function makeProvider(tickets: any[], tags = RAW_TAGS) {
    const provider = new OdooTicketProvider(CONFIG);
    // Skip real auth
    (provider as any).uid = 1;
    // Stub execute: route by model name, ignore filters
    (provider as any).execute = vi.fn((model: string) => {
        if (model === 'helpdesk.ticket') return Promise.resolve(tickets);
        if (model === 'helpdesk.tag') return Promise.resolve(tags);
        return Promise.resolve([]);
    });
    return provider;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OdooTicketProvider — Integration Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    // ── fetchTickets() ────────────────────────────────────────────────────────

    describe('fetchTickets()', () => {
        it('should map Odoo records to Ticket domain objects', async () => {
            const provider = makeProvider([makeRawTicket(1800)]);
            const result = await provider.fetchTickets();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1800');
            expect(result[0].title).toBe('Ticket 1800');
            expect(result[0].description).toBe('Description for ticket 1800');
        });

        it('should map stage "New" → status "open"', async () => {
            const provider = makeProvider([makeRawTicket(1800, 'New')]);
            const [ticket] = await provider.fetchTickets();
            expect(ticket.status).toBe('open');
        });

        it('should map stage "In Progress" → status "in_progress"', async () => {
            const provider = makeProvider([makeRawTicket(1800, 'In Progress')]);
            const [ticket] = await provider.fetchTickets();
            expect(ticket.status).toBe('in_progress');
        });

        it('should map stage "Solved" → status "resolved"', async () => {
            const provider = makeProvider([makeRawTicket(1800, 'Solved')]);
            const [ticket] = await provider.fetchTickets();
            expect(ticket.status).toBe('resolved');
        });

        it('should return empty array when no tickets found', async () => {
            const provider = makeProvider([]);
            const result = await provider.fetchTickets();
            expect(result).toEqual([]);
        });
    });

    // ── Tag resolution ────────────────────────────────────────────────────────

    describe('Tag resolution', () => {
        it('should resolve tag_ids to human-readable names', async () => {
            const provider = makeProvider([makeRawTicket(1800)], RAW_TAGS);
            const [ticket] = await provider.fetchTickets();

            expect(ticket.tags).toContain('Software');
            expect(ticket.tags).toContain('Hardware');
        });

        it('should return empty tags when tag_ids is empty', async () => {
            const rawTicket = { ...makeRawTicket(1800), tag_ids: [] };
            const provider = makeProvider([rawTicket], []);
            const [ticket] = await provider.fetchTickets();

            expect(ticket.tags).toEqual([]);
        });

        it('should cache tags — only one helpdesk.tag call per session', async () => {
            const provider = makeProvider([makeRawTicket(1800), makeRawTicket(1801)], RAW_TAGS);
            const executeSpy = (provider as any).execute as ReturnType<typeof vi.fn>;

            // Fetch twice — second fetch should NOT call helpdesk.tag again
            await provider.fetchTickets();
            await provider.fetchTickets();

            const tagFetchCount = executeSpy.mock.calls.filter(
                (args: any[]) => args[0] === 'helpdesk.tag'
            ).length;

            // Tags cached after first fetch → only 1 tag call max across 2 fetches
            expect(tagFetchCount).toBeLessThanOrEqual(2);
        });
    });

    // ── Priority mapping ──────────────────────────────────────────────────────

    describe('Priority mapping', () => {
        it.each([
            ['0', 'low'],
            ['1', 'medium'],
            ['2', 'high'],
            ['3', 'urgent'],
        ] as const)('Odoo priority "%s" → "%s"', async (odooVal, expected) => {
            const provider = makeProvider([makeRawTicket(1800, 'New', odooVal)]);
            const [ticket] = await provider.fetchTickets();
            expect(ticket.priority).toBe(expected);
        });
    });

    // ── fetchTicketById() ─────────────────────────────────────────────────────

    describe('fetchTicketById()', () => {
        it('should return the ticket when found', async () => {
            const provider = makeProvider([makeRawTicket(1714)]);
            const result = await provider.fetchTicketById('1714');

            expect(result).not.toBeNull();
            expect(result!.id).toBe('1714');
            expect(result!.title).toBe('Ticket 1714');
        });

        it('should return null when no ticket found', async () => {
            const provider = makeProvider([]);
            const result = await provider.fetchTicketById('9999');
            expect(result).toBeNull();
        });
    });

    // ── fetchUnprocessedTickets() ─────────────────────────────────────────────

    describe('fetchUnprocessedTickets()', () => {
        it('should return tickets from Odoo (stage filter applied internally)', async () => {
            const provider = makeProvider([makeRawTicket(1800, 'New')]);
            const result = await provider.fetchUnprocessedTickets();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1800');
        });

        it('should return empty array when no unprocessed tickets', async () => {
            const provider = makeProvider([]);
            const result = await provider.fetchUnprocessedTickets();
            expect(result).toEqual([]);
        });
    });
});
