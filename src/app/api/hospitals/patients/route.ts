import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT p.*, h.name AS hospital_name, er.disaster_type, er.location AS incident_location,
             u.username AS field_officer
      FROM Patients p
      LEFT JOIN Hospitals h ON h.hospital_id = p.hospital_id
      JOIN EmergencyReports er ON er.report_id = p.report_id
      LEFT JOIN Users u ON u.user_id = p.field_officer_id
      ORDER BY p.admission_time DESC
    `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'field_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { report_id, hospital_id, condition } = await req.json()

  if (!report_id || !condition) {
    return NextResponse.json({ error: 'report_id and condition are required' }, { status: 400 })
  }

  const validConditions = ['stable', 'serious', 'critical']
  if (!validConditions.includes(condition)) {
    return NextResponse.json({ error: 'Invalid condition' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // Transaction E: UPDLOCK on Hospitals and INSERT in the same transaction block.
    // The lock is held from the SELECT until COMMIT — two concurrent admissions
    // cannot both read available_beds > 0 for the same hospital simultaneously.
    //
    // If hospital_id is provided, lock that specific hospital.
    // If not, auto-assign: SELECT TOP 1 WITH UPDLOCK picks the best hospital and
    // locks it atomically, so another concurrent admission cannot grab the same slot.
    const result = await pool.request()
      .input('report_id', sql.Int, report_id)
      .input('hospital_id', sql.Int, hospital_id ? parseInt(hospital_id) : null)
      .input('officer_id', sql.Int, user.user_id)
      .input('condition', sql.NVarChar, condition)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION

            DECLARE @hid INT = @hospital_id;

            IF @hid IS NULL
            BEGIN
              -- Auto-assign: UPDLOCK on the chosen hospital row prevents another
              -- concurrent admission from also picking and locking the same hospital.
              SELECT TOP 1 @hid = hospital_id
              FROM Hospitals WITH (UPDLOCK)
              WHERE is_active = 1 AND available_beds > 0
              ORDER BY available_beds DESC;
            END
            ELSE
            BEGIN
              -- Manual assign: UPDLOCK on the specified hospital row.
              SELECT @hid = hospital_id
              FROM Hospitals WITH (UPDLOCK)
              WHERE hospital_id = @hid AND available_beds > 0 AND is_active = 1;
            END

            IF @hid IS NULL
            BEGIN
              ROLLBACK TRANSACTION;
              RAISERROR('No hospital available with open beds.', 16, 1);
              RETURN;
            END

            -- trg_Patient_Admission fires: decrements available_beds.
            -- If beds go negative the trigger rolls back and raises an error.
            INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition)
            VALUES (@report_id, @hid, @officer_id, GETDATE(), @condition);

            SELECT SCOPE_IDENTITY() AS patient_id, @hid AS hospital_id;

          COMMIT TRANSACTION
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `)

    return NextResponse.json({
      patient_id: result.recordset[0].patient_id,
      hospital_id: result.recordset[0].hospital_id
    }, { status: 201 })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
