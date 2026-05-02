-- 
-- Smart Disaster Response MIS
-- 05_seed.sql  --  Sample DML Data (Realistic Demo Dataset)
-- Run AFTER 01_schema.sql through 04_indexes.sql
-- Run: sqlcmd -S localhost -U sa -P <password> -i database/05_seed.sql
-- NOTE: password_hash values below are bcrypt hashes of 'Password123!'
-- ============================================================

USE DisasterMIS;
GO

-- ============================================================
-- GROUP A: Users (one per role + extras)
-- ============================================================
-- All passwords = 'Password123!' (bcrypt hash, cost 12)
INSERT INTO Users (username, email, phone, role, password_hash, is_active) VALUES
('admin_bilal',  'bilal.admin@disastermis.pk', '0300-1111111', 'admin',               '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('op_bilal',    'bilal.op@disastermis.pk',    '0301-2222222', 'emergency_operator',  '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('fo_bilal',    'bilal.fo@disastermis.pk',    '0302-3333333', 'field_officer',       '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('wm_bilal',    'bilal.wm@disastermis.pk',    '0303-4444444', 'warehouse_manager',   '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('fin_bilal',   'bilal.fin@disastermis.pk',   '0304-5555555', 'finance_officer',     '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('admin2_bilal','bilal2.admin@disastermis.pk','0305-6666666', 'admin',               '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('op2_bilal',   'bilal2.op@disastermis.pk',   '0306-7777777', 'emergency_operator',  '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1),
('fo2_bilal',   'bilal2.fo@disastermis.pk',   '0307-8888888', 'field_officer',       '$2b$12$qvZSZaUVFQjwsUNix7EqKOMzLTEFnqMuYxhj9jBJMDWczOuqyI1Fi', 1);
GO

-- ============================================================
-- GROUP A: Citizens
-- ============================================================
INSERT INTO Citizens (full_name, cnic, phone, address) VALUES
('Muhammad Ali',      '35201-1234567-1', '0321-9876543', 'House 12, Street 4, Lahore'),
('Fatima Zahra',      '35202-2345678-2', '0322-8765432', 'Flat 3B, Block D, Karachi'),
('Ahmed Hassan',      '35203-3456789-3', '0323-7654321', 'Village Kot Mithan, Muzaffargarh'),
('Sana Mirza',        '35204-4567890-4', '0324-6543210', 'Near Rescue 1122, Peshawar'),
('Tariq Mehmood',     '35205-5678901-5', '0325-5432109', 'Chak 45, Multan Road, Faisalabad'),
('Razia Begum',       '35206-6789012-6', '0326-4321098', 'Street 7, Shah Faisal Colony, Hyderabad'),
('Imran Khan',        '35207-7890123-7', '0327-3210987', 'Mohalla Gulshan, Rawalpindi'),
('Nazia Parveen',     '35208-8901234-8', '0328-2109876', 'Block 14, North Nazimabad, Karachi');
GO

-- ============================================================
-- GROUP B: Emergency Reports
-- ============================================================
INSERT INTO EmergencyReports (citizen_id, operator_id, disaster_type, severity_level, location, latitude, longitude, status) VALUES
(1, 2, 'flood',       'critical', 'Lahore, Gulberg III',           31.5204, 74.3587, 'in_progress'),
(2, 2, 'earthquake',  'high',     'Karachi, Clifton Block 5',      24.8133, 67.0325, 'pending'),
(3, NULL, 'flood',    'medium',   'Muzaffargarh, Near River Chenab',30.0700, 71.1924, 'pending'),
(4, 7, 'fire',        'critical', 'Peshawar, Qissa Khwani Bazaar', 34.0151, 71.5249, 'in_progress'),
(5, 2, 'earthquake',  'low',      'Faisalabad, D-Ground',          31.4180, 73.0790, 'resolved'),
(6, 7, 'flood',       'high',     'Hyderabad, Latifabad Unit 9',   25.3792, 68.3683, 'in_progress'),
(7, 2, 'fire',        'medium',   'Rawalpindi, Raja Bazaar',       33.5651, 73.0169, 'pending'),
(8, NULL, 'flood',    'critical', 'Karachi, Korangi Industrial',   24.8300, 67.1000, 'pending'),
(1, 7, 'earthquake',  'high',     'Lahore, Johar Town',            31.4706, 74.2760, 'in_progress'),
(2, 2, 'fire',        'low',      'Karachi, Orangi Town',          24.9378, 67.0141, 'closed');
GO

-- ============================================================
-- GROUP C: Rescue Teams
-- ============================================================
INSERT INTO RescueTeams (team_name, team_type, current_location, availability_status, capacity) VALUES
('Alpha Medical Unit',   'medical', 'Lahore Civil Hospital',      'assigned',   8),
('Bravo Fire Brigade',   'fire',    'Karachi Fire Station No. 3', 'available',  6),
('Charlie Rescue Squad', 'rescue',  'Islamabad Base Camp',        'available',  10),
('Delta Medical Team',   'medical', 'Peshawar Lady Reading',      'busy',       8),
('Echo Rapid Response',  'rescue',  'Multan Cantt',               'available',  12);
GO

-- TeamMembers (each user belongs to exactly one team)
INSERT INTO TeamMembers (team_id, member_id, user_id, member_role) VALUES
(1, 1, 3, 'Team Lead'),
(1, 2, 8, 'Paramedic'),
(2, 1, 6, 'Team Lead'),
(3, 1, 7, 'Rescue Specialist');
GO

-- TeamAssignments
INSERT INTO TeamAssignments (team_id, report_id, status, notes) VALUES
(1, 1, 'in_progress', 'Team deployed to flood area — water level rising'),
(4, 4, 'in_progress', 'Fire contained on ground floor, evacuation ongoing'),
(3, 6, 'assigned',    'Dispatched to Hyderabad flood zone');
GO

-- ============================================================
-- GROUP D: Hospitals
-- ============================================================
INSERT INTO Hospitals (name, location, total_beds, available_beds, contact_number, is_active) VALUES
('Lahore General Hospital',     'Lahore, Nila Gumbad',              200, 45,  '042-99200400', 1),
('Karachi Civil Hospital',      'Karachi, Ranchore Line',           350, 12,  '021-99215740', 1),
('Peshawar Lady Reading',       'Peshawar, Warsak Road',            400, 80,  '091-9211330',  1),
('Rawalpindi Holy Family',      'Rawalpindi, Satellite Town',       180, 60,  '051-9281028',  1),
('Multan Nishtar Hospital',     'Multan, Nishtar Road',             500, 120, '061-9200800',  1);
GO

-- Patients
INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition) VALUES
(1, 1, 3, DATEADD(HOUR, -3, GETDATE()), 'critical'),
(4, 3, 8, DATEADD(HOUR, -1, GETDATE()), 'serious'),
(1, 1, 3, DATEADD(HOUR, -2, GETDATE()), 'stable'),
(6, 2, 8, DATEADD(HOUR, -4, GETDATE()), 'stable'),
(9, 1, 3, DATEADD(MINUTE, -45, GETDATE()), 'critical');
GO

-- ============================================================
-- GROUP E: Warehouses, Resources, Inventory, Allocations
-- ============================================================
INSERT INTO Warehouses (manager_id, name, location, total_capacity) VALUES
(4, 'Lahore Central Warehouse',  'Lahore, Sagianwala Chowk',     50000),
(4, 'Karachi Port Warehouse',    'Karachi, Port Qasim Area',     80000),
(4, 'Islamabad Emergency Store', 'Islamabad, G-10/4',            30000);
GO

INSERT INTO Resources (resource_name, resource_type, unit_of_measure, description) VALUES
('Wheat Flour 20kg Bag',     'food',      'kg',     'Government grade wheat flour'),
('Drinking Water 1.5L',      'water',     'unit',   'Sealed mineral water bottles'),
('ORS Sachets (Pack of 50)', 'medicine',  'box',    'Oral rehydration salts'),
('Paracetamol 500mg Strip',  'medicine',  'box',    'Basic fever & pain relief'),
('Emergency Tent (6-Person)','shelter',   'unit',   'Waterproof 6-person emergency tent'),
('Life Jacket',              'equipment', 'unit',   'Adult-size foam life jacket'),
('First Aid Kit',            'medicine',  'box',    'Standard 50-item first aid kit'),
('Rice 25kg Bag',            'food',      'kg',     'Basmati rice for relief'),
('Blanket (Fleece)',         'shelter',   'unit',   'Standard relief blanket'),
('Generators (2kW)',         'equipment', 'unit',   'Petrol-powered portable generator');
GO

-- WarehouseInventory
INSERT INTO WarehouseInventory (warehouse_id, resource_id, quantity_available, threshold_level) VALUES
(1, 1,  5000.00, 500.00),  -- flour in Lahore
(1, 2, 10000.00, 1000.00), -- water in Lahore
(1, 3,   200.00,  50.00),  -- ORS in Lahore
(1, 4,   800.00, 100.00),  -- paracetamol in Lahore
(1, 5,   150.00,  20.00),  -- tents in Lahore
(1, 6,   300.00,  50.00),  -- life jackets in Lahore
(2, 1,  8000.00, 800.00),  -- flour in Karachi
(2, 2, 20000.00, 2000.00), -- water in Karachi
(2, 5,   250.00,  30.00),  -- tents in Karachi
(2, 7,   500.00,  80.00),  -- first aid kits in Karachi
(2, 8,  3000.00, 300.00),  -- rice in Karachi
(3, 3,    30.00,  50.00),  -- ORS in Islamabad — BELOW THRESHOLD (triggers alert)
(3, 9,   600.00, 100.00),  -- blankets in Islamabad
(3, 10,   15.00,   5.00);  -- generators in Islamabad
GO

-- ResourceAllocations
INSERT INTO ResourceAllocations (report_id, resource_id, warehouse_id, qty_requested, qty_dispatched, qty_consumed, status, approved_by) VALUES
(1, 2, 1, 500.00,  500.00, 300.00, 'consumed',   2),   -- water to Lahore flood (consumed)
(1, 5, 1,  20.00,   20.00,  10.00, 'dispatched', 2),   -- tents to Lahore flood (dispatched)
(4, 7, 2,  50.00,   50.00,  50.00, 'consumed',   4),   -- first aid to Peshawar fire (consumed)
(6, 2, 2, 1000.00,   0.00,   0.00, 'approved',   4),   -- water to Hyderabad flood (approved, not dispatched)
(8, 5, 2,  30.00,    0.00,   0.00, 'pending',   NULL), -- tents for Karachi flood (pending approval)
(9, 4, 1, 100.00,    0.00,   0.00, 'pending',   NULL); -- paracetamol for Lahore quake (pending)
GO

-- ApprovalRequests
INSERT INTO ApprovalRequests (allocation_id, request_type, reference_id, status, requested_by, reviewed_by, reviewed_at, remarks) VALUES
(1, 'resource_allocation', 1, 'approved',  3, 2, DATEADD(HOUR, -5, GETDATE()), 'Urgent — approved immediately'),
(2, 'resource_allocation', 2, 'approved',  3, 2, DATEADD(HOUR, -5, GETDATE()), 'Approved for flood response'),
(3, 'resource_allocation', 3, 'approved',  8, 4, DATEADD(HOUR, -2, GETDATE()), 'Fire emergency — approved'),
(4, 'resource_allocation', 4, 'approved',  8, 4, DATEADD(HOUR, -1, GETDATE()), 'Flood relief approved'),
(5, 'resource_allocation', 5, 'pending',   3, NULL, NULL, NULL),
(6, 'resource_allocation', 6, 'pending',   8, NULL, NULL, NULL),
(NULL, 'financial', NULL, 'pending',  5, NULL, NULL, NULL),
(NULL, 'deployment', NULL, 'approved', 3, 1, DATEADD(HOUR, -3, GETDATE()), 'Deployment approved by admin');
GO

-- ============================================================
-- GROUP F: Financial Data
-- ============================================================
INSERT INTO Donations (received_by, donor_name, donor_type, amount, payment_method) VALUES
(5, 'Al-Khidmat Foundation',  'organization', 500000.00, 'bank_transfer'),
(5, 'Edhi Foundation',         'organization', 250000.00, 'bank_transfer'),
(5, 'Dr. Imran Farooq',        'individual',    50000.00, 'online'),
(5, 'Government of Punjab',    'government',  2000000.00, 'bank_transfer'),
(5, 'JDC Foundation',          'organization',  150000.00, 'cheque'),
(5, 'Saylani Welfare Trust',   'organization',  300000.00, 'bank_transfer'),
(5, 'Anonymous Donor',         'individual',     10000.00, 'cash'),
(5, 'Fauji Foundation',        'organization', 1000000.00, 'bank_transfer');
GO

INSERT INTO Expenses (recorded_by, allocation_id, category, amount, description, expense_date) VALUES
(5, 1, 'logistics',    25000.00, 'Truck rental for water distribution to Lahore', CAST(GETDATE() AS DATE)),
(5, 2, 'procurement',  80000.00, 'Emergency tent purchase for Lahore flood zone', CAST(GETDATE() AS DATE)),
(5, 3, 'medical',      15000.00, 'First aid supplies dispatch to Peshawar',       CAST(GETDATE() AS DATE)),
(5, NULL,'admin',      12000.00, 'Coordination office operational costs',          CAST(GETDATE() AS DATE)),
(5, NULL,'logistics',  45000.00, 'Helicopter fuel for aerial survey',              CAST(DATEADD(DAY,-1,GETDATE()) AS DATE)),
(5, 4, 'logistics',    35000.00, 'Water tanker hire for Hyderabad flood',          CAST(GETDATE() AS DATE));
GO

-- FinanceTransactions
INSERT INTO FinanceTransactions (performed_by, donation_id, expense_id, transaction_type, amount, status) VALUES
(5, 1, NULL, 'donation',     500000.00, 'completed'),
(5, 2, NULL, 'donation',     250000.00, 'completed'),
(5, 3, NULL, 'donation',      50000.00, 'completed'),
(5, 4, NULL, 'donation',    2000000.00, 'completed'),
(5, 5, NULL, 'donation',     150000.00, 'completed'),
(5, 6, NULL, 'donation',     300000.00, 'completed'),
(5, 7, NULL, 'donation',      10000.00, 'completed'),
(5, 8, NULL, 'donation',    1000000.00, 'completed'),
(5, NULL, 1, 'expense',       25000.00, 'completed'),
(5, NULL, 2, 'procurement',   80000.00, 'completed'),
(5, NULL, 3, 'expense',       15000.00, 'completed'),
(5, NULL, 4, 'expense',       12000.00, 'completed'),
(5, NULL, 5, 'expense',       45000.00, 'completed'),
(5, NULL, 6, 'expense',       35000.00, 'completed');
GO

-- ============================================================
-- GROUP G: Audit Log seed entries (login events)
-- ============================================================
INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, new_value, ip_address) VALUES
(1, 'LOGIN',  'Users', 1, N'{"username":"admin_sara"}',    '192.168.1.10'),
(2, 'LOGIN',  'Users', 2, N'{"username":"op_khalid"}',     '192.168.1.11'),
(3, 'LOGIN',  'Users', 3, N'{"username":"officer_aisha"}', '192.168.1.12'),
(4, 'LOGIN',  'Users', 4, N'{"username":"wm_hassan"}',     '192.168.1.13'),
(5, 'LOGIN',  'Users', 5, N'{"username":"finance_nadia"}', '192.168.1.14');
GO

-- Notifications seed
INSERT INTO Notifications (user_id, message, notification_type, is_read) VALUES
(2, N'New critical flood report received from Lahore, Gulberg III', 'alert',      0),
(2, N'Team Alpha Medical Unit assigned to report #1',               'assignment', 1),
(3, N'Resource allocation #5 awaiting your approval',               'approval',   0),
(4, N'Inventory alert: ORS Sachets in Islamabad Emergency Store below threshold', 'alert', 0),
(5, N'New approval request for financial transaction pending review','approval',   0);
GO

PRINT 'Seed data inserted successfully.';
PRINT 'Default password for all users: Password123!';
GO
