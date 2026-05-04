-- Smart Disaster Response MIS

CREATE DATABASE DisasterMIS;
GO


USE DisasterMIS;


-- ============================================================
-- GROUP A: User Management & Authentication
-- ============================================================

CREATE TABLE Users (
    user_id       INT            NOT NULL IDENTITY(1,1),
    username      NVARCHAR(50)   NOT NULL,
    email         NVARCHAR(100)  NOT NULL,
    phone         NVARCHAR(20)   NULL,
    role          NVARCHAR(30)   NOT NULL,
    password_hash NVARCHAR(255)  NOT NULL,
    is_active     BIT            NOT NULL DEFAULT 1,
    created_at    DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Users          PRIMARY KEY (user_id),
    CONSTRAINT UQ_Users_username UNIQUE (username),
    CONSTRAINT UQ_Users_email    UNIQUE (email),
    CONSTRAINT CK_Users_role     CHECK (role IN (
        'admin', 'emergency_operator', 'field_officer',
        'warehouse_manager', 'finance_officer'
    ))
);


CREATE TABLE Citizens (
    citizen_id    INT            NOT NULL IDENTITY(1,1),
    full_name     NVARCHAR(100)  NOT NULL,
    cnic          NCHAR(15)      NULL,
    phone         NVARCHAR(20)   NULL,
    address       NVARCHAR(MAX)  NULL,
    registered_at DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Citizens PRIMARY KEY (citizen_id)
);

-- Unique only when CNIC is provided; multiple NULLs allowed
CREATE UNIQUE INDEX UX_Citizens_cnic ON Citizens(cnic) WHERE cnic IS NOT NULL;
GO


-- ============================================================
-- GROUP B: Emergency Reporting
-- ============================================================

CREATE TABLE EmergencyReports (
    report_id      INT            NOT NULL IDENTITY(1,1),
    citizen_id     INT            NOT NULL,
    operator_id    INT            NULL,
    disaster_type  NVARCHAR(50)   NOT NULL,
    severity_level NVARCHAR(20)   NOT NULL,
    location       NVARCHAR(255)  NOT NULL,
    latitude       DECIMAL(10,7)  NULL,
    longitude      DECIMAL(10,7)  NULL,
    status         NVARCHAR(20)   NOT NULL DEFAULT 'pending',
    reported_at    DATETIME       NOT NULL DEFAULT GETDATE(),
    resolved_at    DATETIME       NULL,
    CONSTRAINT PK_EmergencyReports PRIMARY KEY (report_id),
    CONSTRAINT FK_ER_citizen        FOREIGN KEY (citizen_id)  REFERENCES Citizens(citizen_id),
    CONSTRAINT FK_ER_operator       FOREIGN KEY (operator_id) REFERENCES Users(user_id),
    CONSTRAINT CK_ER_severity       CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT CK_ER_status         CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT CK_ER_disaster_type  CHECK (disaster_type IN ('flood', 'earthquake', 'fire', 'other'))
);


CREATE TABLE MediaAttachments (
    attachment_id INT           NOT NULL IDENTITY(1,1),
    report_id     INT           NOT NULL,
    file_url      NVARCHAR(500) NOT NULL,
    media_type    NVARCHAR(50)  NOT NULL,
    uploaded_at   DATETIME      NOT NULL DEFAULT GETDATE(),
    uploaded_by   INT           NULL,
    CONSTRAINT PK_MediaAttachments PRIMARY KEY (attachment_id),
    CONSTRAINT FK_MA_report        FOREIGN KEY (report_id)   REFERENCES EmergencyReports(report_id),
    CONSTRAINT FK_MA_uploaded_by   FOREIGN KEY (uploaded_by) REFERENCES Users(user_id),
    CONSTRAINT CK_MA_media_type    CHECK (media_type IN ('image', 'video', 'audio', 'document'))
);


CREATE TABLE Notifications (
    notification_id   INT            NOT NULL IDENTITY(1,1),
    user_id           INT            NOT NULL,
    message           NVARCHAR(MAX)  NOT NULL,
    notification_type NVARCHAR(50)   NOT NULL,
    is_read           BIT            NOT NULL DEFAULT 0,
    sent_at           DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Notifications PRIMARY KEY (notification_id),
    CONSTRAINT FK_Notif_user    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT CK_Notif_type    CHECK (notification_type IN ('alert', 'assignment', 'approval', 'system'))
);


-- ============================================================
-- GROUP C: Rescue Operations
-- ============================================================

CREATE TABLE RescueTeams (
    team_id             INT           NOT NULL IDENTITY(1,1),
    team_name           NVARCHAR(100) NOT NULL,
    team_type           NVARCHAR(20)  NOT NULL,
    current_location    NVARCHAR(255) NULL,
    availability_status NVARCHAR(20)  NOT NULL DEFAULT 'available',
    capacity            INT           NOT NULL DEFAULT 1,
    CONSTRAINT PK_RescueTeams     PRIMARY KEY (team_id),
    CONSTRAINT CK_RT_team_type    CHECK (team_type IN ('medical', 'fire', 'rescue')),
    CONSTRAINT CK_RT_availability CHECK (availability_status IN ('available', 'assigned', 'busy', 'completed'))
);


-- Composite PK: weak entity owned by RescueTeams
CREATE TABLE TeamMembers (
    team_id     INT          NOT NULL,
    member_id   INT          NOT NULL,
    user_id     INT          NOT NULL,
    member_role NVARCHAR(50) NULL,
    joined_at   DATETIME     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TeamMembers PRIMARY KEY (team_id, member_id),
    CONSTRAINT FK_TM_team     FOREIGN KEY (team_id) REFERENCES RescueTeams(team_id),
    CONSTRAINT FK_TM_user     FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT UQ_TM_user     UNIQUE (user_id)
);


CREATE TABLE TeamAssignments (
    assignment_id INT           NOT NULL IDENTITY(1,1),
    team_id       INT           NOT NULL,
    report_id     INT           NOT NULL,
    assigned_at   DATETIME      NOT NULL DEFAULT GETDATE(),
    completed_at  DATETIME      NULL,
    status        NVARCHAR(20)  NOT NULL DEFAULT 'assigned',
    notes         NVARCHAR(MAX) NULL,
    CONSTRAINT PK_TeamAssignments  PRIMARY KEY (assignment_id),
    CONSTRAINT FK_TA_team          FOREIGN KEY (team_id)   REFERENCES RescueTeams(team_id),
    CONSTRAINT FK_TA_report        FOREIGN KEY (report_id) REFERENCES EmergencyReports(report_id),
    CONSTRAINT CK_TA_status        CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT UQ_TA_team_report   UNIQUE (team_id, report_id)
);


-- Composite PK: weak entity of RescueTeams; log_id is sequential within each team
CREATE TABLE DispatchLogs (
    team_id         INT           NOT NULL,
    log_id          INT           NOT NULL,
    status_update   NVARCHAR(255) NOT NULL,
    location_update NVARCHAR(255) NULL,
    warehouse_id    INT           NULL,
    logged_at       DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DispatchLogs PRIMARY KEY (team_id, log_id),
    CONSTRAINT FK_DL_team      FOREIGN KEY (team_id) REFERENCES RescueTeams(team_id)
);


-- ============================================================
-- GROUP D: Hospital & Patient Management
-- ============================================================

CREATE TABLE Hospitals (
    hospital_id    INT           NOT NULL IDENTITY(1,1),
    name           NVARCHAR(150) NOT NULL,
    location       NVARCHAR(255) NOT NULL,
    total_beds     INT           NOT NULL DEFAULT 0,
    available_beds INT           NOT NULL DEFAULT 0,
    contact_number NVARCHAR(20)  NULL,
    is_active      BIT           NOT NULL DEFAULT 1,
    CONSTRAINT PK_Hospitals        PRIMARY KEY (hospital_id),
    CONSTRAINT CK_H_available_beds CHECK (available_beds >= 0),
    CONSTRAINT CK_H_total_beds     CHECK (total_beds >= 0)
);


CREATE TABLE Patients (
    patient_id       INT           NOT NULL IDENTITY(1,1),
    report_id        INT           NOT NULL,
    hospital_id      INT           NULL,
    field_officer_id INT           NULL,
    admission_time   DATETIME      NOT NULL,
    discharge_time   DATETIME      NULL,
    condition        NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_Patients      PRIMARY KEY (patient_id),
    CONSTRAINT FK_Pat_report    FOREIGN KEY (report_id)        REFERENCES EmergencyReports(report_id),
    CONSTRAINT FK_Pat_hospital  FOREIGN KEY (hospital_id)      REFERENCES Hospitals(hospital_id),
    CONSTRAINT FK_Pat_officer   FOREIGN KEY (field_officer_id) REFERENCES Users(user_id),
    CONSTRAINT CK_Pat_condition CHECK (condition IN ('stable', 'critical', 'serious', 'discharged'))
);


-- ============================================================
-- GROUP E: Warehouse, Resource & Allocation
-- ============================================================

CREATE TABLE Warehouses (
    warehouse_id   INT           NOT NULL IDENTITY(1,1),
    manager_id     INT           NULL,
    name           NVARCHAR(150) NOT NULL,
    location       NVARCHAR(255) NOT NULL,
    total_capacity INT           NOT NULL DEFAULT 0,
    created_at     DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Warehouses PRIMARY KEY (warehouse_id),
    CONSTRAINT FK_WH_manager FOREIGN KEY (manager_id) REFERENCES Users(user_id)
);


-- FK from DispatchLogs to Warehouses (added after Warehouses is created)
ALTER TABLE DispatchLogs
    ADD CONSTRAINT FK_DL_warehouse FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id);


CREATE TABLE Resources (
    resource_id     INT           NOT NULL IDENTITY(1,1),
    resource_name   NVARCHAR(100) NOT NULL,
    resource_type   NVARCHAR(50)  NOT NULL,
    unit_of_measure NVARCHAR(20)  NOT NULL,
    description     NVARCHAR(MAX) NULL,
    CONSTRAINT PK_Resources  PRIMARY KEY (resource_id),
    CONSTRAINT CK_Res_type   CHECK (resource_type IN ('food', 'water', 'medicine', 'shelter', 'equipment')),
    CONSTRAINT CK_Res_unit   CHECK (unit_of_measure IN ('kg', 'litre', 'unit', 'box'))
);


-- Composite PK: weak entity with dual ownership (warehouse + resource)
CREATE TABLE WarehouseInventory (
    warehouse_id       INT           NOT NULL,
    resource_id        INT           NOT NULL,
    quantity_available DECIMAL(12,2) NOT NULL DEFAULT 0,
    threshold_level    DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_updated       DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_WarehouseInventory PRIMARY KEY (warehouse_id, resource_id),
    CONSTRAINT FK_WI_warehouse       FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id),
    CONSTRAINT FK_WI_resource        FOREIGN KEY (resource_id)  REFERENCES Resources(resource_id),
    CONSTRAINT CK_WI_quantity        CHECK (quantity_available >= 0),
    CONSTRAINT CK_WI_threshold       CHECK (threshold_level >= 0)
);


CREATE TABLE ResourceAllocations (
    allocation_id  INT           NOT NULL IDENTITY(1,1),
    report_id      INT           NOT NULL,
    resource_id    INT           NOT NULL,
    warehouse_id   INT           NOT NULL,
    qty_requested  DECIMAL(12,2) NOT NULL,
    qty_dispatched DECIMAL(12,2) NOT NULL DEFAULT 0,
    qty_consumed   DECIMAL(12,2) NOT NULL DEFAULT 0,
    status         NVARCHAR(20)  NOT NULL DEFAULT 'pending',
    requested_at   DATETIME      NOT NULL DEFAULT GETDATE(),
    approved_by    INT           NULL,
    CONSTRAINT PK_ResourceAllocations PRIMARY KEY (allocation_id),
    CONSTRAINT FK_RA_report            FOREIGN KEY (report_id)    REFERENCES EmergencyReports(report_id),
    CONSTRAINT FK_RA_resource          FOREIGN KEY (resource_id)  REFERENCES Resources(resource_id),
    CONSTRAINT FK_RA_warehouse         FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id),
    CONSTRAINT FK_RA_approved_by       FOREIGN KEY (approved_by)  REFERENCES Users(user_id),
    CONSTRAINT CK_RA_status            CHECK (status IN ('pending', 'approved', 'dispatched', 'consumed', 'rejected')),
    CONSTRAINT CK_RA_qty_requested     CHECK (qty_requested > 0),
    CONSTRAINT CK_RA_qty_dispatched    CHECK (qty_dispatched >= 0),
    CONSTRAINT CK_RA_qty_consumed      CHECK (qty_consumed >= 0)
);


CREATE TABLE ApprovalRequests (
    approval_id   INT           NOT NULL IDENTITY(1,1),
    allocation_id INT           NULL,
    request_type  NVARCHAR(60)  NOT NULL,
    reference_id  INT           NULL,
    status        NVARCHAR(20)  NOT NULL DEFAULT 'pending',
    requested_at  DATETIME      NOT NULL DEFAULT GETDATE(),
    reviewed_at   DATETIME      NULL,
    remarks       NVARCHAR(MAX) NULL,
    requested_by  INT           NOT NULL,
    reviewed_by   INT           NULL,
    CONSTRAINT PK_ApprovalRequests PRIMARY KEY (approval_id),
    CONSTRAINT FK_AR_allocation    FOREIGN KEY (allocation_id) REFERENCES ResourceAllocations(allocation_id),
    CONSTRAINT FK_AR_requested_by  FOREIGN KEY (requested_by)  REFERENCES Users(user_id),
    CONSTRAINT FK_AR_reviewed_by   FOREIGN KEY (reviewed_by)   REFERENCES Users(user_id),
    CONSTRAINT CK_AR_status        CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT CK_AR_request_type  CHECK (request_type IN ('resource_allocation', 'financial', 'deployment'))
);


-- ============================================================
-- GROUP F: Financial Management
-- ============================================================

CREATE TABLE Donations (
    donation_id    INT            NOT NULL IDENTITY(1,1),
    received_by    INT            NULL,
    donor_name     NVARCHAR(150)  NOT NULL,
    donor_type     NVARCHAR(30)   NOT NULL,
    amount         DECIMAL(15,2)  NOT NULL,
    payment_method NVARCHAR(50)   NULL,
    donated_at     DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Donations       PRIMARY KEY (donation_id),
    CONSTRAINT FK_Don_received_by FOREIGN KEY (received_by) REFERENCES Users(user_id),
    CONSTRAINT CK_Don_donor_type  CHECK (donor_type IN ('individual', 'organization', 'government')),
    CONSTRAINT CK_Don_amount      CHECK (amount > 0)
);


CREATE TABLE Expenses (
    expense_id    INT            NOT NULL IDENTITY(1,1),
    recorded_by   INT            NOT NULL,
    allocation_id INT            NULL,
    category      NVARCHAR(100)  NOT NULL,
    amount        DECIMAL(15,2)  NOT NULL,
    description   NVARCHAR(MAX)  NULL,
    expense_date  DATE           NOT NULL,
    CONSTRAINT PK_Expenses        PRIMARY KEY (expense_id),
    CONSTRAINT FK_Exp_recorded_by FOREIGN KEY (recorded_by)   REFERENCES Users(user_id),
    CONSTRAINT FK_Exp_allocation  FOREIGN KEY (allocation_id) REFERENCES ResourceAllocations(allocation_id),
    CONSTRAINT CK_Exp_category    CHECK (category IN ('procurement', 'logistics', 'medical', 'admin', 'other')),
    CONSTRAINT CK_Exp_amount      CHECK (amount > 0)
);


CREATE TABLE FinanceTransactions (
    transaction_id        INT           NOT NULL IDENTITY(1,1),
    performed_by          INT           NOT NULL,
    donation_id           INT           NULL,
    expense_id            INT           NULL,
    transaction_type      NVARCHAR(30)  NOT NULL,
    amount                DECIMAL(15,2) NOT NULL,
    transaction_timestamp DATETIME      NOT NULL DEFAULT GETDATE(),
    status                NVARCHAR(20)  NOT NULL DEFAULT 'completed',
    CONSTRAINT PK_FinanceTransactions PRIMARY KEY (transaction_id),
    CONSTRAINT FK_FT_performed_by     FOREIGN KEY (performed_by) REFERENCES Users(user_id),
    CONSTRAINT FK_FT_donation         FOREIGN KEY (donation_id)  REFERENCES Donations(donation_id),
    CONSTRAINT FK_FT_expense          FOREIGN KEY (expense_id)   REFERENCES Expenses(expense_id),
    CONSTRAINT CK_FT_type             CHECK (transaction_type IN ('donation', 'expense', 'procurement', 'transfer')),
    CONSTRAINT CK_FT_amount           CHECK (amount > 0),
    CONSTRAINT CK_FT_status           CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    -- XOR: exactly one of donation_id / expense_id must be non-NULL (except transfers)
    CONSTRAINT CK_FT_xor              CHECK (
        (donation_id IS NOT NULL AND expense_id IS NULL) OR
        (donation_id IS NULL     AND expense_id IS NOT NULL) OR
        (transaction_type = 'transfer')
    )
);


-- ============================================================
-- GROUP G: Audit & Monitoring
-- ============================================================

-- IMMUTABLE table: INSERT only via triggers, never UPDATE/DELETE
CREATE TABLE AuditLog (
    log_id           BIGINT        NOT NULL IDENTITY(1,1),
    user_id          INT           NULL,
    action_type      NVARCHAR(20)  NOT NULL,
    table_affected   NVARCHAR(60)  NOT NULL,
    record_id        BIGINT        NULL,
    old_value        NVARCHAR(MAX) NULL,
    new_value        NVARCHAR(MAX) NULL,
    ip_address       NVARCHAR(45)  NULL,
    action_timestamp DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_AuditLog       PRIMARY KEY (log_id),
    CONSTRAINT FK_AL_user        FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT CK_AL_action_type CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'))
);

