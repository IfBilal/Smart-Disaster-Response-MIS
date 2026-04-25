USE DisasterMIS;
GO

-- ============================================================
-- View vs Direct Query Performance Analysis
-- Compare execution time when querying through views vs base tables.
-- ============================================================

SET STATISTICS TIME ON;
SET STATISTICS IO ON;
GO

-- -------------------------------------------------------
-- Test 1a: Query through vw_WarehouseInventorySummary
-- -------------------------------------------------------
SELECT warehouse_name, resource_name, quantity_available, threshold_level, is_low_stock
FROM vw_WarehouseInventorySummary
WHERE is_low_stock = 1;
GO

-- Test 1b: Equivalent direct base table query
SELECT w.name AS warehouse_name, r.resource_name, wi.quantity_available, wi.threshold_level,
       CASE WHEN wi.quantity_available < wi.threshold_level THEN 1 ELSE 0 END AS is_low_stock
FROM WarehouseInventory wi
JOIN Warehouses w ON w.warehouse_id = wi.warehouse_id
JOIN Resources  r ON r.resource_id  = wi.resource_id
WHERE wi.quantity_available < wi.threshold_level;
GO

-- -------------------------------------------------------
-- Test 2a: Query through vw_ActiveEmergencyReports
-- -------------------------------------------------------
SELECT report_id, disaster_type, severity_level, citizen_name, assigned_operator
FROM vw_ActiveEmergencyReports
WHERE severity_level = 'critical';
GO

-- Test 2b: Equivalent direct query
SELECT r.report_id, r.disaster_type, r.severity_level,
       c.full_name AS citizen_name, u.username AS assigned_operator
FROM EmergencyReports r
JOIN Citizens c ON c.citizen_id = r.citizen_id
LEFT JOIN Users u ON u.user_id = r.operator_id
WHERE r.status IN ('pending', 'in_progress')
  AND r.severity_level = 'critical';
GO

-- -------------------------------------------------------
-- Test 3a: Query through vw_ResourceAllocationStatus
-- -------------------------------------------------------
SELECT allocation_id, incident_location, resource_name, qty_dispatched, allocation_status
FROM vw_ResourceAllocationStatus
WHERE allocation_status = 'approved';
GO

-- Test 3b: Equivalent direct query
SELECT ra.allocation_id, er.location AS incident_location,
       r.resource_name, ra.qty_dispatched, ra.status AS allocation_status
FROM ResourceAllocations ra
JOIN EmergencyReports er ON er.report_id   = ra.report_id
JOIN Resources        r  ON r.resource_id  = ra.resource_id
WHERE ra.status = 'approved';
GO

-- -------------------------------------------------------
-- Test 4a: vw_HospitalCapacity
-- -------------------------------------------------------
SELECT name, available_beds, occupancy_pct
FROM vw_HospitalCapacity
WHERE available_beds < 20;
GO

-- Test 4b: Direct
SELECT name, available_beds,
       CAST(ROUND(100.0 * (total_beds - available_beds) / NULLIF(total_beds, 0), 1) AS DECIMAL(5,1)) AS occupancy_pct
FROM Hospitals
WHERE is_active = 1 AND available_beds < 20;
GO

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
GO

PRINT 'View analysis queries complete. Compare CPU time and logical reads in Messages.';
GO
