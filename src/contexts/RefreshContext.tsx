import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface RefreshContextType {
  refreshSignal: number
  triggerRefresh: () => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshSignal, setRefreshSignal] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshSignal((prev) => prev + 1)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshSignal, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh(): RefreshContextType {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider')
  }
  return context
}
