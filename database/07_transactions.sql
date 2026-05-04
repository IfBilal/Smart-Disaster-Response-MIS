USE DisasterMIS;
GO

-- ============================================================
-- Transaction A: Resource Allocation Dispatch
-- Atomically dispatch resources and deduct from inventory.
-- Rollback if stock is insufficient (trigger handles the check).
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = qty_requested
        WHERE allocation_id = 4
          AND status = 'approved';
        -- trg_ResourceAllocation_Dispatch fires here and deducts inventory
        -- If insufficient stock, trigger calls ROLLBACK and RAISERROR

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- ============================================================
-- Transaction B: Rescue Team Assignment
-- Atomically create assignment and update report status.
-- trg_TeamAssignment_Insert will update team availability.
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        INSERT INTO TeamAssignments (team_id, report_id, status)
        VALUES (2, 2, 'assigned');
        -- trigger fires: sets RescueTeams.availability_status = 'assigned'

        UPDATE EmergencyReports
        SET status = 'in_progress', operator_id = 2
        WHERE report_id = 2
          AND status = 'pending';

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- ============================================================
-- Transaction C: Record Donation + Finance Transaction
-- Both inserts succeed together or both are rolled back.
-- trg_FinanceTransaction_AuditLog logs to AuditLog automatically.
-- ============================================================
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

-- ============================================================
-- Transaction D: Approval Workflow — Approve Pending Request
-- Approving an ApprovalRequest triggers the ResourceAllocation
-- to be updated to 'approved' automatically (via Trigger 10).
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        UPDATE ApprovalRequests
        SET status      = 'approved',
            reviewed_by = 4,
            reviewed_at = GETDATE(),
            remarks     = N'Approved after verification'
        WHERE approval_id = 5
          AND status = 'pending';
        -- trg_ApprovalRequest_Execute fires and updates ResourceAllocations.status

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- ============================================================
-- Transaction E: Patient Admission
-- Atomically admit patient and decrement hospital beds.
-- trg_Patient_Admission handles bed decrement + rollback if full.
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition)
        VALUES (8, 2, 3, GETDATE(), 'stable');
        -- trigger fires: decrements available_beds
        -- if no beds available: trigger rolls back and raises error

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- ============================================================
-- Transaction E2: Approval Workflow — Reject Pending Request
-- Rejecting an ApprovalRequest triggers the linked ResourceAllocation
-- to be set to 'rejected' automatically (via Trigger 11).
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        UPDATE ApprovalRequests
        SET status      = 'rejected',
            reviewed_by = 4,
            reviewed_at = GETDATE(),
            remarks     = N'Insufficient justification provided'
        WHERE approval_id = 5
          AND status = 'pending';
        -- trg_ApprovalRequest_Reject fires and sets ResourceAllocations.status = 'rejected'

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- ============================================================
-- Transaction F: Rollback Demo — Force an insufficient-stock error
-- This shows the ACID rollback in action.
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        -- Insert a fake allocation with very large qty to trigger rollback
        INSERT INTO ResourceAllocations (report_id, resource_id, warehouse_id, qty_requested, status)
        VALUES (1, 1, 3, 999999.00, 'approved');

        DECLARE @fake_id INT = SCOPE_IDENTITY();

        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = 999999.00
        WHERE allocation_id = @fake_id;
        -- trigger will detect negative inventory and ROLLBACK

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

