"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Bug, Lightbulb, MessageSquare, Send, CheckCircle2 } from "lucide-react"

type FeedbackType = "bug" | "feature" | "feedback"

interface FeedbackForm {
  type: FeedbackType
  title: string
  description: string
  email: string
}

export function AlphaBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FeedbackForm>({
    type: "bug",
    title: "",
    description: "",
    email: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit feedback")
      }

      setIsSuccess(true)
      setForm({ type: "bug", title: "", description: "", email: "" })
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsOpen(false)
        setIsSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />
      case "feature":
        return <Lightbulb className="h-4 w-4" />
      case "feedback":
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alpha
          </Badge>
          <p className="text-sm text-amber-700 dark:text-amber-400 truncate">
            This app is in alpha. Expect bugs and incomplete features.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              >
                <Bug className="h-4 w-4 mr-2" />
                Report Bug
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <DialogTitle className="text-xl mb-2">Thank you!</DialogTitle>
                  <DialogDescription>
                    Your feedback has been submitted successfully. We appreciate your help improving VocabVault!
                  </DialogDescription>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Send Feedback</DialogTitle>
                    <DialogDescription>
                      Help us improve VocabVault by reporting bugs, suggesting features, or sharing your thoughts.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Feedback Type</Label>
                        <Select
                          value={form.type}
                          onValueChange={(value: FeedbackType) => setForm({ ...form, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bug">
                              <div className="flex items-center gap-2">
                                <Bug className="h-4 w-4 text-red-500" />
                                Bug Report
                              </div>
                            </SelectItem>
                            <SelectItem value="feature">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                Feature Request
                              </div>
                            </SelectItem>
                            <SelectItem value="feedback">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                General Feedback
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder={
                            form.type === "bug" 
                              ? "Brief description of the bug" 
                              : form.type === "feature"
                              ? "What feature would you like?"
                              : "What's on your mind?"
                          }
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder={
                            form.type === "bug"
                              ? "Steps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:"
                              : form.type === "feature"
                              ? "Describe the feature and why it would be useful..."
                              : "Share your thoughts..."
                          }
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          rows={5}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">
                          Email <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Only used to follow up on your feedback if needed.
                        </p>
                      </div>
                      
                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Feedback
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
