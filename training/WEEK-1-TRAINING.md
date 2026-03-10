# Week 1 Training Report: AI Workflows & Hexagonal Architecture Research

**Trainee:** Linh Huu  
**Period:** Week 1  
**Plan Reference:** `docs/plans2/plans2-week-1/overview.md`

---

## Objectives Completed

Master AI collaboration workflows and research Hexagonal Architecture using structured AI-assisted processes.

---

## 1. AI Workflow Mastery

### Workflow 1: Layered Questioning
**Research → Brief → Example → Validation**

Applied to understand the core problem Hexagonal Architecture solves:

| Layer | Content |
|---|---|
| **Research** | Traditional layered architectures tightly couple business logic with infrastructure (DB, frameworks) |
| **Brief** | Hexagonal Architecture isolates domain logic using Ports (interfaces) and Adapters (implementations) |
| **Example** | `OdooTicketProvider implements TicketProvider` — domain never imports Odoo directly |
| **Validation** | If we replace Odoo with Jira tomorrow, only theadapter file changes — `TicketService` is untouched |

### Workflow 2: Solution Exploration
**Explore → Compare → Choose with context**

Compared three architecture patterns:

| Architecture | Pros | Cons | Decision |
|---|---|---|---|
| Layered | Simple, fast to build | Tight coupling with infra | ❌ Not chosen |
| Clean Architecture | Strong separation | High structural complexity | ⚠️ Considered |
| **Hexagonal (Ports & Adapters)** | Flexible external integration, high testability | Boilerplate overhead | ✅ **Chosen** |

**Decision rationale:** The project integrates multiple external systems (Odoo API, JSON file storage, CLI, Web UI) — Hexagonal Architecture handles this naturally.

### Workflow 3: Iterative Refinement
**Review → Summarize → Refine → Feedback → Validate**

- **Iteration 1:** Understood basic port/adapter concept
- **Iteration 2:** Refined with dependency direction: dependencies always point *inward* to domain, never outward
- **Iteration 3:** Validated with real scenario: Odoo API connection flows through `OdooTicketProvider → TicketProvider port → TicketService → Domain`

---

## 2. Hexagonal Architecture Research Findings

### Core Principles

```
    ┌──────────────────────────────────┐
    │   DRIVING ADAPTERS (Left Side)   │
    │   CLI (index.ts)                 │
    │   HTTP API (express routes)      │
    └────────────┬─────────────────────┘
                 │
         [Ports - Interfaces]
         TicketProvider
         TicketRepository
                 │
    ┌────────────▼─────────────────────┐
    │         DOMAIN (Core)            │
    │   Ticket Model                   │
    │   TicketService                  │
    └────────────┬─────────────────────┘
                 │
         [Ports - Interfaces]
                 │
    ┌────────────▼─────────────────────┐
    │  DRIVEN ADAPTERS (Right Side)    │
    │  OdooTicketProvider              │
    │  JsonTicketRepository            │
    └──────────────────────────────────┘
```

**Key rule:** The Domain never imports Adapters. Adapters import Ports and implement them.

### Pros & Cons

**Advantages:**
- Domain logic is testable in isolation — inject a `MockTicketProvider` instead of real Odoo
- Infrastructure substitution without touching business logic
- Multiple entry points (CLI + Web) sharing one domain core

**Disadvantages:**
- Boilerplate: requires interfaces, DTOs, and mapping layers
- Steeper learning curve vs. simple CRUD

### When to Apply

✅ Multiple external integrations (Odoo, future Jira)  
✅ Multiple entry points (CLI + REST API + Web Dashboard)  
✅ Domain logic must stay testable independent of infrastructure  
✅ Long-lived system where tech stacks evolve  

---

## Acceptance Criteria — Status

| Criterion | Status | Evidence |
|---|---|---|
| Research content documented: Core principles, Pros/Cons, When to apply, Alternatives | ✅ | `docs/plans2/plans2-week-1/hexagonal-research.md` |
| Research process with AI tracked: Workflows + iterations | ✅ | `docs/plans2/plans2-week-1/research-workflow.md` |
| Research findings can be explained clearly | ✅ | This document |
| Questions about Hexagonal Architecture can be answered | ✅ | See detailed Q&A below |

### Q&A Readiness

**Q: What is Hexagonal Architecture?**  
A: A structural pattern that separates the application core (domain + business rules) from external systems using abstract interfaces (ports) and concrete implementations (adapters).

**Q: What is the difference between a Port and an Adapter?**  
A: A Port is an interface defined by the domain (`TicketProvider`). An Adapter is a concrete class that implements the port for a specific technology (`OdooTicketProvider implements TicketProvider`).

**Q: Why does dependency go inward?**  
A: So the domain never breaks when infrastructure changes. Your `TicketService` doesn't know if it talks to Odoo or a flat file — it only knows the `TicketProvider` interface contract.
