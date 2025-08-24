"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  username?: string
  name?: string
  bio?: string
  profilePicture?: string
  walletAddress?: string
  isWalletConnected: boolean
}

interface AppContextType {
  user: User
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  isLoading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({
    isWalletConnected: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("suipay-user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse saved user data:", error)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("suipay-user", JSON.stringify(user))
    }
  }, [user, isLoading])

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }

  return <AppContext.Provider value={{ user, setUser, updateUser, isLoading }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
