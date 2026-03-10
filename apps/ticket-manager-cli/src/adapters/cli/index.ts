import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { TicketService } from '../../domain/services/TicketService.js';
import { JsonTicketRepository } from '../repositories/JsonTicketRepository.js';
import { OdooTicketProvider } from '../providers/OdooTicketProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const program = new Command();
const ticketRepo = new JsonTicketRepository(path.join(__dirname, '../../../data/tickets.json'));

let odooProvider: OdooTicketProvider | undefined;
if (process.env.USE_ODOO === 'true') {
    odooProvider = new OdooTicketProvider({
        url: process.env.ODOO_URL!,
        db: process.env.ODOO_DB!,
        username: process.env.ODOO_USERNAME!,
        apiKey: process.env.ODOO_API_KEY!
    });
}

const ticketService = new TicketService(ticketRepo, odooProvider);

program
    .name('tickets')
    .description('Ticket Manager CLI')
    .version('1.0.0');

program
    .command('create')
    .description('Create a new ticket')
    .requiredOption('-t, --title <title>', 'Ticket title')
    .requiredOption('-d, --description <description>', 'Ticket description')
    .option('-p, --priority <priority>', 'Ticket priority (low, medium, high, urgent)', 'medium')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (options) => {
        try {
            const tags = options.tags ? options.tags.split(',') : [];
            const ticket = await ticketService.createTicket({
                title: options.title,
                description: options.description,
                priority: options.priority,
                tags
            });
            console.log(`Ticket created successfully with ID: ${ticket.id}`);
        } catch (error: any) {
            console.error(`Error creating ticket: ${error.message}`);
        }
    });

program
    .command('list')
    .description('List all tickets')
    .option('-s, --status <status>', 'Filter by status')
    .option('-p, --priority <priority>', 'Filter by priority')
    .action(async (options) => {
        try {
            const tickets = await ticketService.listTickets(options);
            if (tickets.length === 0) {
                console.log('No tickets found.');
            } else {
                console.table(tickets.map(t => ({
                    ID: t.id,
                    Title: t.title,
                    Status: t.status,
                    Priority: t.priority,
                    Tags: t.tags.join(', ')
                })));
            }
        } catch (error: any) {
            console.error(`Error listing tickets: ${error.message}`);
        }
    });

program
    .command('show <id>')
    .description('Show ticket details')
    .action(async (id) => {
        try {
            const ticket = await ticketService.getTicketDetails(id);
            if (!ticket) {
                console.log(`Ticket with ID ${id} not found.`);
            } else {
                console.log(JSON.stringify(ticket, null, 2));
            }
        } catch (error: any) {
            console.error(`Error showing ticket: ${error.message}`);
        }
    });

program
    .command('update <id>')
    .description('Update ticket status')
    .requiredOption('-s, --status <status>', 'New status (open, in_progress, resolved, closed)')
    .action(async (id, options) => {
        try {
            await ticketService.updateTicketStatus(id, options.status);
            console.log(`Ticket ${id} status updated to ${options.status}`);
        } catch (error: any) {
            console.error(`Error updating ticket: ${error.message}`);
        }
    });

const odoo = program.command('odoo').description('Odoo integration commands');

odoo
    .command('list')
    .description('List tickets from Odoo')
    .action(async () => {
        try {
            const tickets = await ticketService.fetchExternalTickets();
            console.table(tickets.map(t => ({
                ID: t.id,
                Title: t.title,
                Status: t.status,
                Priority: t.priority
            })));
        } catch (error: any) {
            console.error(`Error fetching Odoo tickets: ${error.message}`);
        }
    });

odoo
    .command('unprocessed')
    .description('List unprocessed tickets from Odoo')
    .action(async () => {
        try {
            const tickets = await ticketService.fetchUnprocessed();
            console.table(tickets.map(t => ({
                ID: t.id,
                Title: t.title,
                Status: t.status,
                Priority: t.priority
            })));
        } catch (error: any) {
            console.error(`Error fetching unprocessed Odoo tickets: ${error.message}`);
        }
    });

odoo
    .command('show <id>')
    .description('Show Odoo ticket details')
    .action(async (id) => {
        try {
            const ticket = await ticketService.getExternalTicket(id);
            if (!ticket) {
                console.log(`Odoo ticket with ID ${id} not found.`);
            } else {
                console.log(JSON.stringify(ticket, null, 2));
            }
        } catch (error: any) {
            console.error(`Error showing Odoo ticket: ${error.message}`);
        }
    });

odoo
    .command('new')
    .description('Create a new ticket in Odoo')
    .requiredOption('-t, --title <title>', 'Ticket title')
    .requiredOption('-d, --description <description>', 'Ticket description')
    .option('-p, --priority <priority>', 'Ticket priority (low, medium, high, urgent)', 'medium')
    .action(async (options) => {
        try {
            const ticket = await ticketService.createExternalTicket({
                title: options.title,
                description: options.description,
                priority: options.priority
            });
            console.log(`Odoo ticket created successfully with ID: ${ticket.id}`);
        } catch (error: any) {
            console.error(`Error creating Odoo ticket: ${error.message}`);
        }
    });

program.parse(process.argv);
