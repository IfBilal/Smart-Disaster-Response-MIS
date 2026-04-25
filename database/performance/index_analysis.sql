USE DisasterMIS;
GO

-- ============================================================
-- Index Performance Analysis
-- Run this BEFORE and AFTER creating indexes to compare timings.
-- Use: SET STATISTICS TIME ON to see CPU and elapsed time.
-- ============================================================

-- Step 1: Run queries WITHOUT indexes (drop them first if needed)
-- Step 2: Create indexes (04_indexes.sql)
-- Step 3: Run same queries again and compare times

SET STATISTICS TIME ON;
SET STATISTICS IO ON;
GO

-- Test 1: Filter reports by disaster type and status
-- Covers composite index: IX_ER_DisasterType_Status
SELECT report_id, disaster_type, severity_level, location, status
FROM EmergencyReports
WHERE disaster_type = 'flood' AND status = 'in_progress';
GO

-- Test 2: Filter reports by location and severity
-- Covers composite index: IX_ER_Location_Severity
SELECT report_id, location, severity_level, reported_at
FROM EmergencyReports
WHERE location LIKE 'Lahore%' AND severity_level = 'critical';
GO

-- Test 3: Lookup allocations for a specific report with status filter
-- Covers composite index: IX_RA_Report_Status
SELECT allocation_id, resource_id, warehouse_id, qty_requested, status
FROM ResourceAllocations
WHERE report_id = 1 AND status = 'approved';
GO

-- Test 4: Financial transactions in a date range by type
-- Covers composite index: IX_FT_Type_Timestamp
SELECT transaction_id, amount, transaction_timestamp, status
FROM FinanceTransactions
WHERE transaction_type = 'donation'
  AND transaction_timestamp >= DATEADD(DAY, -7, GETDATE());
GO

-- Test 5: Audit log filtered by table and date range
-- Covers composite index: IX_AL_Table_Timestamp
SELECT TOP 100 log_id, action_type, record_id, action_timestamp
FROM AuditLog
WHERE table_affected = 'FinanceTransactions'
  AND action_timestamp >= DATEADD(DAY, -1, GETDATE());
GO

-- Test 6: Available rescue teams
-- Covers single-column index: IX_RT_AvailStatus
SELECT team_id, team_name, team_type, current_location
FROM RescueTeams
WHERE availability_status = 'available';
GO

-- Test 7: Unread notifications for a user
-- Covers composite index: IX_Notif_User_IsRead
SELECT notification_id, message, notification_type, sent_at
FROM Notifications
WHERE user_id = 4 AND is_read = 0;
GO

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
GO

-- ============================================================
-- INSERT overhead test: measure write cost with indexes active
-- Run with indexes active, note the time for 100 INSERTs.
-- ============================================================
DECLARE @i INT = 1;
WHILE @i <= 100
BEGIN
    INSERT INTO EmergencyReports (citizen_id, disaster_type, severity_level, location, status)
    VALUES (1, 'flood', 'medium', 'Test Location ' + CAST(@i AS NVARCHAR), 'pending');
    SET @i = @i + 1;
END;
GO

PRINT 'Index analysis queries complete. Check Messages tab for timing.';
GO
