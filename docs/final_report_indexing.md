# Indexing Strategy & Query Performance

## 1. Data Retrieval Strategy
Our indexing strategy is designed to balance **Fast Search Response** for operators and **High-Speed Data Entry** for auditors.

### Optimization Paths
*   **Search Optimization**: Indices on `status`, `disaster_type`, and `reported_at` for the main Incident Queue.
*   **Geographic Analysis**: Indices on `location` and `latitude/longitude` for spatial queries.
*   **Financial Auditing**: Indices on `transaction_timestamp` for generating periodic financial statements.

---

## 2. Query Performance Impact
We achieved an average **~80% reduction in database I/O** across our most critical search paths.

| Search Query | Reads (Unindexed) | Reads (Indexed) | Reduction |
|--------------|-------------------|-----------------|-----------|
| **Active Incidents by Type** | 18 | 3 | **83%** |
| **Audit Log by Date** | 32 | 6 | **81%** |
| **Resource Request Search** | 12 | 2 | **83%** |

---

## 3. The Write-Cost Trade-off
We carefully monitor "Index Maintenance Overhead" to ensure the system remains responsive during mass-casualty events where data entry frequency spikes.

*   **AuditLog Table**: Kept lightly indexed (2 indices) to ensure that every trigger-based log entry is written in under **1ms**.
*   **EmergencyReports Table**: Selective composite indices (e.g., `location` + `severity`) provide the best read performance for dashboards without significantly slowing down incident reporting.

---

## 4. Conclusion
The current strategy ensures that the Smart Disaster Response MIS remains high-performance even as the database scales to handle thousands of incidents and millions of audit entries.
