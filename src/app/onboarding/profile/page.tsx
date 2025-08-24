"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/components/providers/AuthProvider"
import { Upload, ArrowLeft } from "lucide-react"

export default function ProfileSetupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateUser, user, isLoading, register } = useApp()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading) {
      // If user has completed profile setup, redirect to dashboard
      if (user.name && (user.username || user.walletAddress)) {
        window.location.href = "/dashboard"
        return
      }
      // If user hasn't started onboarding, redirect to main page
      if (!user.username && !user.walletAddress) {
        window.location.href = "/"
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Profile picture must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    if (bio.length > 160) {
      toast({
        title: "Bio Too Long",
        description: "Bio must be 160 characters or less",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Register with the backend
      const registrationData = {
        email: email.trim(),
        username: user.username?.replace('@', '').replace('.suins', '') || `user_${Date.now()}`,
        displayName: name.trim(),
        walletAddress: user.walletAddress || `0x${Math.random().toString(16).substring(2, 66)}`,
        suiNameService: user.username?.startsWith('@') ? user.username : undefined,
        bio: bio.trim() || undefined,
        avatar: profilePicture || undefined,
      }

      console.log('Registering with data:', registrationData)

      const result = await register(registrationData)

      if (result.success) {
        // Update local user context
        updateUser({
          name: name.trim(),
          bio: bio.trim(),
          profilePicture: profilePicture || undefined,
        })

        toast({
          title: "Profile Created!",
          description: "Welcome to SuiPay",
        })

        // Navigate to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
      } else {
        throw new Error(result.error || 'Registration failed')
      }
    } catch (error: any) {
      console.error('Profile creation error:', error)
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-border p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="brutalist-button bg-card text-card-foreground hover:bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground uppercase">SETUP PROFILE</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <Label htmlFor="profile-picture" className="text-sm font-semibold text-foreground uppercase">
              Profile Picture
            </Label>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32 brutalist-border">
                <AvatarImage src={profilePicture || undefined} alt="Profile" />
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
                  {name.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="relative">
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button className="brutalist-button bg-card text-card-foreground font-bold uppercase hover:bg-card">
                  <Upload className="mr-2 h-4 w-4" />
                  UPLOAD IMAGE
                </Button>
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground uppercase">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brutalist-input h-12 text-base font-semibold"
              required
            />
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground uppercase">
              Display Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="brutalist-input h-12 text-base font-semibold"
              maxLength={50}
              required
            />
          </div>

          {/* Bio Textarea */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-semibold text-foreground uppercase">
              Bio ({bio.length}/160)
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell people about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="brutalist-input min-h-[100px] text-base font-medium resize-none"
              maxLength={160}
            />
          </div>

          {/* Account Info Display */}
          <div className="bg-muted p-4 brutalist-border space-y-2">
            <h3 className="text-sm font-bold text-foreground uppercase">Account Details</h3>
            {user.username && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">SuiNS:</span> {user.username}
              </p>
            )}
            {user.walletAddress && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Wallet:</span> {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !email.trim() || isSubmitting}
            className="brutalist-button w-full h-12 bg-primary text-primary-foreground font-bold text-base uppercase hover:bg-primary"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                <span>CREATING...</span>
              </div>
            ) : (
              "CREATE PROFILE"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}