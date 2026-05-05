USE DisasterMIS;
GO

-- RESET BLOCK: Restore known state so this file is re-runnable
UPDATE WarehouseInventory
    SET quantity_available = quantity_available +
        ISNULL((SELECT qty_dispatched FROM ResourceAllocations
                WHERE allocation_id = 12 AND status = 'dispatched'), 0)
    WHERE warehouse_id = 2 AND resource_id = 5;

UPDATE ResourceAllocations
    SET status = 'approved', qty_dispatched = 0, approved_by = NULL
    WHERE allocation_id = 12;

DELETE FROM TeamAssignments WHERE team_id = 3 AND report_id = 3;
UPDATE RescueTeams SET availability_status = 'available' WHERE team_id = 3;
UPDATE EmergencyReports SET status = 'pending', operator_id = NULL WHERE report_id = 3;

UPDATE ResourceAllocations SET status = 'pending' WHERE allocation_id = 10;
UPDATE ApprovalRequests
    SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, remarks = NULL
    WHERE approval_id = 9;

DECLARE @extra INT;
SELECT @extra = COUNT(*) - 1 FROM Patients WHERE report_id = 8 AND hospital_id = 3;
IF @extra > 0
BEGIN
    DELETE FROM Patients WHERE patient_id IN (
        SELECT TOP (@extra) patient_id
        FROM Patients
        WHERE report_id = 8 AND hospital_id = 3
        ORDER BY patient_id DESC
    );
    UPDATE Hospitals SET available_beds = available_beds + @extra WHERE hospital_id = 3;
END;

UPDATE ResourceAllocations SET status = 'pending' WHERE allocation_id = 11;
UPDATE ApprovalRequests
    SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, remarks = NULL
    WHERE approval_id = 10;
GO

-- -- Transaction A: Resource Allocation Dispatch
-- Trigger deducts inventory; rolls back if stock insufficient.
-- Pre-condition: allocation 12 is 'approved' (set by reset block above).
BEGIN TRY
    BEGIN TRANSACTION
        SELECT allocation_id, status, qty_requested
        FROM ResourceAllocations WITH (UPDLOCK)
        WHERE allocation_id = 12 AND status = 'approved';

        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = qty_requested
        WHERE allocation_id = 12 AND status = 'approved';
    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction B: Rescue Team Assignment
-- trg_TeamAssignment_Insert fires → sets team status to 'assigned'.
-- Pre-condition: team 3 is 'available', report 3 is 'pending' (reset above).
BEGIN TRY
    BEGIN TRANSACTION
        SELECT team_id, availability_status
        FROM RescueTeams WITH (UPDLOCK)
        WHERE team_id = 3 AND availability_status = 'available';

        IF @@ROWCOUNT = 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('Team is not available for assignment.', 16, 1);
            RETURN;
        END

        INSERT INTO TeamAssignments (team_id, report_id, status)
        VALUES (3, 3, 'assigned');
        -- trigger fires: sets RescueTeams.availability_status = 'assigned'

        UPDATE EmergencyReports
        SET status = 'in_progress', operator_id = 2
        WHERE report_id = 3 AND status = 'pending';
    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction C: Record Donation + Finance Transaction
-- trg_FinanceTransaction_AuditLog fires → logs entry to AuditLog.
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
-- trg_ApprovalRequest_Execute fires → sets linked ResourceAllocation
-- Pre-condition: approval 9 is 'pending' (reset block above).
BEGIN TRY
    BEGIN TRANSACTION

        SELECT approval_id, status
        FROM ApprovalRequests WITH (UPDLOCK)
        WHERE approval_id = 9 AND status = 'pending';

        UPDATE ApprovalRequests
        SET status      = 'approved',
            reviewed_by = 4,
            reviewed_at = GETDATE(),
            remarks     = N'Approved after verification'
        WHERE approval_id = 9 AND status = 'pending';
        -- trg_ApprovalRequest_Execute fires: sets ResourceAllocations.status = 'approved'

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- Transaction E: Patient Admission
-- trg_Patient_Admission fires → decrements available_beds.
-- Pre-condition: hospital 3 has available_beds > 0 (verified by reset).
BEGIN TRY
    BEGIN TRANSACTION
        SELECT hospital_id, available_beds
        FROM Hospitals WITH (UPDLOCK)
        WHERE hospital_id = 3 AND available_beds > 0;

        IF @@ROWCOUNT = 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('No beds available in this hospital.', 16, 1);
            RETURN;
        END

        INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition)
        VALUES (8, 3, 3, GETDATE(), 'stable');
        -- trigger fires: decrements available_beds

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO


-- Transaction D2: Approval Workflow — Reject Pending Request
-- trg_ApprovalRequest_Reject fires → sets linked ResourceAllocation
-- Pre-condition: approval 10 is 'pending' (reset block above).
BEGIN TRY
    BEGIN TRANSACTION

        SELECT approval_id, status
        FROM ApprovalRequests WITH (UPDLOCK)
        WHERE approval_id = 10 AND status = 'pending';

        UPDATE ApprovalRequests
        SET status      = 'rejected',
            reviewed_by = 4,
            reviewed_at = GETDATE(),
            remarks     = N'Insufficient justification provided'
        WHERE approval_id = 10 AND status = 'pending';
        -- trg_ApprovalRequest_Reject fires: sets ResourceAllocations.status = 'rejected'

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
END CATCH;
GO

-- ============================================================
-- Transaction F: Rollback Demo — Force Insufficient-Stock Error
-- Demonstrates ACID rollback + UPDLOCK together.
-- warehouse_id=1, resource_id=1 has 5 000 units of stock.
-- Requesting 999 999 causes the dispatch trigger to detect
-- negative inventory → trigger calls ROLLBACK → no data persists.
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION

        -- UPDLOCK: lock the inventory row before checking stock.
        -- A concurrent request cannot read this row while we hold the lock.
        SELECT warehouse_id, resource_id, quantity_available
        FROM WarehouseInventory WITH (UPDLOCK)
        WHERE warehouse_id = 1 AND resource_id = 1;

        -- Insert an allocation requesting far more than available stock.
        INSERT INTO ResourceAllocations (report_id, resource_id, warehouse_id, qty_requested, status)
        VALUES (1, 1, 1, 999999.00, 'approved');

        DECLARE @fake_id INT = SCOPE_IDENTITY();

        -- Dispatch triggers inventory deduction: 5000 - 999999 < 0
        -- → trigger detects negative stock → ROLLBACK + RAISERROR
        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = 999999.00
        WHERE allocation_id = @fake_id;

    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    -- Expected output: "Insufficient stock in warehouse." error caught here.
    -- The INSERT and UPDATE are both rolled back — no data persists.
END CATCH;
GO
