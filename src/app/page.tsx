"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/components/providers/AuthProvider"
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit"
import { Wallet } from "lucide-react"

export default function OnboardingPage() {
  const [username, setUsername] = useState("")
  const { toast } = useToast()
  const { updateUser, user, isLoading } = useApp()
  const currentAccount = useCurrentAccount()

  useEffect(() => {
    if (!isLoading) {
      // If user has completed profile setup, redirect to dashboard
      if (user.name && (user.username || user.walletAddress)) {
        window.location.href = "/dashboard"
        return
      }
      // If user has username/wallet but no profile, redirect to profile setup
      if ((user.username || user.walletAddress) && !user.name) {
        window.location.href = "/onboarding/profile"
        return
      }
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  const handleUsernameSubmit = () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username",
        variant: "destructive",
      })
      return
    }

    updateUser({ username: `@${username}.suins` })

    // Navigate to profile setup
    window.location.href = "/onboarding/profile"
  }

  const handleWalletConnect = async () => {
    if (currentAccount) {
      // Wallet is already connected
      updateUser({
        isWalletConnected: true,
        walletAddress: currentAccount.address,
      })

      toast({
        title: "Wallet Connected!",
        description: "Successfully connected to SUI wallet",
      })

      // Navigate to profile setup
      setTimeout(() => {
        window.location.href = "/onboarding/profile"
      }, 1000)
    } else {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first using the button above.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-foreground uppercase tracking-tight">SUIPAY</h1>
          <p className="text-muted-foreground font-semibold uppercase text-sm mt-2">Neo-Brutalist Tipping Platform</p>
        </div>

        {/* Username Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-semibold text-foreground uppercase">
              SuiNS Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="username.suins"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="brutalist-input pl-8 h-12 text-base font-semibold"
                minLength={3}
              />
            </div>
          </div>

          <Button
            onClick={handleUsernameSubmit}
            className="brutalist-button w-full h-12 bg-primary text-primary-foreground font-bold text-base uppercase hover:bg-primary"
            disabled={!username.trim()}
          >
            NEXT
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-muted-foreground font-semibold uppercase">OR</span>
          </div>
        </div>

        {/* Wallet Connect */}
        <div className="space-y-4">
          {/* SUI dApp Kit Connect Button */}
          <div className="sui-connect-wrapper">
            <ConnectButton 
              connectText="CONNECT SUI WALLET"
              style={{
                width: '100%',
                height: '48px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '16px'
              }}
            />
          </div>
          
          {/* Continue Button (only show when wallet is connected) */}
          {currentAccount && (
            <Button
              onClick={handleWalletConnect}
              className="brutalist-button w-full h-12 bg-primary text-primary-foreground font-bold text-base uppercase hover:bg-primary"
            >
              <Wallet className="mr-2 h-5 w-5" />
              CONTINUE WITH WALLET
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}