# Design Rationale — Smart Disaster Response MIS

## 1. Entity & Relationship Choices

**Citizens vs Users**
Citizens (the public) and Users (system staff) are kept in separate tables deliberately. Citizens submit emergency reports without needing an account. Users are authenticated system staff with assigned roles. Merging them would mix authentication fields (password_hash, role) into public citizen records and create unnecessary NULL columns for unauthenticated reporters.

**EmergencyReports as the central entity**
EmergencyReports is the hub that connects citizens, operators, teams, resources, hospitals, and patients. All other modules (TeamAssignments, ResourceAllocations, Patients) hold a foreign key back to EmergencyReports, which reflects the real-world flow: everything starts from a reported emergency.

**DispatchLogs and TeamMembers as weak entities**
Both tables have composite primary keys where one part is a FK to the parent (team_id). DispatchLogs records field updates for a team over its mission life. TeamMembers records who is in which team. These are classic weak entities — their identity is only meaningful in the context of the parent team.

**WarehouseInventory as a relationship table with attributes**
The many-to-many between Warehouses and Resources carries two critical attributes: quantity_available and threshold_level. This makes WarehouseInventory not just a junction table but a proper entity with a composite PK.

---

## 2. Normalization (1NF → 4NF)

**1NF:** All tables have atomic values in each column and a defined primary key. No repeating groups — e.g., a citizen's multiple phone numbers are not stored as a comma list; only one phone is stored per citizen (simplification acceptable for this scope).

**2NF:** All non-key attributes in composite-PK tables depend on the full key. For example, in WarehouseInventory, quantity_available depends on both warehouse_id AND resource_id, not just one of them.

**3NF:** No transitive dependencies. For example, Resources stores resource_type — the type does not determine the unit_of_measure through an intermediate; it is an independent attribute. Warehouses stores manager_id as a direct FK rather than embedding manager contact info.

**4NF:** No multi-valued dependencies. We do not store, for example, multiple statuses or multiple locations in one row. Each table captures one fact per row.

---

## 3. Transaction Handling

Transactions are used wherever multiple tables must be updated atomically. The main cases are:

- **Resource dispatch**: Updating ResourceAllocations status to 'dispatched' must simultaneously deduct stock from WarehouseInventory. If the deduction fails (negative stock), the whole operation is rolled back. This prevents a resource from being marked dispatched when stock is actually insufficient.

- **Team assignment**: Inserting into TeamAssignments and updating EmergencyReports.status to 'in_progress' must succeed together. An assignment without a status update would leave the report appearing idle.

- **Donation recording**: Inserting into Donations and then into FinanceTransactions must be atomic. A donation record without a transaction record would produce an inconsistent financial ledger.

- **Patient admission**: Inserting a patient and decrementing hospital beds must be atomic. If beds were at zero and the decrement is attempted, the trigger rolls back the admission.

All transactions use the BEGIN TRY / BEGIN TRANSACTION / COMMIT / BEGIN CATCH / ROLLBACK pattern, which is the standard SQL Server ACID pattern.

---

## 4. RBAC Strategy

Roles are stored as a constrained NVARCHAR column directly in the Users table (CHECK constraint), not in a separate Roles table. For five fixed, well-defined roles that are unlikely to change, this is simpler and avoids an extra join on every auth check. A separate Roles table would be justified if roles needed dynamic management (add/remove roles without schema changes) — unnecessary here.

The five roles and their scopes:
- **admin**: Full access to all modules plus audit log and user management
- **emergency_operator**: Reports, teams, hospitals, approvals — the dispatcher role
- **field_officer**: Responds on the ground — reports, hospitals, resource requests
- **warehouse_manager**: Inventory, dispatch, resource approvals
- **finance_officer**: Donations, expenses, financial approvals

RBAC is enforced at two layers: the API layer (every route checks the JWT role before executing SQL) and the frontend middleware (Next.js middleware redirects unauthorized page routes).

---

## 5. Trigger Justification

Triggers enforce consistency rules that cannot be left to application code alone, because direct DB access or concurrent transactions could bypass application-level checks.

| Trigger | Event | Invariant Maintained |
|---------|-------|----------------------|
| trg_ResourceAllocation_Dispatch | UPDATE ResourceAllocations | Inventory never goes negative; deduction is atomic with status change |
| trg_TeamAssignment_Insert | INSERT TeamAssignments | Team status automatically changes to 'assigned'; log written |
| trg_TeamAssignment_Complete | UPDATE TeamAssignments | Team returns to 'available' when mission completed |
| trg_Patient_Admission | INSERT Patients | Hospital beds decremented; ROLLBACK if no beds available |
| trg_Patient_Discharge | UPDATE Patients | Beds incremented on discharge |
| trg_FinanceTransaction_AuditLog | INSERT FinanceTransactions | Every financial event is logged to AuditLog automatically |
| trg_EmergencyReport_AuditLog | INSERT, UPDATE EmergencyReports | All report changes are audited with before/after values |
| trg_ResourceAllocation_AuditLog | INSERT, UPDATE ResourceAllocations | Allocation pipeline is fully audited |
| trg_Inventory_LowStockAlert | UPDATE WarehouseInventory | Warehouse manager is notified when stock crosses threshold |
| trg_ApprovalRequest_Execute | UPDATE ApprovalRequests | Approved resource allocations are automatically linked |

---

## 6. View Justification

Views provide role-specific data abstractions and simplify complex joins for the frontend.

| View | Used By | Purpose |
|------|---------|---------|
| vw_ActiveEmergencyReports | Operators, Admins | Active reports with citizen contact and operator name |
| vw_TeamAvailability | Operators, Field Officers | Available teams with member counts |
| vw_WarehouseInventorySummary | Warehouse, Admins | Stock levels with low-stock flag across all warehouses |
| vw_HospitalCapacity | Field Officers, Operators | Real-time bed availability with occupancy percentage |
| vw_FinancialSummary | Finance, Admins | Aggregated financial overview — no raw donor data exposed |
| vw_ApprovalQueue | Admins, role-specific | Pending approvals with submitter context |
| vw_ResourceAllocationStatus | Warehouse, Admins | Full allocation pipeline status |
| vw_AuditSummary | Admins only | Human-readable audit trail with user names |

Views also serve as a security layer — the Finance Officer queries vw_FinancialSummary rather than the raw Donations table, which contains donor PII. The view exposes only aggregate totals.

---

## 7. Indexing Strategy

Indexes were chosen based on which columns appear most frequently in WHERE clauses, JOIN conditions, and ORDER BY clauses in the dashboard and report queries.

**Single-column indexes** cover frequently filtered columns: EmergencyReports.status, severity_level, disaster_type, location, reported_at — all used in the reports dashboard filters. AuditLog.action_timestamp is indexed because audit queries always have a date range filter.

**Composite indexes** cover multi-condition queries common in dashboards:
- (disaster_type, status) — used together in operator dashboard filters
- (location, severity_level) — used in geographic incident analysis
- (transaction_type, transaction_timestamp) — financial reports always filter by type and date
- (table_affected, action_timestamp) — audit log filters by table and date range

**Write overhead trade-off**: AuditLog is insert-heavy (every trigger writes here). To minimize write overhead, it carries only two indexes (action_timestamp and the composite). EmergencyReports is both read and write heavy — it gets selective composite indexes that cover the most common query patterns.

---

## 8. Performance Comparison Results

(See docs/performance_report.md for detailed measurements)

**Index impact on SELECT performance:**
- Filter by disaster_type + status: ~65% reduction in logical reads after composite index
- Filter by location + severity_level: ~58% reduction in logical reads
- AuditLog date range filter: ~70% reduction after IX_AuditLog_ActionTimestamp

**View vs direct query:**
- vw_WarehouseInventorySummary: comparable to direct JOIN (SQL Server optimizes the view query plan)
- vw_HospitalCapacity: 5-8ms faster than raw query in benchmarks (plan caching benefit)
- vw_FinancialSummary: uses scalar subqueries — direct query with equivalent subqueries produces same plan

**Write overhead of indexes:**
- 100 INSERT into EmergencyReports: ~23% longer with all 5 indexes vs none
- AuditLog (minimal indexes): only ~8% overhead on 1000 INSERTs

---

## 9. Trade-offs Summary

| Decision | Trade-off |
|----------|-----------|
| Role ENUM in Users table | Simpler schema vs less flexible for future role changes |
| AFTER triggers for consistency | Automatic enforcement vs harder to debug trigger chains |
| Views for role abstraction | Simpler frontend queries vs one more layer to maintain |
| Composite indexes on hot query paths | Faster reads vs slower writes on those tables |
| Minimal indexes on AuditLog | Fast inserts vs slower audit log read queries |
| Raw T-SQL (no ORM) | Full control + explicit queries vs more boilerplate code |
| JWT in httpOnly cookies | Secure XSS protection vs not usable from native apps |
