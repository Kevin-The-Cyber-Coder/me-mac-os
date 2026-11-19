import { createContext, useContext } from 'react'

export const WindowParamsContext = createContext<Record<string, string>>({})

export function useWindowParam(name: string) {
  return useContext(WindowParamsContext)[name] || ''
}

export function useWindowParams() {
  return useContext(WindowParamsContext)
}
