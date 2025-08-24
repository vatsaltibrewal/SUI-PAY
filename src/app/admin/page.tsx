"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [demoData, setDemoData] = useState<any>(null)
  const { toast } = useToast()

  const initializeDemoData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/demo/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setDemoData(data)
        
        // Automatically set localStorage
        localStorage.setItem('sui-pay-token', data.token)
        localStorage.setItem('sui-pay-creator', JSON.stringify(data.creator))
        
        const userObj = {
          name: data.creator.displayName,
          username: data.creator.suiNameService,
          walletAddress: data.creator.walletAddress,
          bio: data.creator.bio,
          profilePicture: data.creator.avatar
        }
        localStorage.setItem('suipay-user', JSON.stringify(userObj))
        
        toast({
          title: "Demo Data Initialized!",
          description: `Created ${data.payments} payments with $${data.totalAmount} total`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkDemoData = async () => {
    try {
      const response = await fetch('/api/demo/init')
      const data = await response.json()
      setDemoData(data)
    } catch (error) {
      console.error('Error checking demo data:', error)
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('sui-pay-token')
    localStorage.removeItem('sui-pay-creator')
    localStorage.removeItem('suipay-user')
    toast({
      title: "Storage Cleared",
      description: "All authentication data removed",
    })
  }

  const goToDashboard = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground uppercase">SuiPay Admin</h1>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="brutalist-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground uppercase">Demo Data Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={initializeDemoData}
                disabled={loading}
                className="brutalist-button w-full bg-primary text-primary-foreground font-bold uppercase hover:bg-primary"
              >
                {loading ? "Creating..." : "Initialize Demo Data"}
              </Button>
              
              <Button
                onClick={checkDemoData}
                variant="outline"
                className="brutalist-button w-full"
              >
                Check Demo Data Status
              </Button>
              
              {demoData && (
                <div className="bg-muted p-4 brutalist-border space-y-2">
                  <h3 className="font-bold text-foreground uppercase">Status</h3>
                  {demoData.exists ? (
                    <div className="space-y-1 text-sm">
                      <p><strong>Creator:</strong> {demoData.creator?.displayName}</p>
                      <p><strong>Payments:</strong> {demoData.paymentsCount}</p>
                      <p><strong>Total Amount:</strong> ${demoData.totalAmount}</p>
                      <p><strong>Analytics:</strong> {JSON.stringify(demoData.analytics)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No demo data found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="brutalist-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground uppercase">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={goToDashboard}
                className="brutalist-button w-full bg-secondary text-secondary-foreground font-bold uppercase hover:bg-secondary"
              >
                Go to Dashboard
              </Button>
              
              <Button
                onClick={clearLocalStorage}
                variant="destructive"
                className="brutalist-button w-full font-bold uppercase"
              >
                Clear localStorage
              </Button>
              
              <div className="bg-muted p-4 brutalist-border">
                <h3 className="font-bold text-foreground uppercase mb-2">Current Auth Status</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Token:</strong> {localStorage.getItem('sui-pay-token') ? '✅ Present' : '❌ Missing'}</p>
                  <p><strong>Creator:</strong> {localStorage.getItem('sui-pay-creator') ? '✅ Present' : '❌ Missing'}</p>
                  <p><strong>User:</strong> {localStorage.getItem('suipay-user') ? '✅ Present' : '❌ Missing'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="brutalist-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground uppercase">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Initialize Demo Data" to create sample creator and payments</li>
              <li>The demo data will automatically set up localStorage authentication</li>
              <li>Click "Go to Dashboard" to test the analytics and payments display</li>
              <li>The dashboard should now show real analytics with chart data</li>
              <li>Use "Clear localStorage" to reset and test the onboarding flow</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
