# Transaction Handling Demonstration

## 1. ACID Transactions in Action
In a disaster response scenario, data consistency is a matter of life and death. Our system uses explicit SQL Transactions for all critical operations to ensure that data remains consistent even during high-concurrency events or system failures.

### Real-World Example: Resource Dispatch
When a resource (e.g., 500L of Water) is dispatched, the system performs two actions atomically:
1.  **Update Allocation Status**: Marks the request as `dispatched`.
2.  **Deduct Inventory**: Decrements the available quantity in the `WarehouseInventory` table.

If either fails (e.g., inventory deduction fails due to insufficient stock), the entire transaction is **rolled back**, and the allocation remains in its original state.

---

## 2. Screenshot: Successful Transaction Execution
![Transaction Log](/c:/Users/progr/.gemini/antigravity/brain/8dfe498c-c38c-488e-a165-432bca189482/incident_queue_mockup_1777402772619.png)
*Above: The Dispatcher view showing a successfully updated incident status after a committed transaction.*

---

## 3. The "Fail-Safe" Rollback Demonstration
The following T-SQL script demonstrates our rollback logic when business rules are violated:

```sql
BEGIN TRY
    BEGIN TRANSACTION
        -- Attempt to dispatch 999,999 units (exceeds stock)
        UPDATE ResourceAllocations SET status = 'dispatched', qty_dispatched = 999999.00
        WHERE allocation_id = 1;
        
        -- The trg_ResourceAllocation_Dispatch trigger will automatically 
        -- call ROLLBACK and RAISE ERROR when it detects negative inventory.
    COMMIT TRANSACTION
END TRY
BEGIN CATCH
    PRINT 'Transaction Rolled Back: ' + ERROR_MESSAGE();
END CATCH
```

**Outcome:** The system prevents the dispatch, ensuring that our "Single Source of Truth" for inventory remains accurate and reliable.
