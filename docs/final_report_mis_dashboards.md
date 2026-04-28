# MIS Reports / Dashboards

## 1. Executive Situational Awareness Dashboard
The Analytics Dashboard provides real-time insights into the scale and status of disasters across the region. It is designed for high-level decision-makers to identify trends and allocate budgets effectively.

![Analytics Dashboard](/c:/Users/progr/.gemini/antigravity/brain/8dfe498c-c38c-488e-a165-432bca189482/analytics_dashboard_mockup_1777402721113.png)

### Key Metrics Tracked:
*   **Incident Breakdown**: Real-time distribution of Flood, Earthquake, and Fire incidents.
*   **Severity Triage**: Prioritization of 'Critical' and 'High' severity cases to ensure rapid response.
*   **Resource Utilization**: Tracking of Requested vs. Dispatched vs. Consumed resources to identify logistical bottlenecks.
*   **Response Latency**: Monitoring average time from initial report to team assignment.

---

## 2. Operational Reports
The system generates several automated reports to ensure operational transparency:

| Report Name | Targeted Insight |
|-------------|------------------|
| **Hospital Capacity Report** | Identifies hospitals with available beds in real-time. |
| **Low-Stock Alert Report** | Automatically flags warehouses where supplies are below threshold. |
| **Financial Transparency Ledger** | Summarizes all donations vs expenses for public accountability. |
| **User Activity Audit Trail** | Provides a complete record of who did what, when, and from which IP. |

---

## 3. Strategic Financial Overview
By aggregating data from the `FinanceTransactions` table via role-based views, we provide a secure yet comprehensive look at the mission's funding and spending without exposing sensitive donor PII.

**Net Balance Calculation:**
```sql
SELECT total_donations - total_expenses AS Liquidity FROM vw_FinancialSummary;
```
