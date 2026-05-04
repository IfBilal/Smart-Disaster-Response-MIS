USE DisasterMIS;
GO

-- Trigger 1: Deduct inventory when resource is dispatched
CREATE TRIGGER trg_ResourceAllocation_Dispatch
ON ResourceAllocations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM INSERTED i JOIN DELETED d ON d.allocation_id = i.allocation_id
        WHERE i.status = 'dispatched' AND d.status <> 'dispatched'
    ) RETURN;

    UPDATE wi
    SET wi.quantity_available = wi.quantity_available - i.qty_dispatched,
        wi.last_updated = GETDATE()
    FROM WarehouseInventory wi
    JOIN INSERTED i ON i.warehouse_id = wi.warehouse_id AND i.resource_id = wi.resource_id
    JOIN DELETED  d ON d.allocation_id = i.allocation_id
    WHERE i.status = 'dispatched' AND d.status <> 'dispatched';

    -- Prevent negative stock
    IF EXISTS (
        SELECT 1 FROM WarehouseInventory wi
        JOIN INSERTED i ON i.warehouse_id = wi.warehouse_id AND i.resource_id = wi.resource_id
        WHERE wi.quantity_available < 0
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('Insufficient stock in warehouse.', 16, 1);
        RETURN;
    END;
END;
GO

-- Trigger 2: Set team status to assigned when new assignment is created
CREATE TRIGGER trg_TeamAssignment_Insert
ON TeamAssignments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE RescueTeams
    SET availability_status = 'assigned'
    WHERE team_id IN (SELECT team_id FROM INSERTED);

    INSERT INTO DispatchLogs (team_id, log_id, status_update, logged_at)
    SELECT i.team_id,
           ISNULL((SELECT MAX(log_id) FROM DispatchLogs WHERE team_id = i.team_id), 0) + 1,
           'Team assigned to report #' + CAST(i.report_id AS NVARCHAR),
           GETDATE()
    FROM INSERTED i;
END;
GO

-- Trigger 3: Set team back to available when assignment is completed
CREATE TRIGGER trg_TeamAssignment_Complete
ON TeamAssignments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM INSERTED i JOIN DELETED d ON d.assignment_id = i.assignment_id
        WHERE i.status = 'completed' AND d.status <> 'completed'
    ) RETURN;

    UPDATE RescueTeams
    SET availability_status = 'available'
    WHERE team_id IN (
        SELECT i.team_id FROM INSERTED i JOIN DELETED d ON d.assignment_id = i.assignment_id
        WHERE i.status = 'completed' AND d.status <> 'completed'
    );

    INSERT INTO DispatchLogs (team_id, log_id, status_update, logged_at)
    SELECT i.team_id,
           ISNULL((SELECT MAX(log_id) FROM DispatchLogs WHERE team_id = i.team_id), 0) + 1,
           'Mission completed for report #' + CAST(i.report_id AS NVARCHAR),
           GETDATE()
    FROM INSERTED i JOIN DELETED d ON d.assignment_id = i.assignment_id
    WHERE i.status = 'completed' AND d.status <> 'completed';
END;
GO

-- Trigger 4: Decrement hospital beds when a patient is admitted
CREATE TRIGGER trg_Patient_Admission
ON Patients
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM INSERTED WHERE hospital_id IS NOT NULL) RETURN;

    IF EXISTS (
        SELECT 1 FROM Hospitals h JOIN INSERTED i ON i.hospital_id = h.hospital_id
        WHERE h.available_beds < 1
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('No beds available at this hospital.', 16, 1);
        RETURN;
    END;

    UPDATE Hospitals
    SET available_beds = available_beds - 1
    WHERE hospital_id IN (SELECT hospital_id FROM INSERTED WHERE hospital_id IS NOT NULL);
END;
GO

-- Trigger 5: Increment hospital beds when patient is discharged
CREATE TRIGGER trg_Patient_Discharge
ON Patients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM INSERTED i JOIN DELETED d ON d.patient_id = i.patient_id
        WHERE i.discharge_time IS NOT NULL AND d.discharge_time IS NULL
    ) RETURN;

    UPDATE Hospitals
    SET available_beds = available_beds + 1
    WHERE hospital_id IN (
        SELECT i.hospital_id FROM INSERTED i JOIN DELETED d ON d.patient_id = i.patient_id
        WHERE i.discharge_time IS NOT NULL AND d.discharge_time IS NULL AND i.hospital_id IS NOT NULL
    );
END;
GO

-- Trigger 6: Log every financial transaction to audit table
CREATE TRIGGER trg_FinanceTransaction_AuditLog
ON FinanceTransactions
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, new_value, action_timestamp)
    SELECT performed_by, 'INSERT', 'FinanceTransactions', transaction_id,
           '{"type":"' + transaction_type + '","amount":' + CAST(amount AS NVARCHAR) + '}',
           GETDATE()
    FROM INSERTED;
END;
GO

-- Trigger 7: Log emergency report inserts and status updates
CREATE TRIGGER trg_EmergencyReport_AuditLog
ON EmergencyReports
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, new_value, action_timestamp)
        SELECT operator_id, 'INSERT', 'EmergencyReports', report_id,
               '{"status":"' + status + '","type":"' + disaster_type + '"}',
               GETDATE()
        FROM INSERTED;
        RETURN;
    END;

    INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, old_value, new_value, action_timestamp)
    SELECT i.operator_id, 'UPDATE', 'EmergencyReports', i.report_id,
           '{"status":"' + d.status + '"}',
           '{"status":"' + i.status + '"}',
           GETDATE()
    FROM INSERTED i JOIN DELETED d ON d.report_id = i.report_id
    WHERE i.status <> d.status;
END;
GO

-- Trigger 8: Log resource allocation changes
CREATE TRIGGER trg_ResourceAllocation_AuditLog
ON ResourceAllocations
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DELETED)
    BEGIN
        INSERT INTO AuditLog (action_type, table_affected, record_id, new_value, action_timestamp)
        SELECT 'INSERT', 'ResourceAllocations', allocation_id,
               '{"status":"' + status + '","qty":' + CAST(qty_requested AS NVARCHAR) + '}',
               GETDATE()
        FROM INSERTED;
        RETURN;
    END;

    INSERT INTO AuditLog (action_type, table_affected, record_id, old_value, new_value, action_timestamp)
    SELECT 'UPDATE', 'ResourceAllocations', i.allocation_id,
           '{"status":"' + d.status + '"}',
           '{"status":"' + i.status + '"}',
           GETDATE()
    FROM INSERTED i JOIN DELETED d ON d.allocation_id = i.allocation_id
    WHERE i.status <> d.status;
END;
GO

-- Trigger 9: Send notification to warehouse manager on low stock
CREATE TRIGGER trg_Inventory_LowStockAlert
ON WarehouseInventory
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Notifications (user_id, message, notification_type)
    SELECT w.manager_id,
           'Low stock: ' + r.resource_name + ' in ' + w.name +
           ' (' + CAST(i.quantity_available AS NVARCHAR) + ' ' + r.unit_of_measure + ' left)',
           'alert'
    FROM INSERTED i
    JOIN DELETED  d ON d.warehouse_id = i.warehouse_id AND d.resource_id = i.resource_id
    JOIN Warehouses w ON w.warehouse_id = i.warehouse_id
    JOIN Resources  r ON r.resource_id  = i.resource_id
    WHERE i.quantity_available < i.threshold_level
      AND d.quantity_available >= d.threshold_level
      AND w.manager_id IS NOT NULL;
END;
GO

-- Trigger 10: Auto-approve linked allocation when ApprovalRequest is approved
CREATE TRIGGER trg_ApprovalRequest_Execute
ON ApprovalRequests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM INSERTED i JOIN DELETED d ON d.approval_id = i.approval_id
        WHERE i.status = 'approved' AND d.status = 'pending'
    ) RETURN;

    UPDATE ra
    SET ra.status = 'approved', ra.approved_by = i.reviewed_by
    FROM ResourceAllocations ra
    JOIN INSERTED i ON i.allocation_id = ra.allocation_id
    JOIN DELETED  d ON d.approval_id   = i.approval_id
    WHERE i.status = 'approved' AND d.status = 'pending'
      AND i.request_type = 'resource_allocation'
      AND i.allocation_id IS NOT NULL;

    INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, old_value, new_value, action_timestamp)
    SELECT i.reviewed_by, 'UPDATE', 'ApprovalRequests', i.approval_id,
           '{"status":"pending"}',
           '{"status":"' + i.status + '"}',
           GETDATE()
    FROM INSERTED i JOIN DELETED d ON d.approval_id = i.approval_id
    WHERE i.status IN ('approved', 'rejected') AND d.status = 'pending';
END;
GO

-- Trigger 11: Set team status to 'busy' when assignment moves to in_progress
CREATE TRIGGER trg_TeamAssignment_Busy
ON TeamAssignments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM INSERTED i JOIN DELETED d ON d.assignment_id = i.assignment_id
        WHERE i.status = 'in_progress' AND d.status <> 'in_progress'
    ) RETURN;

    UPDATE RescueTeams
    SET availability_status = 'busy'
    WHERE team_id IN (
        SELECT i.team_id FROM INSERTED i JOIN DELETED d ON d.assignment_id = i.assignment_id
        WHERE i.status = 'in_progress' AND d.status <> 'in_progress'
    );

    INSERT INTO DispatchLogs (team_id, log_id, status_update, logged_at)
    SELECT i.team_id,
           ISNULL((SELECT MAX(log_id) FROM DispatchLogs WHERE team_id = i.team_id), 0) + 1,
           'Team is now actively working on report #' + CAST(i.report_id AS NVARCHAR),
           GETDATE()
    FROM INSERTED i JOIN DELETED d ON d.assignment_id = i.assignment_id
    WHERE i.status = 'in_progress' AND d.status <> 'in_progress';
END;
GO

-- Trigger 12: Revert linked ResourceAllocation to 'rejected' when ApprovalRequest is rejected
CREATE TRIGGER trg_ApprovalRequest_Reject
ON ApprovalRequests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM INSERTED i JOIN DELETED d ON d.approval_id = i.approval_id
        WHERE i.status = 'rejected' AND d.status = 'pending'
    ) RETURN;

    UPDATE ra
    SET ra.status = 'rejected'
    FROM ResourceAllocations ra
    JOIN INSERTED i ON i.allocation_id = ra.allocation_id
    JOIN DELETED  d ON d.approval_id   = i.approval_id
    WHERE i.status = 'rejected' AND d.status = 'pending'
      AND i.request_type = 'resource_allocation'
      AND i.allocation_id IS NOT NULL
      AND ra.status = 'pending';
END;
GO
