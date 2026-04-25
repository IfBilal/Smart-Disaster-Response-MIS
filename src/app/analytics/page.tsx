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

  const financialPie = financial ? [
    { name: 'Total Donations', value: financial.summary.total_donations },
    { name: 'Total Expenses', value: financial.summary.total_expenses },
  ] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar username={user.username} role={user.role} />
        <div className="p-6 text-center text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">MIS Analytics Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Incidents by Disaster Type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidents?.byType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="disaster_type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Incidents by Severity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={incidents?.bySeverity || []} dataKey="count" nameKey="severity_level" cx="50%" cy="50%" outerRadius={80} label={({ severity_level, count }) => `${severity_level}: ${count}`} labelLine={false}>
                  {(incidents?.bySeverity || []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Daily Reports (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={incidents?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Resource Utilization</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resources.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="resource_name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="total_requested" fill="#93c5fd" name="Requested" />
                <Bar dataKey="total_dispatched" fill="#3b82f6" name="Dispatched" />
                <Bar dataKey="total_consumed" fill="#1d4ed8" name="Consumed" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Financial Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={financialPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Legend />
                <Tooltip formatter={(value) => `PKR ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 text-center text-sm">
              <span className="text-green-600 font-medium">Net Balance: </span>
              <span className="font-bold">PKR {financial?.summary.net_balance?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Average Response Time by Disaster Type (minutes)</h3>
          {responseTimes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={responseTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="disaster_type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${v} min`} />
                <Bar dataKey="avg_response_minutes" fill="#8b5cf6" name="Avg Response (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No resolved incidents yet</p>
          )}
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="p-4 border-b font-semibold text-gray-700">Response Time Details</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Disaster Type</th>
                <th className="px-4 py-3 text-left text-gray-600">Resolved Count</th>
                <th className="px-4 py-3 text-left text-gray-600">Avg (min)</th>
                <th className="px-4 py-3 text-left text-gray-600">Min (min)</th>
                <th className="px-4 py-3 text-left text-gray-600">Max (min)</th>
              </tr>
            </thead>
            <tbody>
              {responseTimes.map(r => (
                <tr key={r.disaster_type} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 capitalize">{r.disaster_type}</td>
                  <td className="px-4 py-3">{r.resolved_count}</td>
                  <td className="px-4 py-3">{Math.round(r.avg_response_minutes)}</td>
                  <td className="px-4 py-3">{r.min_minutes}</td>
                  <td className="px-4 py-3">{r.max_minutes}</td>
                </tr>
              ))}
              {responseTimes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
