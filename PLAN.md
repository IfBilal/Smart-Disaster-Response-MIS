# Smart Disaster Response MIS — Full Implementation Plan

## Context

This is a university database project (Deadline: 3rd May 2026) that requires building a complete,
full-stack Smart Disaster Response Management Information System. The system must be built using
MS SQL Server 2022 (running as a Linux systemctl service on Ubuntu), Next.js (App Router), the
`mssql` npm package with raw T-SQL (no ORM), and `.env.local` for DB connection. The DB schema is
initialized manually via `sqlcmd` by running `.sql` files. All code follows MS SQL standards:
`IDENTITY(1,1)`, `GETDATE()`, `NVARCHAR`, `TOP` (not `LIMIT`).

The project covers 19 system requirements including emergency reporting, rescue teams, resource
management, hospital coordination, financial management, ACID transactions, RBAC, approval
workflows, data security, MIS analytics, audit logging, triggers, views, indexing/performance
analysis, and a complete Next.js frontend.

---

## Project File Structure

```
DB-Project/
├── descriptions/                  ← already exists (PDFs, ERD)
├── database/
│   ├── 01_schema.sql              ← DDL: all 20 CREATE TABLE statements
│   ├── 02_triggers.sql            ← all triggers (10+)
│   ├── 03_views.sql               ← all views (8)
│   ├── 04_indexes.sql             ← all indexes (single + composite)
│   ├── 05_seed.sql                ← sample DML data (INSERT INTO)
│   ├── 06_queries.sql             ← key T-SQL queries used in app
│   ├── 07_transactions.sql        ← transaction demonstrations
│   └── performance/
│       ├── index_analysis.sql     ← benchmarking with/without indexes
│       └── view_analysis.sql      ← benchmarking views vs base tables
├── docs/
│   ├── design_rationale.md        ← deliverable #10
│   └── performance_report.md      ← deliverable #8 (latency analysis)
└── src/                           ← Next.js app (npx create-next-app)
    ├── .env.local
    ├── package.json
    ├── lib/
    │   ├── db.ts                  ← mssql connection pool
    │   ├── auth.ts                ← JWT helpers + bcrypt
    │   └── rbac.ts                ← role permission check middleware
    ├── middleware.ts               ← route protection by role
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx               ← redirect to login
    │   ├── login/page.tsx
    │   └── dashboard/
    │       ├── admin/
    │       ├── operator/
    │       ├── field-officer/
    │       ├── warehouse/
    │       └── finance/
    └── app/api/
        ├── auth/
        ├── reports/
        ├── teams/
        ├── resources/
        ├── hospitals/
        ├── financial/
        ├── approvals/
        ├── analytics/
        └── audit/
```

---

## Phase 1 — Database Schema (DDL) `database/01_schema.sql`

### All 20 Tables (MS SQL, run via `sqlcmd -S localhost -U sa -P <pwd> -i database/01_schema.sql`)

The database is named `DisasterMIS`. All tables use `IDENTITY(1,1)` for auto-increment PKs,
`GETDATE()` for defaults, and `NVARCHAR` for strings.

---

### Group A — User Management & Authentication

**TABLE: `Users`**
```
user_id        INT             PK IDENTITY(1,1) NOT NULL
username       NVARCHAR(50)    UNIQUE NOT NULL
email          NVARCHAR(100)   UNIQUE NOT NULL
phone          NVARCHAR(20)    NULL
role           NVARCHAR(30)    NOT NULL  CHECK IN ('admin','emergency_operator','field_officer','warehouse_manager','finance_officer')
password_hash  NVARCHAR(255)   NOT NULL   ← bcrypt hash, never plaintext
is_active      BIT             NOT NULL DEFAULT 1
created_at     DATETIME        NOT NULL DEFAULT GETDATE()
```

**TABLE: `Citizens`**
```
citizen_id     INT             PK IDENTITY(1,1) NOT NULL
full_name      NVARCHAR(100)   NOT NULL
cnic           NCHAR(15)       UNIQUE NULL         ← Pakistani CNIC
phone          NVARCHAR(20)    NULL
address        NVARCHAR(MAX)   NULL
registered_at  DATETIME        NOT NULL DEFAULT GETDATE()
```

---

### Group B — Emergency Reporting

**TABLE: `EmergencyReports`**
```
report_id      INT             PK IDENTITY(1,1) NOT NULL
citizen_id     INT             NOT NULL FK→Citizens(citizen_id)
operator_id    INT             NULL     FK→Users(user_id)
disaster_type  NVARCHAR(50)    NOT NULL  ← 'flood','earthquake','fire','other'
severity_level NVARCHAR(20)    NOT NULL  CHECK IN ('low','medium','high','critical')
location       NVARCHAR(255)   NOT NULL
latitude       DECIMAL(10,7)   NULL
longitude      DECIMAL(10,7)   NULL
status         NVARCHAR(20)    NOT NULL DEFAULT 'pending'  CHECK IN ('pending','in_progress','resolved','closed')
reported_at    DATETIME        NOT NULL DEFAULT GETDATE()
resolved_at    DATETIME        NULL
```

**TABLE: `MediaAttachments`**
```
attachment_id  INT             PK IDENTITY(1,1) NOT NULL
report_id      INT             NOT NULL FK→EmergencyReports(report_id)
file_url       NVARCHAR(500)   NOT NULL
media_type     NVARCHAR(50)    NOT NULL  ← 'image','video','audio','document'
uploaded_at    DATETIME        NOT NULL DEFAULT GETDATE()
uploaded_by    INT             NULL     FK→Users(user_id)
```

**TABLE: `Notifications`**
```
notification_id INT            PK IDENTITY(1,1) NOT NULL
user_id         INT            NOT NULL FK→Users(user_id)
message         NVARCHAR(MAX)  NOT NULL
notification_type NVARCHAR(50) NOT NULL  ← 'alert','assignment','approval','system'
is_read         BIT            NOT NULL DEFAULT 0
sent_at         DATETIME       NOT NULL DEFAULT GETDATE()
```

---

### Group C — Rescue Operations

**TABLE: `RescueTeams`**
```
team_id             INT           PK IDENTITY(1,1) NOT NULL
team_name           NVARCHAR(100) NOT NULL
team_type           NVARCHAR(20)  NOT NULL  CHECK IN ('medical','fire','rescue')
current_location    NVARCHAR(255) NULL
availability_status NVARCHAR(20)  NOT NULL DEFAULT 'available'  CHECK IN ('available','assigned','busy','completed')
capacity            INT           NOT NULL DEFAULT 1
```

**TABLE: `TeamMembers`** ← composite PK (weak entity)
```
team_id      INT           PK, FK→RescueTeams(team_id) NOT NULL
member_id    INT           PK NOT NULL  ← partial key, auto-assigned in app
user_id      INT           NOT NULL UNIQUE FK→Users(user_id)
member_role  NVARCHAR(50)  NULL
joined_at    DATETIME      NOT NULL DEFAULT GETDATE()
CONSTRAINT PK_TeamMembers PRIMARY KEY (team_id, member_id)
```

**TABLE: `TeamAssignments`**
```
assignment_id  INT           PK IDENTITY(1,1) NOT NULL
team_id        INT           NOT NULL FK→RescueTeams(team_id)
report_id      INT           NOT NULL FK→EmergencyReports(report_id)
assigned_at    DATETIME      NOT NULL DEFAULT GETDATE()
completed_at   DATETIME      NULL
status         NVARCHAR(20)  NOT NULL DEFAULT 'assigned'  CHECK IN ('assigned','in_progress','completed','cancelled')
notes          NVARCHAR(MAX) NULL
```

**TABLE: `DispatchLogs`** ← composite PK (weak entity)
```
team_id          INT           PK, FK→RescueTeams(team_id) NOT NULL
log_id           INT           PK NOT NULL IDENTITY(1,1)
status_update    NVARCHAR(255) NOT NULL
location_update  NVARCHAR(255) NULL
warehouse_id     INT           NULL FK→Warehouses(warehouse_id)
logged_at        DATETIME      NOT NULL DEFAULT GETDATE()
CONSTRAINT PK_DispatchLogs PRIMARY KEY (team_id, log_id)
```
Note: MS SQL allows IDENTITY on a composite PK column; alternatively use a sequence.

---

### Group D — Hospital & Patient Management

**TABLE: `Hospitals`**
```
hospital_id     INT           PK IDENTITY(1,1) NOT NULL
name            NVARCHAR(150) NOT NULL
location        NVARCHAR(255) NOT NULL
total_beds      INT           NOT NULL DEFAULT 0
available_beds  INT           NOT NULL DEFAULT 0  CHECK (available_beds >= 0)
contact_number  NVARCHAR(20)  NULL
is_active       BIT           NOT NULL DEFAULT 1
```

**TABLE: `Patients`**
```
patient_id       INT           PK IDENTITY(1,1) NOT NULL
report_id        INT           NOT NULL FK→EmergencyReports(report_id)
hospital_id      INT           NULL     FK→Hospitals(hospital_id)
field_officer_id INT           NULL     FK→Users(user_id)
admission_time   DATETIME      NOT NULL
discharge_time   DATETIME      NULL
condition        NVARCHAR(100) NOT NULL  ← 'stable','critical','serious','discharged'
```

---

### Group E — Warehouse, Resource & Allocation

**TABLE: `Warehouses`**
```
warehouse_id    INT           PK IDENTITY(1,1) NOT NULL
manager_id      INT           NULL FK→Users(user_id)
name            NVARCHAR(150) NOT NULL
location        NVARCHAR(255) NOT NULL
total_capacity  INT           NOT NULL DEFAULT 0
created_at      DATETIME      NOT NULL DEFAULT GETDATE()
```

**TABLE: `Resources`**
```
resource_id      INT           PK IDENTITY(1,1) NOT NULL
resource_name    NVARCHAR(100) NOT NULL
resource_type    NVARCHAR(50)  NOT NULL  CHECK IN ('food','water','medicine','shelter','equipment')
unit_of_measure  NVARCHAR(20)  NOT NULL  ← 'kg','litre','unit','box'
description      NVARCHAR(MAX) NULL
```

**TABLE: `WarehouseInventory`** ← composite PK (weak entity)
```
warehouse_id        INT             PK, FK→Warehouses(warehouse_id) NOT NULL
resource_id         INT             PK, FK→Resources(resource_id) NOT NULL
quantity_available  DECIMAL(12,2)   NOT NULL DEFAULT 0  CHECK (quantity_available >= 0)
threshold_level     DECIMAL(12,2)   NOT NULL DEFAULT 0
last_updated        DATETIME        NOT NULL DEFAULT GETDATE()
CONSTRAINT PK_WarehouseInventory PRIMARY KEY (warehouse_id, resource_id)
```

**TABLE: `ResourceAllocations`**
```
allocation_id   INT           PK IDENTITY(1,1) NOT NULL
report_id       INT           NOT NULL FK→EmergencyReports(report_id)
resource_id     INT           NOT NULL FK→Resources(resource_id)
warehouse_id    INT           NOT NULL FK→Warehouses(warehouse_id)
qty_requested   DECIMAL(12,2) NOT NULL  CHECK (qty_requested > 0)
qty_dispatched  DECIMAL(12,2) NOT NULL DEFAULT 0  CHECK (qty_dispatched >= 0)
qty_consumed    DECIMAL(12,2) NOT NULL DEFAULT 0  CHECK (qty_consumed >= 0)
status          NVARCHAR(20)  NOT NULL DEFAULT 'pending'  CHECK IN ('pending','approved','dispatched','consumed','rejected')
requested_at    DATETIME      NOT NULL DEFAULT GETDATE()
approved_by     INT           NULL FK→Users(user_id)
```

**TABLE: `ApprovalRequests`**
```
approval_id    INT           PK IDENTITY(1,1) NOT NULL
allocation_id  INT           NULL FK→ResourceAllocations(allocation_id)
request_type   NVARCHAR(60)  NOT NULL  ← 'resource_allocation','financial','deployment'
reference_id   INT           NULL       ← polymorphic FK to the entity being approved
status         NVARCHAR(20)  NOT NULL DEFAULT 'pending'  CHECK IN ('pending','approved','rejected')
requested_at   DATETIME      NOT NULL DEFAULT GETDATE()
reviewed_at    DATETIME      NULL
remarks        NVARCHAR(MAX) NULL
requested_by   INT           NOT NULL FK→Users(user_id)
reviewed_by    INT           NULL     FK→Users(user_id)
```

---

### Group F — Financial Management

**TABLE: `Donations`**
```
donation_id     INT           PK IDENTITY(1,1) NOT NULL
received_by     INT           NULL FK→Users(user_id)
donor_name      NVARCHAR(150) NOT NULL
donor_type      NVARCHAR(30)  NOT NULL  CHECK IN ('individual','organization','government')
amount          DECIMAL(15,2) NOT NULL  CHECK (amount > 0)
payment_method  NVARCHAR(50)  NULL  ← 'cash','bank_transfer','online','cheque'
donated_at      DATETIME      NOT NULL DEFAULT GETDATE()
```

**TABLE: `Expenses`**
```
expense_id    INT           PK IDENTITY(1,1) NOT NULL
recorded_by   INT           NOT NULL FK→Users(user_id)
allocation_id INT           NULL FK→ResourceAllocations(allocation_id)
category      NVARCHAR(100) NOT NULL  ← 'procurement','logistics','medical','admin','other'
amount        DECIMAL(15,2) NOT NULL  CHECK (amount > 0)
description   NVARCHAR(MAX) NULL
expense_date  DATE          NOT NULL
```

**TABLE: `FinanceTransactions`**
```
transaction_id        INT           PK IDENTITY(1,1) NOT NULL
performed_by          INT           NOT NULL FK→Users(user_id)
donation_id           INT           NULL FK→Donations(donation_id)
expense_id            INT           NULL FK→Expenses(expense_id)
transaction_type      NVARCHAR(30)  NOT NULL  CHECK IN ('donation','expense','procurement','transfer')
amount                DECIMAL(15,2) NOT NULL  CHECK (amount > 0)
transaction_timestamp DATETIME      NOT NULL DEFAULT GETDATE()
status                NVARCHAR(20)  NOT NULL DEFAULT 'completed'  CHECK IN ('pending','completed','failed','reversed')
-- XOR constraint: exactly one of donation_id/expense_id must be non-NULL
-- enforced via CHECK: (donation_id IS NULL AND expense_id IS NOT NULL) OR (donation_id IS NOT NULL AND expense_id IS NULL)
```

---

### Group G — Audit & Monitoring

**TABLE: `AuditLog`** ← IMMUTABLE, INSERT only (no UPDATE/DELETE allowed via app)
```
log_id            BIGINT        PK IDENTITY(1,1) NOT NULL   ← BIGINT for high volume
user_id           INT           NULL FK→Users(user_id)      ← NULL for system events
action_type       NVARCHAR(20)  NOT NULL  CHECK IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT')
table_affected    NVARCHAR(60)  NOT NULL
record_id         BIGINT        NULL
old_value         NVARCHAR(MAX) NULL   ← JSON string (before-image)
new_value         NVARCHAR(MAX) NULL   ← JSON string (after-image)
ip_address        NVARCHAR(45)  NULL
action_timestamp  DATETIME      NOT NULL DEFAULT GETDATE()
```

---

## Phase 2 — Triggers `database/02_triggers.sql`

All triggers use MS SQL `AFTER` trigger syntax. `INSERTED` and `DELETED` pseudo-tables are used.

### Trigger 1: `trg_ResourceAllocation_Dispatch`
**Event:** AFTER UPDATE on `ResourceAllocations`
**Purpose:** When `status` changes to `'dispatched'`, deduct `qty_dispatched` from
`WarehouseInventory.quantity_available`. ROLLBACK if stock would go negative (prevents negative
inventory per Requirement 13).
```sql
-- Fires on: UPDATE ResourceAllocations
-- If INSERTED.status = 'dispatched' AND DELETED.status != 'dispatched':
--   UPDATE WarehouseInventory SET quantity_available = quantity_available - INSERTED.qty_dispatched
--   WHERE warehouse_id = INSERTED.warehouse_id AND resource_id = INSERTED.resource_id
--   If quantity_available would become < 0: ROLLBACK TRANSACTION + RAISERROR
```

### Trigger 2: `trg_TeamAssignment_Insert`
**Event:** AFTER INSERT on `TeamAssignments`
**Purpose:** Automatically change `RescueTeams.availability_status` from `'available'` to
`'assigned'` when a new assignment is created. Logs to `DispatchLogs`. Fulfills Requirement 2
(real-time status updates).
```sql
-- UPDATE RescueTeams SET availability_status = 'assigned'
-- WHERE team_id = INSERTED.team_id
-- INSERT INTO DispatchLogs (team_id, status_update) VALUES (INSERTED.team_id, 'Team assigned to report')
```

### Trigger 3: `trg_TeamAssignment_Complete`
**Event:** AFTER UPDATE on `TeamAssignments`
**Purpose:** When `status` changes to `'completed'`, update `RescueTeams.availability_status`
back to `'available'` and record `completed_at` timestamp. Requirement 2.
```sql
-- If INSERTED.status = 'completed':
--   UPDATE RescueTeams SET availability_status = 'available' WHERE team_id = INSERTED.team_id
--   INSERT INTO DispatchLogs (team_id, status_update) VALUES (team_id, 'Mission completed')
```

### Trigger 4: `trg_Patient_Admission`
**Event:** AFTER INSERT on `Patients`
**Purpose:** Decrement `Hospitals.available_beds` when a patient is admitted (hospital_id IS NOT
NULL). ROLLBACK if no beds available. Requirement 4 (automated patient assignment, load
balancing).
```sql
-- If INSERTED.hospital_id IS NOT NULL:
--   UPDATE Hospitals SET available_beds = available_beds - 1
--   WHERE hospital_id = INSERTED.hospital_id
--   If available_beds would become < 0: ROLLBACK + RAISERROR('No beds available')
```

### Trigger 5: `trg_Patient_Discharge`
**Event:** AFTER UPDATE on `Patients`
**Purpose:** When `discharge_time` changes from NULL to a value (patient discharged), increment
`Hospitals.available_beds`. Requirement 4.
```sql
-- If DELETED.discharge_time IS NULL AND INSERTED.discharge_time IS NOT NULL:
--   UPDATE Hospitals SET available_beds = available_beds + 1
--   WHERE hospital_id = INSERTED.hospital_id
```

### Trigger 6: `trg_FinanceTransaction_AuditLog`
**Event:** AFTER INSERT on `FinanceTransactions`
**Purpose:** Automatically log every financial transaction to `AuditLog`. Requirement 13
(logging financial transactions into audit tables).
```sql
-- INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, new_value, action_timestamp)
-- SELECT INSERTED.performed_by, 'INSERT', 'FinanceTransactions', INSERTED.transaction_id,
--        (JSON of new row), GETDATE()
```

### Trigger 7: `trg_EmergencyReport_AuditLog`
**Event:** AFTER INSERT, UPDATE on `EmergencyReports`
**Purpose:** Log all report creations and status changes to `AuditLog`. Requirement 12.
```sql
-- On INSERT: log action_type='INSERT', new_value = JSON of new row
-- On UPDATE: log action_type='UPDATE', old_value = JSON of DELETED row, new_value = JSON of INSERTED row
```

### Trigger 8: `trg_ResourceAllocation_AuditLog`
**Event:** AFTER INSERT, UPDATE on `ResourceAllocations`
**Purpose:** Maintain audit trail for all allocation operations. Requirement 12.
```sql
-- Similar structure to trg_EmergencyReport_AuditLog
```

### Trigger 9: `trg_Inventory_LowStockAlert`
**Event:** AFTER UPDATE on `WarehouseInventory`
**Purpose:** When `quantity_available` drops below `threshold_level`, automatically insert a
notification for the warehouse manager. Requirement 3 (resource threshold alerts).
```sql
-- If INSERTED.quantity_available < INSERTED.threshold_level
--   AND DELETED.quantity_available >= DELETED.threshold_level (only alert on crossing threshold):
--   INSERT INTO Notifications (user_id, message, notification_type)
--   SELECT w.manager_id, 'Low stock alert for resource ' + r.resource_name + ' in warehouse ' + w.name, 'alert'
--   FROM Warehouses w JOIN Resources r ON r.resource_id = INSERTED.resource_id
--   WHERE w.warehouse_id = INSERTED.warehouse_id AND w.manager_id IS NOT NULL
```

### Trigger 10: `trg_ApprovalRequest_Execute`
**Event:** AFTER UPDATE on `ApprovalRequests`
**Purpose:** When `status` changes to `'approved'` for a `resource_allocation` type request,
automatically update the linked `ResourceAllocations.status` to `'approved'` and set
`approved_by`. Requirement 9 (execution only after approval).
```sql
-- If INSERTED.status = 'approved' AND DELETED.status = 'pending':
--   If INSERTED.request_type = 'resource_allocation':
--     UPDATE ResourceAllocations SET status = 'approved', approved_by = INSERTED.reviewed_by
--     WHERE allocation_id = INSERTED.allocation_id
--   Log to AuditLog
```

---

## Phase 3 — Views `database/03_views.sql`

All views provide role-specific data visibility and simplify complex joins. Requirement 13.

### View 1: `vw_ActiveEmergencyReports`
**Used by:** Emergency Operators, Admins
**Purpose:** All pending/in_progress reports with citizen contact info and assigned operator name.
```sql
CREATE VIEW vw_ActiveEmergencyReports AS
SELECT r.report_id, r.disaster_type, r.severity_level, r.location, r.latitude, r.longitude,
       r.status, r.reported_at, c.full_name AS citizen_name, c.phone AS citizen_phone,
       u.username AS assigned_operator
FROM EmergencyReports r
JOIN Citizens c ON c.citizen_id = r.citizen_id
LEFT JOIN Users u ON u.user_id = r.operator_id
WHERE r.status IN ('pending', 'in_progress')
```

### View 2: `vw_TeamAvailability`
**Used by:** Field Officers, Emergency Operators
**Purpose:** Available rescue teams with member count and type. Used for dynamic assignment.
```sql
CREATE VIEW vw_TeamAvailability AS
SELECT t.team_id, t.team_name, t.team_type, t.current_location, t.availability_status,
       t.capacity, COUNT(tm.member_id) AS current_members
FROM RescueTeams t
LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
GROUP BY t.team_id, t.team_name, t.team_type, t.current_location, t.availability_status, t.capacity
```

### View 3: `vw_WarehouseInventorySummary`
**Used by:** Warehouse Managers, Admins
**Purpose:** Current stock levels across all warehouses with low-stock flag.
```sql
CREATE VIEW vw_WarehouseInventorySummary AS
SELECT w.warehouse_id, w.name AS warehouse_name, w.location,
       r.resource_name, r.resource_type, r.unit_of_measure,
       wi.quantity_available, wi.threshold_level,
       CASE WHEN wi.quantity_available < wi.threshold_level THEN 1 ELSE 0 END AS is_low_stock,
       wi.last_updated
FROM WarehouseInventory wi
JOIN Warehouses w ON w.warehouse_id = wi.warehouse_id
JOIN Resources r ON r.resource_id = wi.resource_id
```

### View 4: `vw_HospitalCapacity`
**Used by:** Field Officers, Emergency Operators
**Purpose:** Real-time hospital bed availability. Hides internal patient details.
```sql
CREATE VIEW vw_HospitalCapacity AS
SELECT h.hospital_id, h.name, h.location, h.total_beds, h.available_beds,
       h.total_beds - h.available_beds AS occupied_beds,
       CAST(ROUND(100.0*(h.total_beds - h.available_beds)/NULLIF(h.total_beds,0),1) AS DECIMAL(5,1)) AS occupancy_pct,
       h.contact_number, h.is_active
FROM Hospitals h
WHERE h.is_active = 1
```

### View 5: `vw_FinancialSummary`
**Used by:** Finance Officers, Admins (RESTRICTED — no raw citizen/donor data shown to others)
**Purpose:** Aggregated financial overview — total donations, expenses, net balance.
```sql
CREATE VIEW vw_FinancialSummary AS
SELECT
  (SELECT ISNULL(SUM(amount),0) FROM Donations) AS total_donations,
  (SELECT ISNULL(SUM(amount),0) FROM Expenses)  AS total_expenses,
  (SELECT ISNULL(SUM(amount),0) FROM Donations) - (SELECT ISNULL(SUM(amount),0) FROM Expenses) AS net_balance,
  (SELECT COUNT(*) FROM FinanceTransactions WHERE status='pending') AS pending_transactions
```

### View 6: `vw_ApprovalQueue`
**Used by:** Admins (full queue), role-specific partial views for others
**Purpose:** All pending approval requests with submitter info and context.
```sql
CREATE VIEW vw_ApprovalQueue AS
SELECT ar.approval_id, ar.request_type, ar.reference_id, ar.status,
       ar.requested_at, ar.remarks,
       u1.username AS requested_by_name, u1.role AS requested_by_role,
       u2.username AS reviewed_by_name
FROM ApprovalRequests ar
JOIN Users u1 ON u1.user_id = ar.requested_by
LEFT JOIN Users u2 ON u2.user_id = ar.reviewed_by
WHERE ar.status = 'pending'
```

### View 7: `vw_ResourceAllocationStatus`
**Used by:** Warehouse Managers, Admins
**Purpose:** Full allocation pipeline — what was requested, approved, dispatched, consumed.
```sql
CREATE VIEW vw_ResourceAllocationStatus AS
SELECT ra.allocation_id, er.disaster_type, er.location AS incident_location,
       r.resource_name, r.resource_type, r.unit_of_measure,
       w.name AS warehouse_name,
       ra.qty_requested, ra.qty_dispatched, ra.qty_consumed,
       ra.qty_requested - ra.qty_dispatched AS qty_pending_dispatch,
       ra.status, ra.requested_at,
       u.username AS approved_by_name
FROM ResourceAllocations ra
JOIN EmergencyReports er ON er.report_id = ra.report_id
JOIN Resources r ON r.resource_id = ra.resource_id
JOIN Warehouses w ON w.warehouse_id = ra.warehouse_id
LEFT JOIN Users u ON u.user_id = ra.approved_by
```

### View 8: `vw_AuditSummary`
**Used by:** Admins only
**Purpose:** Human-readable audit trail with user names and formatted timestamps.
```sql
CREATE VIEW vw_AuditSummary AS
SELECT al.log_id, al.action_type, al.table_affected, al.record_id,
       ISNULL(u.username, 'SYSTEM') AS performed_by,
       al.old_value, al.new_value, al.ip_address, al.action_timestamp
FROM AuditLog al
LEFT JOIN Users u ON u.user_id = al.user_id
```

---

## Phase 4 — Indexes `database/04_indexes.sql`

Requirement 14: both single-column and composite indexes. Performance analysis is documented in
`docs/performance_report.md`.

### Single-Column Indexes
```sql
-- Frequently filtered columns
CREATE INDEX IX_EmergencyReports_Location        ON EmergencyReports(location)
CREATE INDEX IX_EmergencyReports_DisasterType    ON EmergencyReports(disaster_type)
CREATE INDEX IX_EmergencyReports_SeverityLevel   ON EmergencyReports(severity_level)
CREATE INDEX IX_EmergencyReports_Status          ON EmergencyReports(status)
CREATE INDEX IX_EmergencyReports_ReportedAt      ON EmergencyReports(reported_at)
CREATE INDEX IX_Resources_ResourceType           ON Resources(resource_type)
CREATE INDEX IX_ResourceAllocations_Status       ON ResourceAllocations(status)
CREATE INDEX IX_FinanceTransactions_Timestamp    ON FinanceTransactions(transaction_timestamp)
CREATE INDEX IX_FinanceTransactions_Type         ON FinanceTransactions(transaction_type)
CREATE INDEX IX_AuditLog_ActionTimestamp         ON AuditLog(action_timestamp)
CREATE INDEX IX_Notifications_UserId_IsRead      ON Notifications(user_id, is_read)
```

### Composite Indexes
```sql
-- Multi-condition queries common in dashboards
CREATE INDEX IX_EmergencyReports_Location_Severity   ON EmergencyReports(location, severity_level)
CREATE INDEX IX_EmergencyReports_DisasterType_Status ON EmergencyReports(disaster_type, status)
CREATE INDEX IX_ResourceAllocations_Report_Status    ON ResourceAllocations(report_id, status)
CREATE INDEX IX_FinanceTransactions_Type_Timestamp   ON FinanceTransactions(transaction_type, transaction_timestamp)
CREATE INDEX IX_AuditLog_Table_Timestamp             ON AuditLog(table_affected, action_timestamp)
CREATE INDEX IX_TeamAssignments_Team_Status          ON TeamAssignments(team_id, status)
CREATE INDEX IX_WarehouseInventory_Resource_Qty      ON WarehouseInventory(resource_id, quantity_available)
```

### Performance Analysis (to be documented in `docs/performance_report.md`)
For each major query (e.g., "filter reports by location AND severity"), run:
1. Without index: `SET STATISTICS TIME ON; <query>; SET STATISTICS TIME OFF`
2. With index: same query after index creation
3. Record: CPU time (ms), elapsed time (ms), logical reads
4. Document cases where indexing improves SELECT performance
5. Document overhead cases: heavy INSERT workloads on `EmergencyReports` and `AuditLog`
   (high-frequency insert tables) — show that composite indexes add write latency

---

## Phase 5 — Seed Data `database/05_seed.sql`

Minimum realistic seed data for demo:
- 6 Users (1 per role + 1 extra admin)
- 5 Citizens
- 10 EmergencyReports (mix of severity/status/disaster_type)
- 3 RescueTeams (1 medical, 1 fire, 1 rescue) with TeamMembers
- 3 Hospitals with varying bed counts
- 3 Warehouses with WarehouseInventory entries for 6 resource types
- 5 ResourceAllocations (various statuses)
- 5 ApprovalRequests
- 5 Donations, 5 Expenses, 10 FinanceTransactions
- Enough AuditLog entries to demonstrate the audit trail

---

## Phase 6 — Transaction Demonstrations `database/07_transactions.sql`

Each block uses `BEGIN TRANSACTION / COMMIT / ROLLBACK` with error handling via `TRY/CATCH`.

### Transaction A: Resource Allocation Dispatch
Atomically: approve a resource allocation + deduct inventory. If inventory insufficient → ROLLBACK.
```sql
BEGIN TRY
  BEGIN TRANSACTION
    UPDATE ResourceAllocations
    SET status = 'dispatched', qty_dispatched = @qty, approved_by = @user_id
    WHERE allocation_id = @allocation_id
    -- Trigger trg_ResourceAllocation_Dispatch fires here and deducts inventory
    -- If trigger RAISERRORs (insufficient stock), control goes to CATCH
  COMMIT TRANSACTION
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION
  -- Re-raise or log error
END CATCH
```

### Transaction B: Rescue Team Assignment
Atomically: create assignment + update report status + update team availability.
```sql
BEGIN TRY
  BEGIN TRANSACTION
    INSERT INTO TeamAssignments (team_id, report_id, status) VALUES (@team_id, @report_id, 'assigned')
    -- Trigger trg_TeamAssignment_Insert fires: sets team status to 'assigned'
    UPDATE EmergencyReports SET status = 'in_progress', operator_id = @operator_id
    WHERE report_id = @report_id
  COMMIT TRANSACTION
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION
END CATCH
```

### Transaction C: Financial Transaction Recording
Atomically: insert donation + create finance transaction record.
```sql
BEGIN TRY
  BEGIN TRANSACTION
    INSERT INTO Donations (received_by, donor_name, donor_type, amount, payment_method)
    VALUES (@received_by, @donor_name, @donor_type, @amount, @method)
    DECLARE @did INT = SCOPE_IDENTITY()
    INSERT INTO FinanceTransactions (performed_by, donation_id, transaction_type, amount, status)
    VALUES (@performed_by, @did, 'donation', @amount, 'completed')
    -- Trigger trg_FinanceTransaction_AuditLog fires: logs to AuditLog
  COMMIT TRANSACTION
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION
END CATCH
```

### Transaction D: Approval-Based Resource Dispatch (multi-step)
Atomically: create ApprovalRequest → (separate step) approve it → trigger executes allocation.
Demonstrates the full approval workflow.

### Transaction E: Patient Hospital Assignment
Atomically: insert patient + decrement hospital beds. ROLLBACK if hospital full.

---

## Phase 7 — Backend API (Next.js API Routes)

### Connection Setup `src/lib/db.ts`
```typescript
import sql from 'mssql'
const config: sql.config = {
  server: process.env.DB_SERVER!,       // 'localhost'
  port: 1433,
  database: process.env.DB_NAME!,       // 'DisasterMIS'
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: { encrypt: false, trustServerCertificate: true }
}
// Singleton connection pool
let pool: sql.ConnectionPool
export async function getPool() {
  if (!pool) pool = await sql.connect(config)
  return pool
}
```

### Auth Setup `src/lib/auth.ts`
- `bcryptjs` for password hashing (hash on register, compare on login)
- `jsonwebtoken` for JWT tokens (stored in httpOnly cookies)
- JWT payload: `{ user_id, username, role }`
- Token expiry: 8 hours

### RBAC Middleware `src/lib/rbac.ts`
- `checkRole(allowedRoles: string[])` — verifies JWT, checks role against allowed list
- Used in every API route handler as: `checkRole(['admin', 'emergency_operator'])(req, res, next)`
- Returns 403 if role not permitted

### `.env.local`
```
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=DisasterMIS
DB_USER=sa
DB_PASSWORD=<your_sa_password>
JWT_SECRET=<random_secret>
```

---

### API Routes

#### Auth: `src/app/api/auth/`
| File | Method | Purpose |
|------|--------|---------|
| `login/route.ts` | POST | Authenticate user, return JWT in httpOnly cookie. Query `Users` table, compare bcrypt hash. |
| `logout/route.ts` | POST | Clear JWT cookie. Insert LOGIN/LOGOUT into AuditLog. |
| `me/route.ts` | GET | Return current user info from JWT. |

#### Emergency Reports: `src/app/api/reports/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `route.ts` | GET | all auth | List reports. Supports filters: `?status=`, `?severity=`, `?disaster_type=`, `?location=`. Uses `TOP` + offset for pagination. Emergency Operators see all; Field Officers see assigned. |
| `route.ts` | POST | citizen/operator | Create new report. INSERT into `EmergencyReports`. |
| `[id]/route.ts` | GET | all auth | Single report detail with attachments, assignments. |
| `[id]/route.ts` | PUT | operator/admin | Update status (`in_progress`, `resolved`, `closed`). |

#### Rescue Teams: `src/app/api/teams/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `route.ts` | GET | all auth | List teams. Filter by type, status, location. |
| `route.ts` | POST | admin | Create rescue team. |
| `[id]/route.ts` | GET | all auth | Team detail + assignment history. |
| `[id]/route.ts` | PUT | admin/operator | Update team location, status. |
| `[id]/assign/route.ts` | POST | operator/admin | Assign team to report. Runs Transaction B. |

#### Resources: `src/app/api/resources/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `inventory/route.ts` | GET | warehouse/admin | Warehouse inventory summary. Reads from `vw_WarehouseInventorySummary`. |
| `inventory/route.ts` | PUT | warehouse | Update inventory quantities directly. |
| `allocate/route.ts` | POST | field_officer/operator | Create allocation request. INSERT into `ResourceAllocations` + `ApprovalRequests`. |
| `allocate/[id]/dispatch/route.ts` | PUT | warehouse | Set status to dispatched. Runs Transaction A. |

#### Hospitals: `src/app/api/hospitals/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `route.ts` | GET | all auth | List hospitals from `vw_HospitalCapacity`. |
| `route.ts` | POST | admin | Add new hospital. |
| `[id]/route.ts` | PUT | admin | Update hospital info/bed counts. |
| `patients/route.ts` | GET | field/admin | List patients. |
| `patients/route.ts` | POST | field_officer | Admit patient. Runs Transaction E (trigger decrements beds). |
| `patients/[id]/route.ts` | PUT | field_officer | Update patient condition or discharge. Trigger increments beds on discharge. |

#### Financial: `src/app/api/financial/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `donations/route.ts` | GET/POST | finance | List/create donations. POST runs Transaction C. |
| `expenses/route.ts` | GET/POST | finance | List/create expenses. |
| `transactions/route.ts` | GET | finance/admin | All transactions from `vw_FinancialSummary`. |

#### Approvals: `src/app/api/approvals/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `route.ts` | GET | admin/manager/finance | Pending approvals from `vw_ApprovalQueue`. Role-filtered. |
| `route.ts` | POST | any auth | Create new approval request. |
| `[id]/review/route.ts` | PUT | admin/manager/finance | Approve or reject. UPDATE `ApprovalRequests.status`. Trigger fires if approved. |

#### Analytics/MIS: `src/app/api/analytics/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `incidents/route.ts` | GET | all auth | Incident stats: count by disaster_type, severity, location. Uses indexed columns. |
| `resources/route.ts` | GET | warehouse/admin | Resource utilization: dispatched vs consumed per resource type. |
| `response-time/route.ts` | GET | admin/operator | Average time from `reported_at` to `resolved_at` per disaster type. |
| `financial/route.ts` | GET | finance/admin | Financial summary: total donations, expenses, balance. Reads from `vw_FinancialSummary`. |
| `approvals/route.ts` | GET | admin | Approval workflow report: counts by status/type. |

#### Audit: `src/app/api/audit/`
| File | Method | Roles | Purpose |
|------|--------|-------|---------|
| `route.ts` | GET | admin | Paginated audit log from `vw_AuditSummary`. Filter by table, action, user, date range. |

---

## Phase 8 — Frontend (Next.js Pages & Components)

All pages are inside `src/app/`. Role-based routing enforced in `middleware.ts` using JWT cookie.

### Auth Pages
- `/login` — login form. POST to `/api/auth/login`. On success, redirect by role to dashboard.

### Role-Based Dashboards
Each role has a dedicated dashboard page with role-specific widgets:

**Admin Dashboard** (`/dashboard/admin`)
- Overview cards: total reports, active teams, low-stock alerts, pending approvals, total donations
- Recent activity feed from AuditLog
- Quick links: user management, all approvals, system reports

**Emergency Operator Dashboard** (`/dashboard/operator`)
- Active reports table (from `vw_ActiveEmergencyReports`) with filter/sort
- Available teams widget (from `vw_TeamAvailability`)
- Assign team button (inline, calls `/api/teams/[id]/assign`)
- Real-time: auto-refresh every 30s via `setInterval` + `router.refresh()`

**Field Officer Dashboard** (`/dashboard/field-officer`)
- Assigned reports list
- Hospital capacity table (from `vw_HospitalCapacity`)
- Admit patient form
- Submit resource allocation request

**Warehouse Manager Dashboard** (`/dashboard/warehouse`)
- Inventory table (from `vw_WarehouseInventorySummary`) with low-stock highlights
- Pending dispatch requests
- Dispatch action button (triggers Transaction A)
- Notification bell (unread count from `Notifications`)

**Finance Officer Dashboard** (`/dashboard/finance`)
- Financial summary widget (from `vw_FinancialSummary`)
- Recent transactions table
- Add donation / record expense forms
- Pending financial approval requests

### Key Pages & Forms

**Emergency Reporting Form** (`/reports/new`)
- Public-facing (no login required for citizens)
- Fields: full name, CNIC, phone, location (text + optional GPS), disaster type (dropdown),
  severity level (dropdown), description
- POST to `/api/reports` → INSERT into `Citizens` + `EmergencyReports`
- Success: show report_id and status tracker link

**Report Detail** (`/reports/[id]`)
- Status timeline (pending → in_progress → resolved)
- Assigned teams
- Allocated resources
- Media attachments

**Resource Allocation Request** (`/resources/allocate`)
- Select emergency report, resource type, warehouse, quantity
- POST creates `ResourceAllocations` (pending) + `ApprovalRequests`

**Approvals Queue** (`/approvals`)
- Table of pending requests with context
- Approve / Reject buttons with remarks input
- Confirmation dialog before action

**Financial Entry Forms** (`/financial/donations/new`, `/financial/expenses/new`)
- Donor details, amount, payment method, notes

**MIS Analytics Dashboard** (`/analytics`)
- Charts using Recharts (or Chart.js):
  - Bar chart: incidents by disaster type
  - Pie chart: incidents by severity level
  - Line chart: reports over time
  - Table: response time by disaster type
  - Resource utilization bar chart
  - Financial summary pie: donations vs expenses
- Date range filter on all charts
- Export to CSV button (query with raw T-SQL, stream response)

**Audit Log** (`/audit`) — Admin only
- Paginated table with filters: action_type, table_affected, user, date range
- Timestamped, immutable view

### Shared Components
- `Navbar` — shows role, username, logout button, notification bell
- `RoleGuard` — client-side role check wrapper (supplements middleware)
- `DataTable` — reusable sortable/filterable table component
- `StatusBadge` — color-coded badges for report/team/allocation status
- `ConfirmDialog` — for destructive/critical actions

---

## Phase 9 — RBAC Implementation Detail

Role permissions enforced at two layers:
1. **API layer** (`src/lib/rbac.ts`): every route checks JWT role before executing SQL
2. **Frontend layer** (`middleware.ts`): redirects unauthorized routes

| Resource | Admin | Emergency Operator | Field Officer | Warehouse Manager | Finance Officer |
|----------|-------|-------------------|---------------|-------------------|-----------------|
| EmergencyReports | Full CRUD | Read + Create + Update status | Read assigned | Read only | No access |
| RescueTeams | Full CRUD | Read + Assign | Read + Update location | No access | No access |
| ResourceAllocations | Full CRUD | Read | Create + Read | Approve + Dispatch | Read |
| WarehouseInventory | Full CRUD | Read | Read | Read + Update | No access |
| Hospitals / Patients | Full CRUD | Read hospitals | Admit + Update patients | No access | No access |
| Donations | Full | No access | No access | No access | Full CRUD |
| Expenses | Full | No access | No access | Read | Full CRUD |
| FinanceTransactions | Full | No access | No access | No access | Full CRUD |
| ApprovalRequests | Full | Create + Read | Create + Read | Create + Read + Approve (resource) | Create + Read + Approve (financial) |
| AuditLog | Read | No access | No access | No access | No access |
| Users | Full CRUD | No access | No access | No access | No access |

---

## Phase 10 — Data Security

- **Passwords**: hashed with `bcryptjs` (salt rounds = 12). Never stored in plaintext.
- **JWT**: `httpOnly` + `sameSite=strict` cookie. Signed with `JWT_SECRET`. 8-hour expiry.
- **SQL Injection prevention**: all queries use parameterized inputs via `mssql`'s `request.input()` method. Never string-concatenated SQL.
- **Authorization**: every critical API route calls `checkRole()` before executing. No role-bypass paths.
- **AuditLog immutability**: application layer only ever INSERTs into AuditLog. No UPDATE/DELETE routes exposed.
- **Sensitive data**: Finance Officers cannot see citizen CNIC/address. Field Officers cannot see donation amounts. Enforced by role-specific API query projections and views.
- **HTTPS**: configure for production (out of scope for localhost demo, but noted).

---

## Phase 11 — Performance Analysis Documentation

### View vs Direct Query Analysis (`database/performance/view_analysis.sql`)

For each view, run the equivalent direct table query with `SET STATISTICS TIME ON`:

**Example: `vw_WarehouseInventorySummary` vs direct JOIN**
```sql
-- Query 1: Via view
SET STATISTICS TIME ON
SELECT TOP 100 * FROM vw_WarehouseInventorySummary WHERE is_low_stock = 1
SET STATISTICS TIME OFF

-- Query 2: Direct base tables
SET STATISTICS TIME ON
SELECT TOP 100 w.name, r.resource_name, wi.quantity_available, wi.threshold_level,
       CASE WHEN wi.quantity_available < wi.threshold_level THEN 1 ELSE 0 END
FROM WarehouseInventory wi
JOIN Warehouses w ON w.warehouse_id = wi.warehouse_id
JOIN Resources r ON r.resource_id = wi.resource_id
WHERE wi.quantity_available < wi.threshold_level
SET STATISTICS TIME OFF
```

Document:
- Cases where views provide **faster response** (optimizer caches execution plan, pre-structured joins)
- Cases where **direct queries** are faster (view materializes more data than needed; use targeted query instead)
- View advantage for **security/abstraction**: Finance role queries `vw_FinancialSummary` without
  access to raw Donations table sensitive columns

### Index Performance Analysis (`database/performance/index_analysis.sql`)

For key queries (e.g., filter reports by location + severity):
1. DROP the indexes
2. Run query with `SET STATISTICS TIME ON`
3. Re-CREATE the indexes
4. Run same query again
5. Record improvement

For insert-overhead analysis:
- Benchmark 1000 INSERTs into `EmergencyReports` with all indexes vs. with no indexes
- Document the write penalty of each index

---

## Phase 12 — Design Rationale Document (`docs/design_rationale.md`)

This document covers Deliverables #10 and addresses Requirements 17 & 19:

### Sections to write:
1. **Entity & Relationship Choices** — why Citizens is separate from Users (unauthenticated public reporting); why CITIZEN and USER are not merged (different access patterns)
2. **Normalization Decisions** — all 20 tables normalized to 4NF; composite PKs for weak entities (TeamMembers, DispatchLogs, WarehouseInventory) justified by ownership semantics
3. **Transaction Handling** — why ACID is required for resource dispatch (prevents double-allocation); why team assignment is transactional (prevents double-assignment and status drift)
4. **RBAC Strategy** — role ENUM in Users table vs separate Roles table; tradeoff: simpler schema vs less flexibility; for 5 fixed roles, ENUM is justified
5. **Trigger Justification** — each trigger explained: what event triggers it, what consistency invariant it maintains, why it can't be handled purely in application logic
6. **View Justification** — each view explained: which roles use it, what sensitive data it hides, how it simplifies frontend queries
7. **Indexing Strategy** — rationale for each index: which queries it optimizes, expected data distribution, trade-off with write overhead
8. **Performance Comparison Results** — actual measured latency numbers from `index_analysis.sql` and `view_analysis.sql`
9. **Trade-offs** — read-heavy dashboards benefit greatly from indexes; `AuditLog` (write-heavy, BIGINT PK, append-only) intentionally has fewer indexes; `EmergencyReports` is both read and write heavy so selective composite indexes are used

---

## Final Deliverables Checklist

| # | Deliverable | Location | Status |
|---|-------------|----------|--------|
| 1 | ERD Diagram | `descriptions/erd_project.drawio.png` | ✅ Done |
| 2 | Relational Schema | `descriptions/MIS_Schema_Clean.pdf` | ✅ Done |
| 3 | Normalization Steps (1NF→4NF) | `descriptions/MIS_Schema_Clean.pdf` | ✅ Done |
| 4 | SQL Implementation (DDL+DML+Queries) | `database/01_schema.sql` + `05_seed.sql` + `06_queries.sql` | To build |
| 5 | Transaction Handling Demonstration | `database/07_transactions.sql` | To build |
| 6 | Trigger Implementation & Use Cases | `database/02_triggers.sql` | To build |
| 7 | View Definitions & Performance Comparison | `database/03_views.sql` + `database/performance/view_analysis.sql` | To build |
| 8 | Indexing Strategy & Query Performance Report | `database/04_indexes.sql` + `docs/performance_report.md` | To build |
| 9 | Frontend Interface (working app) | `src/` (Next.js) | To build |
| 10 | Design Rationale Document | `docs/design_rationale.md` | To build |
| 11 | MIS Reports / Dashboards | `/analytics` page in Next.js | To build |
| 12 | System Demonstration | Video/live viva | Optional |

---

## Development Order (Implementation Sequence)

1. **Setup DB server** — verify `systemctl status mssql-server`, create `DisasterMIS` database
2. **Run `01_schema.sql`** via `sqlcmd` — create all 20 tables
3. **Run `02_triggers.sql`** — create all 10 triggers
4. **Run `03_views.sql`** — create all 8 views
5. **Run `04_indexes.sql`** — create all indexes
6. **Run `05_seed.sql`** — insert sample data
7. **Test `07_transactions.sql`** — verify ACID behavior
8. **Run performance analysis** — collect benchmark numbers for deliverables #7 and #8
9. **Bootstrap Next.js** — `npx create-next-app@latest src --typescript --app`
10. **Install packages** — `npm install mssql bcryptjs jsonwebtoken recharts`
11. **Implement `lib/db.ts`** — connection pool
12. **Implement `lib/auth.ts` + `lib/rbac.ts`** — auth + RBAC
13. **Implement API routes** — in order: auth → reports → teams → resources → hospitals → financial → approvals → analytics → audit
14. **Implement frontend pages** — in order: login → dashboards → forms → analytics
15. **Write `docs/design_rationale.md`** and `docs/performance_report.md`
16. **Test end-to-end** all 5 role flows
17. **Zip and submit**
