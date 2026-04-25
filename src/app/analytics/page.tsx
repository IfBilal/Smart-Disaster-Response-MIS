'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'

interface IncidentData {
  byType: { disaster_type: string; count: number }[]
  bySeverity: { severity_level: string; count: number }[]
  daily: { day: string; count: number }[]
}

interface ResourceData {
  resource_name: string
  resource_type: string
  total_requested: number
  total_dispatched: number
  total_consumed: number
}

interface FinancialData {
  summary: {
    total_donations: number
    total_expenses: number
    net_balance: number
  }
  byDonorType: { donor_type: string; total: number }[]
  byCategory: { category: string; total: number }[]
}

interface ResponseTimeData {
  disaster_type: string
  resolved_count: number
  avg_response_minutes: number
  min_minutes: number
  max_minutes: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<IncidentData | null>(null)
  const [resources, setResources] = useState<ResourceData[]>([])
  const [financial, setFinancial] = useState<FinancialData | null>(null)
  const [responseTimes, setResponseTimes] = useState<ResponseTimeData[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    Promise.all([
      fetch('/api/analytics/incidents').then(r => r.json()),
      fetch('/api/analytics/resources').then(r => r.json()),
      fetch('/api/analytics/financial').then(r => r.json()),
      fetch('/api/analytics/response-time').then(r => r.json()),
    ]).then(([inc, res, fin, rt]) => {
      setIncidents(inc)
      if (Array.isArray(res)) setResources(res)
      setFinancial(fin)
      if (Array.isArray(rt)) setResponseTimes(rt)
      setLoading(false)
    })
  }, [])

  const financialPie = financial?.summary ? [
    { name: 'Total Donations', value: financial.summary.total_donations },
    { name: 'Total Expenses', value: financial.summary.total_expenses },
  ] : []

  const chartCardStyle: React.CSSProperties = {
    background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px',
  }

  const chartTitleStyle: React.CSSProperties = {
    color: '#cbd5e1', fontSize: '13px', fontWeight: '600', margin: '0 0 16px',
  }

  const axisStyle = { fontSize: 11, fill: '#475569' }
  const tooltipStyle = { backgroundColor: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#cbd5e1', fontSize: '12px' }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600',
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
        <Navbar username={user.username} role={user.role} />
        <main style={{ marginLeft: '220px', flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#475569', fontSize: '14px' }}>Loading analytics...</p>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            MIS Analytics Dashboard
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Incident trends, resource utilization, and financial overview
          </p>
        </div>

        {/* Row 1: two charts */}
        <div className="enter-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={chartCardStyle}>
            <p style={chartTitleStyle}>Incidents by Disaster Type</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidents?.byType || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="disaster_type" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <p style={chartTitleStyle}>Incidents by Severity</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={incidents?.bySeverity || []} dataKey="count" nameKey="severity_level" cx="50%" cy="50%" outerRadius={80} label labelLine={false}>
                  {(incidents?.bySeverity || []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: line chart */}
        <div className="enter-2" style={{ ...chartCardStyle, marginBottom: '16px' }}>
          <p style={chartTitleStyle}>Daily Reports (Last 30 Days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={incidents?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Row 3: resource + financial */}
        <div className="enter-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={chartCardStyle}>
            <p style={chartTitleStyle}>Resource Utilization</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resources.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis dataKey="resource_name" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total_requested" fill="#93c5fd" name="Requested" />
                <Bar dataKey="total_dispatched" fill="#3b82f6" name="Dispatched" />
                <Bar dataKey="total_consumed" fill="#1d4ed8" name="Consumed" />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <p style={chartTitleStyle}>Financial Overview</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={financialPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `PKR ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#34d399', fontWeight: '500' }}>Net Balance: </span>
              <span style={{ color: '#f1f5f9', fontWeight: '700' }}>PKR {financial?.summary?.net_balance?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Row 4: response time bar chart */}
        <div className="enter-4" style={{ ...chartCardStyle, marginBottom: '16px' }}>
          <p style={chartTitleStyle}>Average Response Time by Disaster Type (minutes)</p>
          {responseTimes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={responseTimes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="disaster_type" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} min`} />
                <Bar dataKey="avg_response_minutes" fill="#8b5cf6" name="Avg Response (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No resolved incidents yet</p>
          )}
        </div>

        {/* Response time details table */}
        <div className="enter-5" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Response Time Details</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Disaster Type', 'Resolved Count', 'Avg (min)', 'Min (min)', 'Max (min)'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responseTimes.map(r => (
                <tr key={r.disaster_type}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ ...tdStyle, textTransform: 'capitalize', color: '#f1f5f9' }}>{r.disaster_type}</td>
                  <td style={tdStyle}>{r.resolved_count}</td>
                  <td style={tdStyle}>{Math.round(r.avg_response_minutes)}</td>
                  <td style={tdStyle}>{r.min_minutes}</td>
                  <td style={tdStyle}>{r.max_minutes}</td>
                </tr>
              ))}
              {responseTimes.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
