import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const pool = await getPool()
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT user_id, username, role, password_hash, is_active FROM Users WHERE username = @username')

    const user = result.recordset[0]

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!comparePassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({ user_id: user.user_id, username: user.username, role: user.role })

    // Log login to AuditLog
    await pool.request()
      .input('user_id', sql.Int, user.user_id)
      .input('ip', sql.NVarChar, req.headers.get('x-forwarded-for') || '127.0.0.1')
      .query(`INSERT INTO AuditLog (user_id, action_type, table_affected, record_id, ip_address)
              VALUES (@user_id, 'LOGIN', 'Users', @user_id, @ip)`)

    const res = NextResponse.json({ user_id: user.user_id, username: user.username, role: user.role })
    res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 8, path: '/' })
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
