"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface ShareLinkModalProps {
  isOpen: boolean
  onClose: () => void
  userIdentifier: string
  walletAddress?: string
}

export function ShareLinkModal({ isOpen, onClose, userIdentifier, walletAddress }: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Generate the public payment link
  const paymentLink = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${encodeURIComponent(
    userIdentifier,
  )}`

  // Use wallet address for QR code, fallback to payment link
  const qrCodeData = walletAddress || paymentLink

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      toast({
        title: "Link Copied!",
        description: "Payment link copied to clipboard",
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="brutalist-border bg-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase text-center text-card-foreground">
            SHARE YOUR SUIPAY
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 brutalist-border">
              <QRCodeSVG
                value={qrCodeData}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground font-semibold text-center uppercase">
              {walletAddress ? "Scan to send to wallet" : "Scan to open payment page"}
            </p>
          </div>

          {/* Copyable Link */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground uppercase">Payment Link</label>
            <div className="flex space-x-2">
              <Input value={paymentLink} readOnly className="brutalist-input text-xs font-medium flex-1" />
              <Button
                onClick={handleCopyLink}
                className="brutalist-button bg-primary text-primary-foreground hover:bg-primary px-3"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-3 brutalist-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase text-center">
              Share this link or QR code to receive tips
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="brutalist-button w-full h-10 bg-card text-card-foreground font-bold uppercase hover:bg-card"
          >
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}