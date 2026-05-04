USE DisasterMIS;
GO

-- View 1: Active emergency reports with citizen and operator info
CREATE VIEW vw_ActiveEmergencyReports AS
SELECT
    r.report_id,
    r.disaster_type,
    r.severity_level,
    r.location,
    r.latitude,
    r.longitude,
    r.status,
    r.reported_at,
    c.full_name        AS citizen_name,
    c.phone            AS citizen_phone,
    u.username         AS assigned_operator,
    DATEDIFF(MINUTE, r.reported_at, GETDATE()) AS minutes_since_report
FROM EmergencyReports r
JOIN Citizens c ON c.citizen_id = r.citizen_id
LEFT JOIN Users u ON u.user_id = r.operator_id
WHERE r.status IN ('pending', 'in_progress');
GO

-- View 2: Rescue team availability with member counts
CREATE VIEW vw_TeamAvailability AS
SELECT
    t.team_id,
    t.team_name,
    t.team_type,
    t.current_location,
    t.availability_status,
    t.capacity,
    COUNT(tm.member_id) AS current_members
FROM RescueTeams t
LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
GROUP BY t.team_id, t.team_name, t.team_type,
         t.current_location, t.availability_status, t.capacity;
GO

-- View 3: Warehouse inventory summary with low-stock flag
CREATE VIEW vw_WarehouseInventorySummary AS
SELECT
    w.warehouse_id,
    w.name              AS warehouse_name,
    w.location          AS warehouse_location,
    u.username          AS manager_name,
    r.resource_id,
    r.resource_name,
    r.resource_type,
    r.unit_of_measure,
    wi.quantity_available,
    wi.threshold_level,
    wi.last_updated,
    CASE WHEN wi.quantity_available < wi.threshold_level THEN 1 ELSE 0 END AS is_low_stock
FROM WarehouseInventory wi
JOIN Warehouses w ON w.warehouse_id = wi.warehouse_id
JOIN Resources  r ON r.resource_id  = wi.resource_id
LEFT JOIN Users u ON u.user_id = w.manager_id;
GO

-- View 4: Hospital bed availability (hides patient details from field officers)
CREATE VIEW vw_HospitalCapacity AS
SELECT
    h.hospital_id,
    h.name,
    h.location,
    h.total_beds,
    h.available_beds,
    h.total_beds - h.available_beds AS occupied_beds,
    CAST(ROUND(100.0 * (h.total_beds - h.available_beds) / NULLIF(h.total_beds, 0), 1) AS DECIMAL(5,1)) AS occupancy_pct,
    h.contact_number,
    h.is_active
FROM Hospitals h
WHERE h.is_active = 1;
GO

-- View 5: Financial summary (aggregated — hides individual donor data from non-finance roles)
CREATE VIEW vw_FinancialSummary AS
SELECT
    (SELECT ISNULL(SUM(amount), 0) FROM Donations)  AS total_donations,
    (SELECT ISNULL(SUM(amount), 0) FROM Expenses)   AS total_expenses,
    (SELECT ISNULL(SUM(amount), 0) FROM Donations)
        - (SELECT ISNULL(SUM(amount), 0) FROM Expenses) AS net_balance,
    (SELECT COUNT(*) FROM FinanceTransactions WHERE status = 'pending')   AS pending_transactions,
    (SELECT COUNT(*) FROM FinanceTransactions WHERE status = 'completed') AS completed_transactions;
GO

-- View 6: Pending approval requests with submitter info
CREATE VIEW vw_ApprovalQueue AS
SELECT
    ar.approval_id,
    ar.request_type,
    ar.status,
    ar.requested_at,
    ar.remarks,
    u1.username         AS requested_by_name,
    u1.role             AS requested_by_role,
    u2.username         AS reviewed_by_name,
    ra.qty_requested,
    r.resource_name,
    w.name              AS warehouse_name,
    DATEDIFF(HOUR, ar.requested_at, GETDATE()) AS hours_pending
FROM ApprovalRequests ar
JOIN Users u1 ON u1.user_id = ar.requested_by
LEFT JOIN Users u2 ON u2.user_id = ar.reviewed_by
LEFT JOIN ResourceAllocations ra ON ra.allocation_id = ar.allocation_id
LEFT JOIN Resources  r ON r.resource_id  = ra.resource_id
LEFT JOIN Warehouses w ON w.warehouse_id = ra.warehouse_id
WHERE ar.status = 'pending';
GO

-- View 7: Resource allocation pipeline with incident context
CREATE VIEW vw_ResourceAllocationStatus AS
SELECT
    ra.allocation_id,
    er.disaster_type,
    er.location         AS incident_location,
    r.resource_name,
    r.resource_type,
    r.unit_of_measure,
    w.name              AS warehouse_name,
    ra.qty_requested,
    ra.qty_dispatched,
    ra.qty_consumed,
    ra.qty_requested - ra.qty_dispatched AS qty_pending_dispatch,
    ra.status,
    ra.requested_at,
    u.username          AS approved_by_name
FROM ResourceAllocations ra
JOIN EmergencyReports er ON er.report_id   = ra.report_id
JOIN Resources        r  ON r.resource_id  = ra.resource_id
JOIN Warehouses       w  ON w.warehouse_id = ra.warehouse_id
LEFT JOIN Users       u  ON u.user_id      = ra.approved_by;
GO

-- View 8: Budget summary per disaster event (links expenses via resource allocations)
CREATE VIEW vw_BudgetPerEvent AS
SELECT
    er.report_id,
    er.disaster_type,
    er.severity_level,
    er.location,
    er.status                                           AS report_status,
    COUNT(DISTINCT ra.allocation_id)                    AS total_allocations,
    ISNULL(SUM(ra.qty_requested),  0)                   AS total_qty_requested,
    ISNULL(SUM(ra.qty_dispatched), 0)                   AS total_qty_dispatched,
    COUNT(DISTINCT e.expense_id)                        AS total_expenses,
    ISNULL(SUM(e.amount), 0)                            AS total_amount_spent
FROM EmergencyReports er
LEFT JOIN ResourceAllocations ra ON ra.report_id   = er.report_id
LEFT JOIN Expenses            e  ON e.allocation_id = ra.allocation_id
GROUP BY er.report_id, er.disaster_type, er.severity_level, er.location, er.status;
GO

-- View 9: Human-readable audit log (admin only)
CREATE VIEW vw_AuditSummary AS
SELECT
    al.log_id,
    al.action_type,
    al.table_affected,
    al.record_id,
    ISNULL(u.username, 'SYSTEM') AS performed_by,
    u.role                        AS performer_role,
    al.old_value,
    al.new_value,
    al.ip_address,
    al.action_timestamp
FROM AuditLog al
LEFT JOIN Users u ON u.user_id = al.user_id;
GO

