import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

// Maps disaster type → preferred team type order
const priority: Record<string, string[]> = {
  fire:       ['fire',    'rescue',  'medical'],
  flood:      ['rescue',  'medical', 'fire'],
  earthquake: ['rescue',  'medical', 'fire'],
  other:      ['medical', 'rescue',  'fire'],
}

// Maps severity → minimum required teams to suggest
const minTeams: Record<string, number> = {
  critical: 3,
  high:     2,
  medium:   1,
  low:      1,
}

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const disaster_type  = searchParams.get('disaster_type') || 'other'
  const severity_level = searchParams.get('severity_level') || 'low'
  const report_id      = searchParams.get('report_id')

  try {
    const pool = await getPool()

    // Get all available teams with member count
    const req2 = pool.request()
    let excludeClause = ''
    if (report_id) {
      excludeClause = `AND t.team_id NOT IN (
        SELECT team_id FROM TeamAssignments
        WHERE report_id = @report_id AND status NOT IN ('cancelled','completed')
      )`
      req2.input('report_id', sql.Int, parseInt(report_id))
    }

    const result = await req2.query(`
      SELECT t.team_id, t.team_name, t.team_type, t.current_location,
             t.availability_status, t.capacity,
             COUNT(tm.member_id) AS members
      FROM RescueTeams t
      LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
      WHERE t.availability_status = 'available'
      ${excludeClause}
      GROUP BY t.team_id, t.team_name, t.team_type, t.current_location,
               t.availability_status, t.capacity
    `)

    const teams = result.recordset

    // Score each team: lower score = better match
    const order = priority[disaster_type] || priority.other
    const scored = teams.map(t => ({
      ...t,
      priority_rank: order.indexOf(t.team_type) === -1 ? 99 : order.indexOf(t.team_type),
      recommended: order[0] === t.team_type,
    }))

    // Sort by priority rank, then by member count desc
    scored.sort((a, b) => a.priority_rank - b.priority_rank || b.members - a.members)

    return NextResponse.json({
      teams: scored,
      suggested_count: minTeams[severity_level] || 1,
      preferred_type: order[0],
      disaster_type,
      severity_level,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
