/**
 * Unit Tests: TicketService
 *
 * Tests the domain service in complete isolation using in-memory mocks.
 * No real files, no real Odoo — pure domain logic validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from '../../domain/services/TicketService.js';
import { Ticket, CreateTicketDTO } from '../../domain/models/Ticket.js';
import { TicketRepository } from '../../ports/TicketRepository.js';
import { TicketProvider } from '../../ports/TicketProvider.js';

// ─── Mock Repository ─────────────────────────────────────────────────────────
const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
    id: 'test-id-1',
    title: 'Test Ticket',
    description: 'A test description',
    status: 'open',
    priority: 'medium',
    tags: ['bug'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
});

const mockRepo = (): TicketRepository => ({
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
});

const mockProvider = (): TicketProvider => ({
    fetchTickets: vi.fn().mockResolvedValue([]),
    fetchTicketById: vi.fn().mockResolvedValue(null),
    fetchUnprocessedTickets: vi.fn().mockResolvedValue([]),
    fetchNewTickets: vi.fn().mockResolvedValue([]),
    createTicket: vi.fn().mockResolvedValue(makeTicket()),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TicketService — Unit Tests', () => {

    // ── createTicket ──────────────────────────────────────────────────────────

    describe('createTicket()', () => {
        it('should create a ticket with status "open"', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);

            const dto: CreateTicketDTO = {
                title: 'New Bug',
                description: 'Something broke',
                priority: 'high',
                tags: ['bug'],
            };

            const ticket = await service.createTicket(dto);

            expect(ticket.title).toBe('New Bug');
            expect(ticket.status).toBe('open');
            expect(ticket.priority).toBe('high');
            expect(ticket.tags).toEqual(['bug']);
        });

        it('should call repository.save() once with the new ticket', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);

            await service.createTicket({ title: 'T', description: 'D', priority: 'low' });

            expect(repo.save).toHaveBeenCalledOnce();
        });

        it('should assign a non-empty ID', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);
            const ticket = await service.createTicket({ title: 'T', description: 'D', priority: 'low' });

            expect(ticket.id).toBeTruthy();
            expect(ticket.id.length).toBeGreaterThan(0);
        });

        it('should default tags to an empty array when not provided', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);
            const ticket = await service.createTicket({ title: 'T', description: 'D', priority: 'low' });

            expect(ticket.tags).toEqual([]);
        });
    });

    // ── listTickets ───────────────────────────────────────────────────────────

    describe('listTickets()', () => {
        it('should return all tickets from the repository', async () => {
            const existing = [makeTicket({ id: '1' }), makeTicket({ id: '2' })];
            const repo = mockRepo();
            (repo.findAll as any).mockResolvedValue(existing);

            const service = new TicketService(repo);
            const result = await service.listTickets();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });

        it('should return empty array when no tickets exist', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);

            const result = await service.listTickets();
            expect(result).toEqual([]);
        });
    });

    // ── getTicketDetails ──────────────────────────────────────────────────────

    describe('getTicketDetails()', () => {
        it('should return a local ticket if found', async () => {
            const ticket = makeTicket({ id: 'abc' });
            const repo = mockRepo();
            (repo.findById as any).mockResolvedValue(ticket);

            const service = new TicketService(repo);
            const result = await service.getTicketDetails('abc');

            expect(result).toEqual(ticket);
        });

        it('should fallback to provider if not found locally', async () => {
            const odooTicket = makeTicket({ id: '1714' });
            const repo = mockRepo();
            const provider = mockProvider();
            (provider.fetchTicketById as any).mockResolvedValue(odooTicket);

            const service = new TicketService(repo, provider);
            const result = await service.getTicketDetails('1714');

            expect(provider.fetchTicketById).toHaveBeenCalledWith('1714');
            expect(result!.id).toBe('1714');
        });

        it('should return null if not found anywhere', async () => {
            const repo = mockRepo();
            const provider = mockProvider();

            const service = new TicketService(repo, provider);
            const result = await service.getTicketDetails('unknown');

            expect(result).toBeNull();
        });
    });

    // ── updateTicketStatus ────────────────────────────────────────────────────

    describe('updateTicketStatus()', () => {
        it('should call repository.update() with the new status', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);

            await service.updateTicketStatus('id-1', 'resolved');

            expect(repo.update).toHaveBeenCalledWith('id-1', expect.objectContaining({ status: 'resolved' }));
        });
    });

    // ── fetchExternalTickets ──────────────────────────────────────────────────

    describe('fetchExternalTickets()', () => {
        it('should throw if no provider is configured', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo); // no provider

            await expect(service.fetchExternalTickets()).rejects.toThrow('Ticket provider not configured');
        });

        it('should call provider.fetchTickets() and return results', async () => {
            const odooTickets = [makeTicket({ id: '1800' }), makeTicket({ id: '1801' })];
            const repo = mockRepo();
            const provider = mockProvider();
            (provider.fetchTickets as any).mockResolvedValue(odooTickets);

            const service = new TicketService(repo, provider);
            const result = await service.fetchExternalTickets();

            expect(result).toHaveLength(2);
            expect(provider.fetchTickets).toHaveBeenCalledWith([]);
        });
    });

    // ── fetchUnprocessed ──────────────────────────────────────────────────────

    describe('fetchUnprocessed()', () => {
        it('should call provider.fetchUnprocessedTickets()', async () => {
            const repo = mockRepo();
            const provider = mockProvider();
            (provider.fetchUnprocessedTickets as any).mockResolvedValue([makeTicket()]);

            const service = new TicketService(repo, provider);
            const result = await service.fetchUnprocessed();

            expect(provider.fetchUnprocessedTickets).toHaveBeenCalledOnce();
            expect(result).toHaveLength(1);
        });

        it('should throw if no provider is configured', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);

            await expect(service.fetchUnprocessed()).rejects.toThrow('Ticket provider not configured');
        });
    });

    // ── createExternalTicket ──────────────────────────────────────────────────

    describe('createExternalTicket()', () => {
        it('should call provider.createTicket() with the DTO', async () => {
            const dto: CreateTicketDTO = { title: 'Odoo Bug', description: 'From Odoo', priority: 'urgent' };
            const created = makeTicket({ title: 'Odoo Bug' });
            const repo = mockRepo();
            const provider = mockProvider();
            (provider.createTicket as any).mockResolvedValue(created);

            const service = new TicketService(repo, provider);
            const result = await service.createExternalTicket(dto);

            expect(provider.createTicket).toHaveBeenCalledWith(dto);
            expect(result.title).toBe('Odoo Bug');
        });

        it('should throw if no provider is configured', async () => {
            const repo = mockRepo();
            const service = new TicketService(repo);

            await expect(service.createExternalTicket({ title: 'T', description: 'D', priority: 'low' }))
                .rejects.toThrow('Ticket provider not configured');
        });
    });
});
