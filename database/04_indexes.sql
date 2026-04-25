USE DisasterMIS;
GO

-- Single-column indexes on frequently queried columns

CREATE INDEX IX_ER_Location       ON EmergencyReports(location);
CREATE INDEX IX_ER_DisasterType   ON EmergencyReports(disaster_type);
CREATE INDEX IX_ER_SeverityLevel  ON EmergencyReports(severity_level);
CREATE INDEX IX_ER_Status         ON EmergencyReports(status);
CREATE INDEX IX_ER_ReportedAt     ON EmergencyReports(reported_at);

CREATE INDEX IX_Res_ResourceType  ON Resources(resource_type);

CREATE INDEX IX_RA_Status         ON ResourceAllocations(status);

CREATE INDEX IX_FT_Timestamp      ON FinanceTransactions(transaction_timestamp);
CREATE INDEX IX_FT_Type           ON FinanceTransactions(transaction_type);

CREATE INDEX IX_AL_ActionTimestamp ON AuditLog(action_timestamp);
CREATE INDEX IX_AL_TableAffected   ON AuditLog(table_affected);

CREATE INDEX IX_RT_AvailStatus     ON RescueTeams(availability_status);
CREATE INDEX IX_TA_TeamId          ON TeamAssignments(team_id);

GO

-- Composite indexes for multi-column filter queries

CREATE INDEX IX_ER_Location_Severity    ON EmergencyReports(location, severity_level);
CREATE INDEX IX_ER_DisasterType_Status  ON EmergencyReports(disaster_type, status);

CREATE INDEX IX_RA_Report_Status        ON ResourceAllocations(report_id, status);

CREATE INDEX IX_FT_Type_Timestamp       ON FinanceTransactions(transaction_type, transaction_timestamp);

CREATE INDEX IX_AL_Table_Timestamp      ON AuditLog(table_affected, action_timestamp);

CREATE INDEX IX_TA_Team_Status          ON TeamAssignments(team_id, status);

CREATE INDEX IX_WI_Resource_Qty         ON WarehouseInventory(resource_id, quantity_available);

CREATE INDEX IX_Notif_User_IsRead       ON Notifications(user_id, is_read);

GO

PRINT 'Indexes created: 13 single-column + 8 composite.';
GO
