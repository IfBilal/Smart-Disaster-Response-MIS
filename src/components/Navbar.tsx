'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavbarProps {
  username: string
  role: string
}

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  emergency_operator: 'Emergency Operator',
  field_officer: 'Field Officer',
  warehouse_manager: 'Warehouse Manager',
  finance_officer: 'Finance Officer',
}

const roleLinks: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Reports', href: '/reports' },
    { label: 'Teams', href: '/teams' },
    { label: 'Resources', href: '/resources' },
    { label: 'Hospitals', href: '/hospitals' },
    { label: 'Financial', href: '/financial' },
    { label: 'Approvals', href: '/approvals' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Audit Log', href: '/audit' },
  ],
  emergency_operator: [
    { label: 'Dashboard', href: '/dashboard/operator' },
    { label: 'Reports', href: '/reports' },
    { label: 'Teams', href: '/teams' },
    { label: 'Hospitals', href: '/hospitals' },
    { label: 'Approvals', href: '/approvals' },
    { label: 'Analytics', href: '/analytics' },
  ],
  field_officer: [
    { label: 'Dashboard', href: '/dashboard/field-officer' },
    { label: 'Reports', href: '/reports' },
    { label: 'Hospitals', href: '/hospitals' },
    { label: 'Resources', href: '/resources' },
    { label: 'Approvals', href: '/approvals' },
  ],
  warehouse_manager: [
    { label: 'Dashboard', href: '/dashboard/warehouse' },
    { label: 'Resources', href: '/resources' },
    { label: 'Approvals', href: '/approvals' },
  ],
  finance_officer: [
    { label: 'Dashboard', href: '/dashboard/finance' },
    { label: 'Financial', href: '/financial' },
    { label: 'Approvals', href: '/approvals' },
    { label: 'Analytics', href: '/analytics' },
  ],
}

export default function Navbar({ username, role }: NavbarProps) {
  const router = useRouter()
  const links = roleLinks[role] || []

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav style={{ backgroundColor: '#1e3a5f', color: '#ffffff' }} className="px-6 py-0 shadow-md">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <span className="font-bold text-lg py-4 mr-8 text-white">
            🚨 DisasterMIS
          </span>
          <div className="hidden md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-4 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-blue-300">{roleLabel[role] || role}</p>
            <p className="text-sm font-semibold text-white">{username}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#c0392b', color: '#ffffff' }}
            className="px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
