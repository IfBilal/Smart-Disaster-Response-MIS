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
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">DisasterMIS</span>
        <div className="hidden md:flex gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-200">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-blue-200">{roleLabel[role] || role}</span>
        <span className="font-medium">{username}</span>
        <button
          onClick={handleLogout}
          className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
