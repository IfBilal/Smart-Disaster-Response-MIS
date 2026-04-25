USE DisasterMIS;
GO

-- Get active emergency reports sorted by priority
SELECT TOP 50
    r.report_id, r.disaster_type, r.severity_level, r.location, r.status, r.reported_at,
    c.full_name AS citizen_name, c.phone,
    u.username AS operator
FROM EmergencyReports r
JOIN Citizens c ON c.citizen_id = r.citizen_id
LEFT JOIN Users u ON u.user_id = r.operator_id
WHERE r.status IN ('pending', 'in_progress')
ORDER BY
    CASE r.severity_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    r.reported_at ASC;
GO

-- Count reports by disaster type
SELECT
    disaster_type,
    COUNT(*) AS total,
    SUM(CASE WHEN severity_level = 'critical' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
FROM EmergencyReports
GROUP BY disaster_type;
GO

-- Average response time per disaster type
SELECT
    disaster_type,
    COUNT(*) AS resolved_count,
    AVG(DATEDIFF(MINUTE, reported_at, resolved_at)) AS avg_response_minutes
FROM EmergencyReports
WHERE status = 'resolved' AND resolved_at IS NOT NULL
GROUP BY disaster_type;
GO

-- Find available rescue teams
SELECT
    t.team_id, t.team_name, t.team_type, t.current_location,
    t.availability_status, t.capacity,
    COUNT(tm.member_id) AS members
FROM RescueTeams t
LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
WHERE t.availability_status = 'available'
GROUP BY t.team_id, t.team_name, t.team_type, t.current_location, t.availability_status, t.capacity;
GO

-- Team assignment history
SELECT
    ta.assignment_id, ta.assigned_at, ta.completed_at, ta.status,
    er.disaster_type, er.location
FROM TeamAssignments ta
JOIN EmergencyReports er ON er.report_id = ta.report_id
WHERE ta.team_id = 1
ORDER BY ta.assigned_at DESC;
GO

-- Low stock inventory
SELECT
    w.name AS warehouse, r.resource_name, r.resource_type,
    wi.quantity_available, wi.threshold_level, r.unit_of_measure
FROM WarehouseInventory wi
JOIN Warehouses w ON w.warehouse_id = wi.warehouse_id
JOIN Resources  r ON r.resource_id  = wi.resource_id
WHERE wi.quantity_available < wi.threshold_level;
GO

-- Resource utilization (dispatched vs consumed)
SELECT
    r.resource_name,
    SUM(ra.qty_requested)  AS total_requested,
    SUM(ra.qty_dispatched) AS total_dispatched,
    SUM(ra.qty_consumed)   AS total_consumed
FROM ResourceAllocations ra
JOIN Resources r ON r.resource_id = ra.resource_id
WHERE ra.status IN ('dispatched', 'consumed')
GROUP BY r.resource_name;
GO

-- Hospital capacity with active patient counts
SELECT
    h.name, h.location, h.total_beds, h.available_beds,
    COUNT(p.patient_id) AS active_patients
FROM Hospitals h
LEFT JOIN Patients p ON p.hospital_id = h.hospital_id AND p.discharge_time IS NULL
WHERE h.is_active = 1
GROUP BY h.hospital_id, h.name, h.location, h.total_beds, h.available_beds;
GO

-- Financial summary
SELECT
    (SELECT ISNULL(SUM(amount), 0) FROM Donations) AS total_donations,
    (SELECT ISNULL(SUM(amount), 0) FROM Expenses)  AS total_expenses,
    (SELECT ISNULL(SUM(amount), 0) FROM Donations)
        - (SELECT ISNULL(SUM(amount), 0) FROM Expenses) AS net_balance;
GO

-- Donations grouped by type
SELECT donor_type, COUNT(*) AS count, SUM(amount) AS total
FROM Donations
GROUP BY donor_type;
GO

-- Expenses by category
SELECT category, COUNT(*) AS count, SUM(amount) AS total
FROM Expenses
GROUP BY category;
GO

-- Pending approvals
SELECT
    ar.approval_id, ar.request_type, ar.requested_at,
    u.username AS requested_by,
    r.resource_name, ra.qty_requested
FROM ApprovalRequests ar
JOIN Users u ON u.user_id = ar.requested_by
LEFT JOIN ResourceAllocations ra ON ra.allocation_id = ar.allocation_id
LEFT JOIN Resources r ON r.resource_id = ra.resource_id
WHERE ar.status = 'pending';
GO

-- Recent audit trail
SELECT TOP 100
    al.log_id, al.action_type, al.table_affected,
    ISNULL(u.username, 'SYSTEM') AS actor,
    al.old_value, al.new_value, al.action_timestamp
FROM AuditLog al
LEFT JOIN Users u ON u.user_id = al.user_id
ORDER BY al.action_timestamp DESC;
GO

-- Incident count by location (city level)
SELECT
    LEFT(location, CHARINDEX(',', location + ',') - 1) AS city,
    COUNT(*) AS total_incidents
FROM EmergencyReports
GROUP BY LEFT(location, CHARINDEX(',', location + ',') - 1)
ORDER BY total_incidents DESC;
GO

-- Daily report counts for past 30 days
SELECT
    CAST(reported_at AS DATE) AS report_date,
    COUNT(*) AS reports_submitted
FROM EmergencyReports
WHERE reported_at >= DATEADD(DAY, -30, GETDATE())
GROUP BY CAST(reported_at AS DATE)
ORDER BY report_date;
GO

-- Unread notification count per user
SELECT user_id, COUNT(*) AS unread_count
FROM Notifications
WHERE is_read = 0
GROUP BY user_id;
GO

PRINT 'All queries executed.';
GO
