import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const disaster_type = searchParams.get('disaster_type')
  const location = searchParams.get('location')

  let where = 'WHERE 1=1'
  if (status) where += ` AND r.status = '${status}'`
  if (severity) where += ` AND r.severity_level = '${severity}'`
  if (disaster_type) where += ` AND r.disaster_type = '${disaster_type}'`
  if (location) where += ` AND r.location LIKE '%${location}%'`

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT TOP 100
        r.report_id, r.disaster_type, r.severity_level, r.location,
        r.latitude, r.longitude, r.status, r.reported_at, r.resolved_at,
        c.full_name AS citizen_name, c.phone AS citizen_phone,
        u.username AS assigned_operator
      FROM EmergencyReports r
      JOIN Citizens c ON c.citizen_id = r.citizen_id
      LEFT JOIN Users u ON u.user_id = r.operator_id
      ${where}
      ORDER BY
        CASE r.severity_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        r.reported_at ASC
    `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, cnic, phone, address, disaster_type, severity_level, location, latitude, longitude } = body

    const pool = await getPool()

    // Insert citizen first
    const citizenResult = await pool.request()
      .input('full_name', sql.NVarChar, full_name)
      .input('cnic', sql.NChar, cnic || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .query(`INSERT INTO Citizens (full_name, cnic, phone, address)
              VALUES (@full_name, @cnic, @phone, @address);
              SELECT SCOPE_IDENTITY() AS citizen_id`)

    const citizen_id = citizenResult.recordset[0].citizen_id

    // Insert report
    const reportResult = await pool.request()
      .input('citizen_id', sql.Int, citizen_id)
      .input('disaster_type', sql.NVarChar, disaster_type)
      .input('severity_level', sql.NVarChar, severity_level)
      .input('location', sql.NVarChar, location)
      .input('latitude', sql.Decimal(10, 7), latitude || null)
      .input('longitude', sql.Decimal(10, 7), longitude || null)
      .query(`INSERT INTO EmergencyReports (citizen_id, disaster_type, severity_level, location, latitude, longitude)
              VALUES (@citizen_id, @disaster_type, @severity_level, @location, @latitude, @longitude);
              SELECT SCOPE_IDENTITY() AS report_id`)

    const report_id = reportResult.recordset[0].report_id
    return NextResponse.json({ report_id, citizen_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
