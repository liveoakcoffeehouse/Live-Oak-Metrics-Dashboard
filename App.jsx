import React, { useEffect, useState } from 'react'
import { Coffee, LogOut, UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { parseSalesSummary, parseLaborReport, parseTaskSubmissions } from './lib/csv.js'
import { loadShopData, saveShopFile } from './lib/storage.js'
import { SHOPS, findShopByUsername } from './lib/shops.js'

// Each upload slot's key must match how it's stored (lib/storage.js) and
// looked up (App below). `parse` takes (file, shop) and returns the
// summarized result described in lib/csv.js.
const FILE_TYPES = [
  {
    key: 'sales',
    label: 'Sales Summary',
    hint: 'Square weekly sales export',
    parse: (file) => parseSalesSummary(file),
  },
  {
    key: 'labor',
    label: 'Schedule vs. Timesheet vs. Sales',
    hint: 'weekly labor hours export',
    parse: (file, shop) => parseLaborReport(file, shop.laborCode),
  },
  {
    key: 'tasks',
    label: 'Task Submissions',
    hint: 'checklist completion export',
    parse: (file, shop) => parseTaskSubmissions(file, shop.label),
  },
]

// ---- Login gate -------------------------------------------------------------
// NOTE: this is a UI convenience gate, not real authentication. Since this
// app is a static bundle served from GitHub Pages, anything in the source
// (including the credentials in lib/shops.js) is visible to anyone who opens
// dev tools. Don't rely on this to protect sensitive data — see README.
function LoginGate({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const shop = findShopByUsername(username)
    if (shop && password === shop.password) {
      onLogin(shop)
    } else {
      setError('Invalid credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-espresso-100">
        <div className="flex items-center gap-2 mb-6">
          <Coffee className="text-espresso-600" size={26} />
          <h2 className="text-2xl font-display font-semibold text-espresso-900">Shop Portal</h2>
        </div>
        <label className="block text-xs font-medium text-espresso-600 mb-1">Username</label>
        <input
          type="text"
          placeholder="e.g. midtown_manager"
          className="w-full p-2.5 mb-4 border border-espresso-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-espresso-400"
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="block text-xs font-medium text-espresso-600 mb-1">Password</label>
        <input
          type="password"
          className="w-full p-2.5 mb-2 border border-espresso-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-espresso-400"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
        <button className="w-full bg-espresso-700 text-white p-2.5 rounded-lg hover:bg-espresso-800 transition-colors font-medium mt-2">
          Sign in
        </button>
      </form>
    </div>
  )
}

// ---- Upload card ------------------------------------------------------------
function UploadCard({ fileType, status, onUpload }) {
  const inputId = `upload-${fileType.key}`

  const statusBadge = () => {
    if (!status) return null
    if (status.state === 'processing')
      return (
        <span className="text-[11px] text-espresso-500 font-medium flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> Processing…
        </span>
      )
    if (status.state === 'error')
      return (
        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
          <AlertTriangle size={12} /> {status.message || 'Could not parse file'}
        </span>
      )
    if (status.state === 'done')
      return (
        <span className="text-[11px] text-green-700 font-medium flex items-center gap-1">
          <CheckCircle2 size={12} /> Updated {new Date(status.updatedAt).toLocaleTimeString()}
        </span>
      )
    return null
  }

  return (
    <div className="border border-espresso-100 p-4 rounded-xl bg-white flex flex-col gap-2">
      <p className="text-sm font-semibold text-espresso-900">{fileType.label}</p>
      <p className="text-xs text-espresso-500">{fileType.hint}</p>
      <label
        htmlFor={inputId}
        className="mt-1 cursor-pointer text-xs border border-dashed border-espresso-300 rounded-lg py-3 flex flex-col items-center gap-1 text-espresso-500 hover:bg-espresso-50 transition-colors"
      >
        <UploadCloud size={16} />
        Drop CSV or click to browse
      </label>
      <input
        id={inputId}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(fileType, file)
          e.target.value = ''
        }}
      />
      <div className="h-4">{statusBadge()}</div>
      {status?.warnings?.length > 0 && (
        <ul className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
          {status.warnings.map((w, i) => (
            <li key={i} className="flex gap-1">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Metrics ------------------------------------------------------------
function fmtCurrency(n) {
  if (n === null || n === undefined) return '—'
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
function fmtPct(n, digits = 1) {
  if (n === null || n === undefined) return '—'
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`
}
function fmtHours(n) {
  if (n === null || n === undefined) return '—'
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs`
}

function MetricCard({ label, value, sub, tone }) {
  const toneClass = tone === 'good' ? 'text-green-600' : tone === 'bad' ? 'text-red-500' : 'text-espresso-900'
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-espresso-100">
      <p className="text-xs uppercase tracking-wide text-espresso-500 mb-2">{label}</p>
      <p className={`text-3xl font-display font-semibold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-espresso-400 mt-2">{sub}</p>}
    </div>
  )
}

// ---- Main app -----------------------------------------------------------------
export default function App() {
  const [shop, setShop] = useState(null)
  const [uploadStatus, setUploadStatus] = useState({})
  const [data, setData] = useState({}) // { sales: {...}, labor: {...}, tasks: {...} }

  useEffect(() => {
    if (!shop) return
    const stored = loadShopData(shop.key)
    const initialData = {}
    const initialStatus = {}
    for (const key of Object.keys(stored)) {
      initialData[key] = stored[key].value
      initialStatus[key] = { state: 'done', updatedAt: stored[key].updatedAt, warnings: stored[key].value?.warnings || [] }
    }
    setData(initialData)
    setUploadStatus(initialStatus)
  }, [shop])

  const handleUpload = async (fileType, file) => {
    setUploadStatus((prev) => ({ ...prev, [fileType.key]: { state: 'processing' } }))
    try {
      const result = await fileType.parse(file, shop)
      setData((prev) => ({ ...prev, [fileType.key]: result }))
      saveShopFile(shop.key, fileType.key, result)
      setUploadStatus((prev) => ({
        ...prev,
        [fileType.key]: { state: 'done', updatedAt: new Date().toISOString(), warnings: result.warnings || [] },
      }))
    } catch (err) {
      console.error(err)
      setUploadStatus((prev) => ({ ...prev, [fileType.key]: { state: 'error', message: 'Could not parse file' } }))
    }
  }

  if (!shop) {
    return <LoginGate onLogin={setShop} />
  }

  const sales = data.sales
  const labor = data.labor
  const tasks = data.tasks

  const laborDeviationPct =
    labor?.actualHours != null ? ((labor.actualHours - shop.laborTargetHours) / shop.laborTargetHours) * 100 : null

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b border-espresso-100">
        <h1 className="text-xl font-display font-semibold flex items-center gap-2 text-espresso-900">
          <Coffee size={22} className="text-espresso-600" /> {shop.label} Dashboard
        </h1>
        <button
          onClick={() => setShop(null)}
          className="text-sm text-espresso-500 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </nav>

      <main className="p-6 max-w-6xl mx-auto space-y-8">
        <section className="bg-white/60 p-6 rounded-2xl border border-espresso-100">
          <h2 className="text-lg font-display font-semibold mb-1 text-espresso-900 flex items-center gap-2">
            <UploadCloud size={18} /> Data Upload Center
          </h2>
          <p className="text-xs text-espresso-500 mb-4">
            Everything uploaded here is tagged as {shop.label}'s data automatically.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FILE_TYPES.map((ft) => (
              <UploadCard key={ft.key} fileType={ft} status={uploadStatus[ft.key]} onUpload={handleUpload} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-display font-semibold mb-4 text-espresso-900">This Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Net sales"
              value={fmtCurrency(sales?.netSales)}
              sub={sales?.dateRangeLabel || 'Upload the sales summary export'}
            />
            <MetricCard
              label="Labor deviation"
              value={fmtPct(laborDeviationPct)}
              tone={laborDeviationPct === null ? 'neutral' : Math.abs(laborDeviationPct) <= 5 ? 'good' : 'bad'}
              sub={
                labor?.actualHours != null
                  ? `${fmtHours(labor.actualHours)} actual vs. ${fmtHours(shop.laborTargetHours)} target`
                  : 'Upload the labor export'
              }
            />
            <MetricCard
              label="Task completion"
              value={fmtPct(tasks?.avgCompletionPct, 0)}
              tone={tasks?.avgCompletionPct == null ? 'neutral' : tasks.avgCompletionPct >= 95 ? 'good' : 'bad'}
              sub={tasks ? `${tasks.submissionCount} submissions, ${tasks.lowCompletionCount} under 90%` : 'Upload task submissions'}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
