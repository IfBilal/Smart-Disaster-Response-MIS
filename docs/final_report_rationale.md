# Design Rationale Document

## 1. Core Architectural Pillars
The Smart Disaster Response MIS is built on three fundamental pillars: **Data Integrity**, **Operational Transparency**, and **Fail-Safe Logic**.

### Database-First Integrity
Unlike traditional applications that rely on frontend validation, our system pushes all "Life-Saving Business Rules" into the SQL layer. This ensures that even if an API fails, the database will never allow a "ghost dispatch" or a "full hospital admission."

---

## 2. Key Design Decisions

### Separation of Citizens & Responders
We decoupled the `Citizens` and `Users` tables. This allows the general public to submit emergency reports without the friction of a login process, while maintaining strict Role-Based Access (RBAC) for the responders and admins.

### Incident-Centric Relationship Model
The `EmergencyReports` table acts as the central hub. Every resource dispatched, every patient admitted, and every team assigned is linked to a unique Report ID. This creates a complete "Breadcrumb Trail" from the initial report to the final resolution.

### Transaction-Wrapped Workflows
All multi-table updates (like dispatching a resource and deducting stock) are wrapped in **Explicit SQL Transactions**. This guarantees "All-or-Nothing" operations, critical for accurate resource management.

---

## 3. Technical Trade-offs
| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| **Raw SQL vs ORM** | Performance & Full Control | More boilerplate code |
| **Triggers for Business Logic** | Non-bypassable Integrity | Harder to debug than app code |
| **Extensive Auditing** | Complete Accountability | Moderate storage growth |

## 4. Conclusion
The Smart Disaster Response MIS is designed to be a **High-Performance, Trust-Neutral system**. By prioritizing database-level consistency and auditability, we provide a reliable platform for life-saving operations.
