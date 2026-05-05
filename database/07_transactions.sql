USE DisasterMIS;
GO

-- Transaction A: Resource Allocation Dispatch
-- UPDLOCK on ResourceAllocations prevents two concurrent dispatches
-- from reading the same 'approved' status simultaneously.
-- Trigger deducts inventory; rolls back if stock insufficient.
BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock the allocation row at read time
        SELECT allocation_id, status, qty_requested
        FROM ResourceAllocations WITH (UPDLOCK)
        WHERE allocation_id = 4 AND status = 'approved';

        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = qty_requested
        WHERE allocation_id = 4 AND status = 'approved';
        -- trg_ResourceAllocation_Dispatch fires: deducts inventory
        -- If insufficient stock, trigger calls ROLLBACK and RAISERROR

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction B: Rescue Team Assignment
-- UPDLOCK on RescueTeams prevents two operators from assigning
-- the same team simultaneously.
-- trg_TeamAssignment_Insert updates team availability.
BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock the team row to prevent concurrent assignments
        SELECT team_id, availability_status
        FROM RescueTeams WITH (UPDLOCK)
        WHERE team_id = 2 AND availability_status = 'available';

        INSERT INTO TeamAssignments (team_id, report_id, status)
        VALUES (2, 2, 'assigned');
        -- trigger fires: sets RescueTeams.availability_status = 'assigned'

        UPDATE EmergencyReports
        SET status = 'in_progress', operator_id = 2
        WHERE report_id = 2 AND status = 'pending';

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction C: Record Donation + Finance Transaction
-- UPDLOCK not needed here (pure inserts, no read-then-write).
-- Both inserts succeed together or both are rolled back.
-- trg_FinanceTransaction_AuditLog logs to AuditLog automatically
BEGIN TRY
    BEGIN TRANSACTION

        INSERT INTO Donations (received_by, donor_name, donor_type, amount, payment_method)
        VALUES (5, N'Test Donor Corp', 'organization', 75000.00, 'bank_transfer');

        INSERT INTO FinanceTransactions (performed_by, donation_id, transaction_type, amount, status)
        VALUES (5, SCOPE_IDENTITY(), 'donation', 75000.00, 'completed');
        -- trigger fires: logs to AuditLog

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction D: Approval Workflow — Approve Pending Request
-- UPDLOCK prevents two reviewers from approving simultaneously.
-- trg_ApprovalRequest_Execute updates ResourceAllocation automatically.
BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock the approval row so no concurrent review can proceed
        SELECT approval_id, status
        FROM ApprovalRequests WITH (UPDLOCK)
        WHERE approval_id = 5 AND status = 'pending';

        UPDATE ApprovalRequests
        SET status      = 'approved',
            reviewed_by = 4,
            reviewed_at = GETDATE(),
            remarks     = N'Approved after verification'
        WHERE approval_id = 5 AND status = 'pending';
        -- trg_ApprovalRequest_Execute fires: updates ResourceAllocations.status

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction E: Patient Admission
-- UPDLOCK on Hospitals prevents two admissions from both reading
-- available_beds > 0 simultaneously (double admission race condition).
-- trg_Patient_Admission handles bed decrement + rollback if full.
BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock hospital row to prevent concurrent admissions
        SELECT hospital_id, available_beds
        FROM Hospitals WITH (UPDLOCK)
        WHERE hospital_id = 3 AND available_beds > 0;

        INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition)
        VALUES (8, 3, 3, GETDATE(), 'stable');
        -- trigger fires: decrements available_beds
        -- if no beds: trigger rolls back and raises error

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction E2: Approval Workflow — Reject Pending Request
-- UPDLOCK prevents concurrent approve + reject on same request.
-- trg_ApprovalRequest_Reject sets linked ResourceAllocation to rejected.

BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock approval row before rejecting
        SELECT approval_id, status
        FROM ApprovalRequests WITH (UPDLOCK)
        WHERE approval_id = 6 AND status = 'pending';

        UPDATE ApprovalRequests
        SET status      = 'rejected',
            reviewed_by = 4,
            reviewed_at = GETDATE(),
            remarks     = N'Insufficient justification provided'
        WHERE approval_id = 6 AND status = 'pending';
        -- trg_ApprovalRequest_Reject fires: sets ResourceAllocations.status = 'rejected'

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction F: Rollback Demo — Force insufficient-stock error
-- Shows ACID rollback + UPDLOCK in action together.
BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock inventory row before checking stock
        SELECT warehouse_id, resource_id, quantity_available
        FROM WarehouseInventory WITH (UPDLOCK)
        WHERE warehouse_id = 1 AND resource_id = 1;

        INSERT INTO ResourceAllocations (report_id, resource_id, warehouse_id, qty_requested, status)
        VALUES (1, 1, 3, 999999.00, 'approved');

        DECLARE @fake_id INT = SCOPE_IDENTITY();

        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = 999999.00
        WHERE allocation_id = @fake_id;
        -- trigger detects negative inventory → ROLLBACK

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO
