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

    // Auto-assign: pick hospital with the most available beds
    let resolvedHospitalId: number | null = hospital_id ? parseInt(hospital_id) : null
    if (!resolvedHospitalId) {
      const best = await pool.request().query(`
        SELECT TOP 1 hospital_id FROM Hospitals
        WHERE is_active = 1 AND available_beds > 0
        ORDER BY available_beds DESC
      `)
      if (best.recordset.length === 0) {
        return NextResponse.json({ error: 'No hospitals have available beds.' }, { status: 409 })
      }
      resolvedHospitalId = best.recordset[0].hospital_id
    }

    // Transaction E: admit patient — trigger decrements beds
    const result = await pool.request()
      .input('report_id', sql.Int, report_id)
      .input('hospital_id', sql.Int, resolvedHospitalId)
      .input('officer_id', sql.Int, user.user_id)
      .input('condition', sql.NVarChar, condition)
      .query(`
        INSERT INTO Patients (report_id, hospital_id, field_officer_id, admission_time, condition)
        VALUES (@report_id, @hospital_id, @officer_id, GETDATE(), @condition);
        SELECT SCOPE_IDENTITY() AS patient_id;
      `)

    return NextResponse.json({ patient_id: result.recordset[0].patient_id }, { status: 201 })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
