import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AlertTriangle, LogOut, RefreshCw, ShieldAlert } from 'lucide-react'
import { Button, ErrorState, Spinner } from './components/ui'
import { COLLECTIONS } from './admin/fieldRegistry'
import { useAuth } from './store/auth'
import { trackPageview } from './lib/analytics'
import { DesktopEnvironment } from './desktop/DesktopEnvironment'
import Login from './pages/Login'

const AdminLayout = lazy(() =>
  import('./admin/AdminLayout').then((module) => ({ default: module.AdminLayout }))
)
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const CollectionPage = lazy(() => import('./admin/CollectionPage'))
const GithubCenter = lazy(() => import('./admin/GithubCenter'))
const SettingsPage = lazy(() => import('./admin/SettingsPage'))
const AiSettings = lazy(() => import('./admin/AiSettings'))
const AnalyticsPage = lazy(() => import('./admin/AnalyticsPage'))
const UsersPage = lazy(() => import('./admin/UsersPage'))
const BackupPage = lazy(() => import('./admin/BackupPage'))
const NotificationsPage = lazy(() => import('./admin/NotificationsPage'))

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Keep the failure visible in the console for debugging.
    console.error('Application error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 text-fg">
          <div className="glass w-full max-w-lg rounded-2xl p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <h1 className="mt-3 font-display text-xl font-semibold">Something broke</h1>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              The interface hit an unexpected error. Your data is safe — reloading usually fixes this.
            </p>
            <pre className="mt-3 max-h-28 overflow-auto rounded-lg border border-[var(--stroke)] bg-black/30 p-2.5 text-left font-mono text-[10px] text-rose-200">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => window.location.reload()} icon={<RefreshCw className="h-4 w-4" />}>
                Reload
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  this.setState({ error: null })
                  window.location.assign('/')
                }}
              >
                Back to desktop
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function RouteFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Spinner /> Loading…
      </div>
    </div>
  )
}

function AuthLoading() {
  const logout = useAuth((state) => state.logout)
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <h1 className="mt-2.5 font-display text-base font-semibold text-fg">Verifying session</h1>
        <p className="mt-1 text-[11.5px] text-muted">Checking your administrator credentials…</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[var(--fg-faint)]">
          <Spinner /> Secure handshake
        </div>
        <button
          onClick={() => logout()}
          className="mt-4 inline-flex items-center gap-1 text-[10.5px] text-muted hover:text-fg"
        >
          <LogOut className="h-3 w-3" /> Sign out instead
        </button>
      </div>
    </div>
  )
}

function RequireAuth() {
  const token = useAuth((state) => state.token)
  const admin = useAuth((state) => state.admin)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (!admin) return <AuthLoading />
  return <Outlet />
}

function CollectionRoute() {
  const { collection = '' } = useParams()
  const config = COLLECTIONS[collection]
  if (!config) {
    return <ErrorState message={`Unknown admin module "${collection}".`} />
  }
  return <CollectionPage collection={collection} />
}

/** Public pageviews are tracked, standalone areas (admin, login) are not. */
function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/admin') || path === '/login') return
    const timer = window.setTimeout(() => trackPageview(path), 400)
    return () => window.clearTimeout(timer)
  }, [location.pathname])

  return null
}

export default function App() {
  const token = useAuth((state) => state.token)
  const bootstrap = useAuth((state) => state.bootstrap)

  useEffect(() => {
    if (token) void bootstrap()
    // Only validate on first mount; later token changes are handled by the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteEffects />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Standalone areas keep their full-screen layouts. */}
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="analytics-events" element={<CollectionPage collection="analytics" />} />
                <Route path="github" element={<GithubCenter />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="ai" element={<AiSettings />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="backup" element={<BackupPage />} />
                <Route path=":collection" element={<CollectionRoute />} />
              </Route>
            </Route>

            {/* Everything else is the desktop. URL changes open the matching app. */}
            <Route path="*" element={<DesktopEnvironment />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
