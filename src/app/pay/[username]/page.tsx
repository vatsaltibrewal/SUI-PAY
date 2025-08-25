"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Wallet, DollarSign, ArrowLeft } from "lucide-react"
import { useParams } from "next/navigation"
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { SuiTransactionUtils } from "@/lib/sui"

interface CreatorData {
  id: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  walletAddress: string
  suiNameService?: string
  minDonationAmount: number
  customMessage?: string
  isVerified: boolean
}

export default function PaymentPage() {
  const params = useParams()
  const username = params.username as string
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [donorName, setDonorName] = useState("")
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch from the public creator API
        const response = await fetch(`/api/public/creator/${encodeURIComponent(username)}`)
        
        if (response.ok) {
          const data = await response.json()
          setCreatorData(data.creator)
        } else if (response.status === 404) {
          // Creator not found, check localStorage for current user
          const storedUser = localStorage.getItem("suipay-user")
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            
            // Generate the same identifier as dashboard does
            const userIdentifier =
              userData.username?.replace("@", "").replace(".suins", "") || 
              userData.walletAddress?.slice(2, 10) || "user"

            // Check if this is the current user's payment page
            if (userIdentifier === username && userData.name) {
              setCreatorData({
                id: userIdentifier,
                username: userData.username || userIdentifier,
                displayName: userData.name,
                bio: userData.bio || "SuiPay user ready to receive tips!",
                avatar: userData.profilePicture,
                walletAddress: userData.walletAddress || "",
                minDonationAmount: 1.0,
                isVerified: false
              })
            } else {
              setError("Creator not found")
            }
          } else {
            setError("Creator not found")
          }
        } else {
          setError("Failed to load creator data")
        }
      } catch (error) {
        console.error('Error fetching creator data:', error)
        setError("Failed to load creator data")
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchCreatorData()
    }
  }, [username])



  const handlePayment = async () => {
    if (!creatorData || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send a tip",
        variant: "destructive",
      })
      return
    }

    const tipAmount = Number.parseFloat(amount)

    if (!tipAmount || tipAmount < 0.01) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $0.01",
        variant: "destructive",
      })
      return
    }

    if (tipAmount < creatorData.minDonationAmount) {
      toast({
        title: "Amount Too Small",
        description: `Minimum tip amount is $${creatorData.minDonationAmount}`,
        variant: "destructive",
      })
      return
    }

    if (tipAmount > 1000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum tip amount is $1000",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create SUI transaction
      const tx = await SuiTransactionUtils.createPaymentTransaction(
        creatorData.walletAddress,
        tipAmount,
        message.trim() || undefined
      )

      // Execute the transaction
      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Payment transaction successful:', result)
            
            // Record the payment in the backend
            try {
              const recordResponse = await fetch('/api/payments/record', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  txHash: result.digest,
                  creatorId: creatorData.id,
                  message: message.trim() || undefined,
                  donorName: donorName.trim() || undefined,
                  donorEmail: undefined,
                  isAnonymous: !donorName.trim(),
                }),
              })

              if (recordResponse.ok) {
                toast({
                  title: "Payment Sent!",
                  description: `Successfully tipped $${tipAmount.toFixed(2)} to ${creatorData.displayName}`,
                })

                // Reset form
                setAmount("")
                setMessage("")
                setDonorName("")

                // Show thank you message
                setTimeout(() => {
                  toast({
                    title: "Thank You!",
                    description: "Your support means a lot to creators",
                  })
                }, 2000)
              } else {
                console.warn('Failed to record payment in backend')
                toast({
                  title: "Payment Sent!",
                  description: `Payment sent successfully, but may not appear in analytics immediately.`,
                })
              }
            } catch (recordError) {
              console.error('Error recording payment:', recordError)
              toast({
                title: "Payment Sent!",
                description: `Payment sent successfully, but may not appear in analytics immediately.`,
              })
            }
          },
          onError: (error) => {
            console.error('Payment transaction failed:', error)
            toast({
              title: "Payment Failed",
              description: "Transaction failed. Please try again.",
              variant: "destructive",
            })
          },
        }
      )
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-muted-foreground uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle error cases
  if (error || !creatorData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b-2 border-border bg-background p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="brutalist-button bg-card text-card-foreground hover:bg-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground uppercase">SUIPAY</h1>
          </div>
        </header>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="brutalist-border bg-card max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold text-card-foreground uppercase">USER NOT FOUND</h2>
              <p className="text-muted-foreground font-semibold">
                The user you&apos;re looking for doesn&apos;t exist or the link is invalid.
              </p>
              <Button
                onClick={() => window.history.back()}
                className="brutalist-button bg-primary text-primary-foreground font-bold uppercase hover:bg-primary"
              >
                GO BACK
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-border bg-background p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="brutalist-button bg-card text-card-foreground hover:bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground uppercase">SUIPAY</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* User Profile Card */}
          <Card className="brutalist-border bg-card">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold text-card-foreground uppercase">
                TIP {creatorData.displayName.toUpperCase()}
              </h2>

              <Avatar className="w-24 h-24 mx-auto brutalist-border">
                <AvatarImage src={creatorData.avatar || "/placeholder.svg"} alt={creatorData.displayName} />
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
                  {creatorData.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-card-foreground">{creatorData.displayName}</h3>
                {creatorData.suiNameService && (
                  <p className="text-sm text-muted-foreground font-semibold">{creatorData.suiNameService}</p>
                )}
                <p className="text-sm text-muted-foreground font-medium">
                  {creatorData.bio || "Creator on SuiPay"}
                </p>
                {creatorData.customMessage && (
                                  <p className="text-sm text-card-foreground font-medium italic">
                  &quot;{creatorData.customMessage}&quot;
                </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="brutalist-border bg-card">
                      <CardContent className="p-6 space-y-4">
            {!currentAccount ? (
              <div className="space-y-4">
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
                <p className="text-center text-sm text-muted-foreground">
                  Connect your SUI wallet to send tips
                </p>
              </div>
            ) : (
                <div className="space-y-4">
                  {/* Wallet Status */}
                  <div className="bg-muted p-3 rounded-lg brutalist-border">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Connected Wallet</p>
                    <p className="text-sm font-medium text-foreground">
                      {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                    </p>
                  </div>

                  {/* Tip Amount */}
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-semibold text-card-foreground uppercase">
                      Tip Amount (Min: ${creatorData.minDonationAmount})
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="brutalist-input pl-10 h-12 text-base font-semibold"
                        min={creatorData.minDonationAmount}
                        max="1000"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-semibold text-card-foreground uppercase">
                      Message (Optional)
                    </label>
                    <Input
                      id="message"
                      type="text"
                      placeholder="Say something nice..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="brutalist-input h-12 text-base font-medium"
                      maxLength={200}
                    />
                  </div>

                  {/* Optional Name */}
                  <div className="space-y-2">
                    <label htmlFor="donorName" className="text-sm font-semibold text-card-foreground uppercase">
                      Your Name (Optional)
                    </label>
                    <Input
                      id="donorName"
                      type="text"
                      placeholder="Anonymous"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="brutalist-input h-12 text-base font-medium"
                      maxLength={50}
                    />
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={!amount || !currentAccount || Number.parseFloat(amount) < creatorData.minDonationAmount || isProcessing}
                    className="brutalist-button w-full h-12 bg-primary text-primary-foreground font-bold text-base uppercase hover:bg-primary"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                        <span>PROCESSING...</span>
                      </div>
                    ) : (
                      `PAY $${Number.parseFloat(amount || "0").toFixed(2)}`
                    )}
                  </Button>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 25].map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount.toString())}
                        variant="outline"
                        className="brutalist-button bg-card text-card-foreground font-bold uppercase hover:bg-card"
                      >
                        ${quickAmount}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-semibold uppercase">
              Powered by SuiPay • Secure & Fast • 
              {creatorData.walletAddress && (
                <span className="block mt-1">
                  {creatorData.walletAddress.slice(0, 6)}...{creatorData.walletAddress.slice(-4)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}