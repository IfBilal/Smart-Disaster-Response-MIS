import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export interface TokenPayload {
  user_id: number
  username: string
  role: string
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}
