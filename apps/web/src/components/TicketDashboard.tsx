import React, { useState, useEffect } from 'react';

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export const TicketDashboard: React.FC = () => {
    const [tickets, setTickets] = useState<{ odoo: Ticket[] }>({ odoo: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', tags: '', source: 'odoo' });
    const [filter, setFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const fetchTickets = async (currentFilter = filter) => {
        setLoading(true);
        try {
            const url = currentFilter === 'all' ? '/api/tickets' : `/api/tickets?filter=${currentFilter}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const data = await res.json();
            console.log('Fetched tickets:', data);
            setTickets(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
    };

    const handleShowDetails = async (id: string) => {
        console.log('Fetching details for ticket:', id);
        try {
            const res = await fetch(`/api/tickets/${id}`);
            if (!res.ok) throw new Error('Failed to fetch ticket details');
            const data = await res.json();
            console.log('Ticket details:', data);
            setSelectedTicket(data);
        } catch (err: any) {
            console.error('Detail fetch error:', err);
            alert(err.message);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTicket,
                    tags: newTicket.tags.split(',').map(t => t.trim()).filter(t => t)
                }),
            });
            if (!res.ok) throw new Error('Failed to create ticket');
            setNewTicket({ title: '', description: '', priority: 'medium', tags: '', source: 'odoo' });
            setShowCreateForm(false);
            fetchTickets();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/tickets/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            fetchTickets();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return '#ff4d4f';
            case 'high': return '#faad14';
            case 'medium': return '#1890ff';
            default: return '#52c41a';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return '#f5222d';
            case 'in_progress': return '#fa8c16';
            case 'resolved': return '#52c41a';
            default: return '#8c8c8c';
        }
    };

    return (
        <div className="ticket-dashboard">
            <div className="dashboard-header">
                <div>
                    <h2>🎫 Support Tickets</h2>
                    <p className="subtitle">Manage local and Odoo tickets in one place</p>
                </div>
                <div className="filter-tabs">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => handleFilterChange('all')}>All</button>
                    <button className={filter === 'new' ? 'active' : ''} onClick={() => handleFilterChange('new')}>New</button>
                    <button className={filter === 'unprocessed' ? 'active' : ''} onClick={() => handleFilterChange('unprocessed')}>Unprocessed</button>
                </div>
                <div className="header-actions">
                    <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-create">
                        {showCreateForm ? 'Cancel' : 'Register Ticket'}
                    </button>
                    <button onClick={() => fetchTickets()} className="btn-refresh-tickets">Refresh</button>
                </div>
            </div>

            {showCreateForm && (
                <form onSubmit={handleCreateTicket} className="create-ticket-form glass">
                    <h3>Register New Ticket</h3>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Title"
                            required
                            value={newTicket.title}
                            onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            placeholder="Description"
                            required
                            value={newTicket.description}
                            onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <select value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Tags (comma separated)"
                            value={newTicket.tags}
                            onChange={e => setNewTicket({ ...newTicket, tags: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn-submit">Submit to Odoo</button>
                </form>
            )}

            {loading ? (
                <div className="loading-skeleton">Loading tickets...</div>
            ) : error ? (
                <div className="error-message">Error: {error}</div>
            ) : (
                <div className="ticket-full-width">
                    <section className="ticket-section bulk-scroll">
                        <h3>🏢 Odoo Tickets ({tickets.odoo.length})</h3>
                        <div className="ticket-list-container">
                            <div className="ticket-list">
                                {tickets.odoo.length === 0 ? <p className="empty-msg">No Odoo tickets found.</p> :
                                    tickets.odoo.map(ticket => (
                                        <div key={ticket.id} className="ticket-card glass clickable" onClick={() => handleShowDetails(ticket.id)}>
                                            <div className="ticket-badge" style={{ backgroundColor: getPriorityColor(ticket.priority) }}>
                                                {ticket.priority}
                                            </div>
                                            <h4>{ticket.title}</h4>
                                            <p className="ticket-id">#{ticket.id} • Odoo</p>
                                            <div className="ticket-details">
                                                <p className="ticket-date">📅 {new Date(ticket.createdAt).toLocaleString()}</p>
                                                <div className="ticket-tags">
                                                    {ticket.tags?.map((tag: any) => (
                                                        <span key={tag} className="tag">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="ticket-footer">
                                                <span className="status-tag" style={{ border: `1px solid ${getStatusColor(ticket.status)}`, color: getStatusColor(ticket.status) }}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedTicket.title}</h3>
                            <button className="btn-close" onClick={() => setSelectedTicket(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p className="ticket-id-large">#{selectedTicket.id}</p>
                            <div className="modal-details">
                                <span className="priority-label" style={{ backgroundColor: getPriorityColor(selectedTicket.priority) }}>{selectedTicket.priority}</span>
                                <span className="status-label" style={{ backgroundColor: getStatusColor(selectedTicket.status) }}>{selectedTicket.status}</span>
                            </div>
                            <div className="modal-description">
                                <h4>Description</h4>
                                <p>{selectedTicket.description}</p>
                            </div>
                            <div className="modal-meta">
                                <p>📅 Created: {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                <p>🔄 Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}</p>
                            </div>
                            <div className="modal-tags">
                                {selectedTicket.tags?.map((tag: any) => <span key={tag} className="tag">{tag}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
