'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const roleLabel: Record<string, string> = {
  admin:              'Administrator',
  emergency_operator: 'Emergency Operator',
  field_officer:      'Field Officer',
  warehouse_manager:  'Warehouse Manager',
  finance_officer:    'Finance Officer',
}

const roleLinks: Record<string, { label: string; href: string; icon: string }[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin',   icon: 'grid'    },
    { label: 'Reports',   href: '/reports',            icon: 'file'    },
    { label: 'Teams',     href: '/teams',              icon: 'users'   },
    { label: 'Resources', href: '/resources',          icon: 'box'     },
    { label: 'Hospitals', href: '/hospitals',          icon: 'cross'   },
    { label: 'Financial', href: '/financial',          icon: 'dollar'  },
    { label: 'Approvals', href: '/approvals',          icon: 'check'   },
    { label: 'Analytics', href: '/analytics',          icon: 'chart'   },
    { label: 'Citizens',       href: '/citizens',            icon: 'person' },
    { label: 'Audit Log',      href: '/audit',              icon: 'shield' },
    { label: 'Notifications',  href: '/notifications',       icon: 'bell'   },
  ],
  emergency_operator: [
    { label: 'Dashboard',     href: '/dashboard/operator', icon: 'grid'   },
    { label: 'Reports',       href: '/reports',             icon: 'file'   },
    { label: 'Teams',         href: '/teams',               icon: 'users'  },
    { label: 'Hospitals',     href: '/hospitals',           icon: 'cross'  },
    { label: 'Approvals',     href: '/approvals',           icon: 'check'  },
    { label: 'Analytics',     href: '/analytics',           icon: 'chart'  },
    { label: 'Citizens',      href: '/citizens',            icon: 'person' },
    { label: 'Notifications', href: '/notifications',       icon: 'bell'   },
  ],
  field_officer: [
    { label: 'Dashboard',     href: '/dashboard/field-officer', icon: 'grid'  },
    { label: 'Reports',       href: '/reports',                 icon: 'file'  },
    { label: 'Hospitals',     href: '/hospitals',               icon: 'cross' },
    { label: 'Resources',     href: '/resources',               icon: 'box'   },
    { label: 'Approvals',     href: '/approvals',               icon: 'check' },
    { label: 'Notifications', href: '/notifications',           icon: 'bell'  },
  ],
  warehouse_manager: [
    { label: 'Dashboard',     href: '/dashboard/warehouse', icon: 'grid'  },
    { label: 'Resources',     href: '/resources',           icon: 'box'   },
    { label: 'Approvals',     href: '/approvals',           icon: 'check' },
    { label: 'Notifications', href: '/notifications',       icon: 'bell'  },
  ],
  finance_officer: [
    { label: 'Dashboard',     href: '/dashboard/finance', icon: 'grid'   },
    { label: 'Financial',     href: '/financial',          icon: 'dollar' },
    { label: 'Approvals',     href: '/approvals',          icon: 'check'  },
    { label: 'Analytics',     href: '/analytics',          icon: 'chart'  },
    { label: 'Notifications', href: '/notifications',      icon: 'bell'   },
  ],
}

function Icon({ name }: { name: string }) {
  const s = { width: 15, height: 15 }
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  if (name === 'grid') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
  if (name === 'file') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
  if (name === 'users') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
  if (name === 'box') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
  if (name === 'cross') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
    </svg>
  )
  if (name === 'dollar') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
  if (name === 'check') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
  if (name === 'chart') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
  if (name === 'shield') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
  if (name === 'bell') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
  if (name === 'person') return (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
  return null
}

export default function Navbar({ username, role }: { username: string; role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const links = roleLinks[role] || []

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      width: '220px', height: '100vh',
      backgroundColor: '#050c18',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
          }}>🚨</div>
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '14px', margin: 0, letterSpacing: '-0.01em' }}>DisasterMIS</p>
            <p style={{ color: '#ef4444', fontSize: '10px', margin: 0, fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Emergency Response</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {links.map(link => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'))
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '8px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none',
                color: isActive ? '#e2e8f0' : '#64748b',
                backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                fontSize: '13px', fontWeight: isActive ? '600' : '400',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLElement).style.color = '#94a3b8'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = '#64748b'
                }
              }}
            >
              <Icon name={link.icon} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username || '—'}</p>
          <p style={{ color: '#475569', fontSize: '11px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roleLabel[role] || role}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px', borderRadius: '7px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '12px', fontWeight: '600',
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
