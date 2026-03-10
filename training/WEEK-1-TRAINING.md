# Research: Hexagonal Architecture (Ports & Adapters)

## 1. Core Principles

Hexagonal Architecture, also known as **Ports & Adapters**, is an architectural pattern that aims to create loosely coupled application components that can be easily connected to their software environment by means of ports and adapters.

### Key Components

- **Domain (Core)**: The innermost part containing business logic and entities. It has no dependencies on external frameworks or tools.
- **Ports**: Interfaces that the domain defines to communicate with the outside world (e.g., `ITicketRepository`, `IOdooTicketProvider`).
- **Adapters**: Implementations of ports that bridge the gap between the domain and external systems (e.g., `JsonTicketRepository`, `OdooTicketAdapter`).
  - **Driven Adapters (Right Side)**: Called by the application (e.g., Database, External APIs).
  - **Driving Adapters (Left Side)**: Call the application (e.g., CLI, Web UI, REST Controllers).

### Dependency Rule

A key principle of Hexagonal Architecture is **dependency inversion**.

The domain core must not depend on external infrastructure such as:

- Databases
- Frameworks
- External APIs
- UI

Instead, the domain defines **ports (interfaces)**, and external systems provide **adapters** that implement those ports.

**Dependency direction:**

```
External Systems
     ↓
  Adapters
     ↓
   Ports
     ↓
Application
     ↓
 Domain
```

## 2. Pros & Cons

### Advantages

- **Testability**: The application core can be tested in isolation because dependencies are defined through ports (interfaces). External systems such as databases or APIs can be replaced with mocks or stubs during testing. This design also supports Test-Driven Development (TDD).

- **Maintainability**: Changes in infrastructure (e.g., switching databases or modifying API integrations) can be handled by replacing adapters without modifying the core domain logic.

- **Flexibility**: Multiple adapters can implement the same port. For example, a system may support both a REST API adapter and an Odoo adapter for managing tickets.

- **Independence**: The domain logic remains independent from frameworks, user interfaces, and database technologies.

### Disadvantages

- **Increased Complexity**: The architecture introduces additional abstractions such as ports, adapters, and data mapping layers, which may increase the amount of code.

- **Overhead for Simple Applications**: For small systems or simple CRUD applications, the added architectural structure may be unnecessary.

- **Learning Curve**: Developers familiar with traditional layered architecture may need time to understand concepts such as dependency inversion and port-adapter separation.

## 3. When to Apply

Hexagonal Architecture is most suitable when:

- **Long-lived applications**: Where technology stacks might evolve.
- **Applications with multiple entry points**: (e.g., CLI and Web).
- **Systems requiring high test coverage**: Especially for business rules.
- **Enterprise-level software**: Where domain logic is complex and needs protection.

### Scenario 1: External System Integration

A ticket management system needs to integrate with an external CRM such as Odoo.

Hexagonal Architecture allows the system to define a port for ticket providers and implement an adapter for Odoo without affecting the domain logic.

**Flow:**

```
External API (Odoo)
     ↓
  Odoo Adapter
     ↓
Ticket Provider Port
     ↓
Application Service
     ↓
Domain
```

### Scenario 2: Multiple Interfaces

A system may expose both:

- Web API
- CLI interface

Both interfaces can act as **driving adapters** interacting with the same application core.

## 4. Comparison with Alternative Architectures

| Architecture | Characteristics | Advantages | Disadvantages |
|---|---|---|---|
| **Layered Architecture** | UI → Service → Repository → DB | Simple and easy to implement | Business logic often tightly coupled with infrastructure |
| **Clean Architecture** | Strict separation of entities, use cases, and interfaces | Highly maintainable | More complex structure |
| **Onion Architecture** | Dependency inversion with circular layers | Strong domain protection | Less intuitive structure |
| **Hexagonal Architecture** | Ports & adapters isolate domain from infrastructure | Flexible integration and high testability | Additional abstraction and setup |

