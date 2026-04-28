# Trigger Implementation & Use Cases

## 1. The "Sentinels" of Data Integrity
Triggers in the Smart Disaster Response MIS are used to enforce business rules that are too critical to be left to the application layer alone. They ensure that no matter how the database is accessed, the data remains consistent and life-saving invariants are preserved.

---

## 2. Top 5 Life-Saving Use Cases

### Case 1: Automated Inventory Deduction
**Trigger:** `trg_ResourceAllocation_Dispatch`
*   **Logic**: Automatically deducts from `WarehouseInventory` when an allocation is marked `dispatched`.
*   **Benefit**: Eliminates manual stock counting errors and prevents "ghost dispatches" by rolling back if stock is insufficient.

### Case 2: Hospital Bed Triage
**Trigger:** `trg_Patient_Admission`
*   **Logic**: Decrements `available_beds` in the `Hospitals` table when a patient is admitted.
*   **Benefit**: Prevents ambulances from being redirected to hospitals that have reached their physical limit.

### Case 3: Rescue Team Live-Status
**Trigger:** `trg_TeamAssignment_Insert`
*   **Logic**: Automatically marks a `RescueTeam` as `assigned` as soon as they are linked to a report.
*   **Benefit**: Ensures operators always have an accurate, real-time map of available responders.

### Case 4: Critical Stock Alerts
**Trigger:** `trg_Inventory_LowStockAlert`
*   **Logic**: Monitors stock levels and sends a `Notification` to the Warehouse Manager if a resource drops below its `threshold_level`.
*   **Benefit**: Enables proactive procurement before supplies run out during an emergency.

### Case 5: Mandatory Audit Trail
**Trigger:** `trg_EmergencyReport_AuditLog`
*   **Logic**: Captures the `old_value` and `new_value` of every report status change.
*   **Benefit**: Provides full accountability for legal and performance reviews post-disaster.

---

## 3. Implementation Example
```sql
CREATE TRIGGER trg_Patient_Admission
ON Patients AFTER INSERT AS
BEGIN
    IF EXISTS (SELECT 1 FROM Hospitals h JOIN INSERTED i ON i.hospital_id = h.hospital_id WHERE h.available_beds < 1)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('No beds available at this hospital.', 16, 1);
    END;

    UPDATE Hospitals SET available_beds = available_beds - 1
    WHERE hospital_id IN (SELECT hospital_id FROM INSERTED);
END;
```
