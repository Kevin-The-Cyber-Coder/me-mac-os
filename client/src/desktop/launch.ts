import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APPS, type AppId } from './apps'
import { useOS } from '../store/os'

export const PATH_TO_APP: Record<string, AppId> = {
  '/': 'finder',
  '/welcome': 'welcome',
  '/about': 'about',
  '/projects': 'projects',
  '/skills': 'skills',
  '/services': 'services',
  '/blog': 'blog',
  '/gallery': 'gallery',
  '/contact': 'contact',
  '/arena-ai': 'arena',
  '/github': 'github',
  '/terminal': 'terminal',
  '/music': 'music',
  '/settings': 'settings',
  '/trash': 'trash',
  '/universe': 'universe',
  '/shortcuts': 'shortcuts',
}

export function useLaunch() {
  const navigate = useNavigate()
  const location = useLocation()
  const openWindow = useOS((state) => state.openWindow)

  return useCallback(
    (appId: AppId, params: Record<string, string> = {}) => {
      const app = APPS[appId]
      if (!app) return
      const path = app.path(params)
      openWindow({
        id: app.windowId(params),
        appId,
        title: app.title(params),
        path,
        params,
        width: app.width,
        height: app.height,
        minWidth: app.minWidth,
        minHeight: app.minHeight,
      })
      if (location.pathname !== path) navigate(path)
    },
    [location.pathname, navigate, openWindow]
  )
}

export function useOpenPath() {
  const navigate = useNavigate()
  const launch = useLaunch()
  return useCallback(
    (path: string) => {
      const clean = path.replace(/\/+$/, '') || '/'
      if (clean.startsWith('/projects/')) {
        launch('project', { slug: clean.slice('/projects/'.length).split('/')[0] })
        return
      }
      if (clean.startsWith('/blog/')) {
        launch('post', { slug: clean.slice('/blog/'.length).split('/')[0] })
        return
      }
      const appId = PATH_TO_APP[clean]
      if (appId) launch(appId)
      else navigate(clean)
    },
    [launch, navigate]
  )
}
