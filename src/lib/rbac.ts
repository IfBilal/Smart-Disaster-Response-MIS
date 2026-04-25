import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, TokenPayload } from './auth'

export type Role = 'admin' | 'emergency_operator' | 'field_officer' | 'warehouse_manager' | 'finance_officer'

export function checkAuth(req: NextRequest): TokenPayload | null {
  return getTokenFromRequest(req)
}

export function requireRoles(req: NextRequest, allowed: Role[]): NextResponse | TokenPayload {
  const user = getTokenFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!allowed.includes(user.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return user
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}
