USE DisasterMIS;
GO

-- ============================================================
-- Transaction A: Resource Allocation Dispatch
-- Atomically dispatch resources and deduct from inventory.
-- Rollback if stock is insufficient (trigger handles the check).
-- ============================================================
DECLARE @allocation_id INT = 4;  -- change as needed

BEGIN TRY
    BEGIN TRANSACTION

        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = qty_requested
        WHERE allocation_id = @allocation_id
          AND status = 'approved';
        -- trg_ResourceAllocation_Dispatch fires here and deducts inventory
        -- If insufficient stock, trigger calls ROLLBACK and RAISERROR

    COMMIT TRANSACTION
    PRINT 'Transaction A committed: Resources dispatched.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'Transaction A rolled back: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- Transaction B: Rescue Team Assignment
-- Atomically create assignment and update report status.
-- trg_TeamAssignment_Insert will update team availability.
-- ============================================================
DECLARE @team_id   INT = 2;
DECLARE @report_id INT = 2;
DECLARE @operator  INT = 2;

BEGIN TRY
    BEGIN TRANSACTION

        INSERT INTO TeamAssignments (team_id, report_id, status)
        VALUES (@team_id, @report_id, 'assigned');
        -- trigger fires: sets RescueTeams.availability_status = 'assigned'

        UPDATE EmergencyReports
        SET status = 'in_progress', operator_id = @operator
        WHERE report_id = @report_id
          AND status = 'pending';

    COMMIT TRANSACTION
    PRINT 'Transaction B committed: Team assigned, report updated.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'Transaction B rolled back: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- Transaction C: Record Donation + Finance Transaction
-- Both inserts succeed together or both are rolled back.
-- trg_FinanceTransaction_AuditLog logs to AuditLog automatically.
-- ============================================================
DECLARE @performed_by INT = 5;

BEGIN TRY
    BEGIN TRANSACTION

        INSERT INTO Donations (received_by, donor_name, donor_type, amount, payment_method)
        VALUES (@performed_by, N'Test Donor Corp', 'organization', 75000.00, 'bank_transfer');

        DECLARE @new_donation_id INT = SCOPE_IDENTITY();

        INSERT INTO FinanceTransactions (performed_by, donation_id, transaction_type, amount, status)
        VALUES (@performed_by, @new_donation_id, 'donation', 75000.00, 'completed');
        -- trigger fires: logs to AuditLog

    COMMIT TRANSACTION
    PRINT 'Transaction C committed: Donation recorded.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'Transaction C rolled back: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- Transaction D: Approval Workflow — Approve Pending Request
-- Approving an ApprovalRequest triggers the ResourceAllocation
-- to be updated to 'approved' automatically (via Trigger 10).
-- ============================================================
DECLARE @approval_id INT = 5;
DECLARE @reviewer    INT = 4;

BEGIN TRY
    BEGIN TRANSACTION

        UPDATE ApprovalRequests
        SET status      = 'approved',
            reviewed_by = @reviewer,
            reviewed_at = GETDATE(),
            remarks     = N'Approved after verification'
        WHERE approval_id = @approval_id
          AND status = 'pending';
        -- trg_ApprovalRequest_Execute fires and updates ResourceAllocations.status

    COMMIT TRANSACTION
    PRINT 'Transaction D committed: Approval processed.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'Transaction D rolled back: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- Transaction E: Patient Admission
-- Atomically admit patient and decrement hospital beds.
-- trg_Patient_Admission handles bed decrement + rollback if full.
-- ============================================================
DECLARE @report_for_patient INT = 8;
DECLARE @hospital_id        INT = 2;
DECLARE @field_officer      INT = 3;

BEGIN TRY
    BEGIN TRANSACTION

        INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition)
        VALUES (@report_for_patient, @hospital_id, @field_officer, GETDATE(), 'stable');
        -- trigger fires: decrements available_beds
        -- if no beds available: trigger rolls back and raises error

    COMMIT TRANSACTION
    PRINT 'Transaction E committed: Patient admitted.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'Transaction E rolled back: ' + ERROR_MESSAGE();
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
    PRINT 'Transaction F committed (unexpected).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'Transaction F rolled back as expected: ' + ERROR_MESSAGE();
END CATCH;
GO

