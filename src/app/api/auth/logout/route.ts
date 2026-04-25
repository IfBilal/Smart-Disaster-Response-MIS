import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/auth'
import { getPool, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req)

  if (user) {
    try {
      const pool = await getPool()
      await pool.request()
        .input('user_id', sql.Int, user.user_id)
        .query(`INSERT INTO AuditLog (user_id, action_type, table_affected, record_id)
                VALUES (@user_id, 'LOGOUT', 'Users', @user_id)`)
    } catch (err) {
      console.error(err)
    }
  }

  const res = NextResponse.json({ message: 'Logged out' })
  res.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
  return res
}
