"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import type { Word } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, Loader2, Volume2, BookPlus, PanelLeftClose, PanelLeft } from "lucide-react"
import { mutate } from "swr"
import { createClient } from "@/utils/supabase/client"
import { useChat } from "@ai-sdk/react"
import ReactMarkdown from "react-markdown"
import { ChatSidebar, type Conversation } from "./chat-sidebar"
import { cn } from "@/lib/utils"

interface AssistantContentProps {
  words: Word[]
  userId: string
}

interface StoredMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export function AssistantContent({ words, userId }: AssistantContentProps) {
  const [input, setInput] = useState("")
  const [addingWord, setAddingWord] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const isCreatingChatRef = useRef(false) // Synchronous guard against spam clicks
  const scrollRef = useRef<HTMLDivElement>(null)

  // Build vocabulary context for AI (sent separately, not shown in messages)
  const vocabularyContext = useMemo(() => {
    if (words.length === 0) return undefined
    const wordList = words
      .slice(0, 20)
      .map((w) => w.hiragana)
      .join(", ")
    return `${words.length} words including: ${wordList}${words.length > 20 ? "..." : ""}`
  }, [words])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/assistant",
      body: { vocabularyContext },
    }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Save messages to database when they change (after streaming completes)
  useEffect(() => {
    if (status === "ready" && messages.length > 0 && activeConversationId) {
      saveMessagesToDatabase()
    }
  }, [status, messages.length])

  const loadConversations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (!error && data) {
      setConversations(data)
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    setIsLoadingConversation(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      // Convert stored messages to UI messages format
      const uiMessages: UIMessage[] = data.map((msg: StoredMessage) => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: "text" as const, text: msg.content }],
        createdAt: new Date(msg.created_at),
      }))
      setMessages(uiMessages)
    }
    setIsLoadingConversation(false)
  }

  const saveMessagesToDatabase = async () => {
    if (!activeConversationId || messages.length === 0) return

    const supabase = createClient()

    // Get count of existing messages for this conversation
    const { count: existingCount } = await supabase
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", activeConversationId)

    const savedCount = existingCount || 0

    // Only save messages that haven't been saved yet (based on index)
    const newMessages = messages.slice(savedCount)

    if (newMessages.length > 0) {
      const messagesToInsert = newMessages.map((msg) => ({
        conversation_id: activeConversationId,
        role: msg.role,
        content: msg.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(""),
      }))

      const { error: insertError } = await supabase
        .from("conversation_messages")
        .insert(messagesToInsert)

      if (insertError) {
        console.error("Failed to save messages:", insertError)
        return
      }

      // Update conversation title if it's the first user message
      const firstUserMessage = messages.find((m) => m.role === "user")
      if (firstUserMessage && savedCount === 0) {
        const title = firstUserMessage.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("")
          .slice(0, 50)

        await supabase
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", activeConversationId)

        loadConversations()
      } else {
        // Just update the timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", activeConversationId)
      }
    }
  }

  const createNewConversation = useCallback(async () => {
    // Don't create new chat if already in an empty chat
    if (activeConversationId && messages.length === 0) return
    
    // Use ref for synchronous check to prevent race conditions from rapid clicks
    if (isCreatingChatRef.current) return
    isCreatingChatRef.current = true
    setIsCreatingChat(true)
    
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: "New Chat" })
        .select()
        .single()

      if (!error && data) {
        setConversations((prev) => [data, ...prev])
        setActiveConversationId(data.id)
        setMessages([])
      }
    } finally {
      isCreatingChatRef.current = false
      setIsCreatingChat(false)
    }
  }, [userId, setMessages, activeConversationId, messages.length])

  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationId) return
    setActiveConversationId(id)
    await loadConversationMessages(id)
  }

  const handleDeleteConversation = async (id: string) => {
    const supabase = createClient()
    await supabase.from("conversations").delete().eq("id", id)
    setConversations((prev) => prev.filter((c) => c.id !== id))

    if (activeConversationId === id) {
      setActiveConversationId(null)
      setMessages([])
    }
  }

  const handleRenameConversation = async (id: string, title: string) => {
    const supabase = createClient()
    await supabase.from("conversations").update({ title }).eq("id", id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
  }

  const handleClearAllConversations = async () => {
    if (!confirm("Are you sure you want to delete all chats? This cannot be undone.")) return
    
    const supabase = createClient()
    await supabase.from("conversations").delete().eq("user_id", userId)
    setConversations([])
    setActiveConversationId(null)
    setMessages([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Create conversation if none active
    if (!activeConversationId) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: input.slice(0, 50) })
        .select()
        .single()

      if (!error && data) {
        setConversations((prev) => [data, ...prev])
        setActiveConversationId(data.id)
      }
    }

    sendMessage({ text: input })
    setInput("")
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "ja-JP"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const addWordToDictionary = async (wordData: { kanji?: string; hiragana: string; definition: string }) => {
    setAddingWord(wordData.hiragana)
    const supabase = createClient()

    await supabase.from("words").insert({
      user_id: userId,
      kanji: wordData.kanji || null,
      hiragana: wordData.hiragana,
      romaji: null,
      definition: wordData.definition,
      notes: "Added from AI Assistant",
      tags: ["ai-suggested"],
    })

    mutate(["words", userId])
    setAddingWord(null)
  }

  const suggestedPrompts = [
    "How do I pronounce 食べる?",
    "Give me example sentences with 勉強",
    "What are common greetings in Japanese?",
    "Explain the difference between は and が",
    "Suggest 5 useful verbs for beginners",
  ]

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          isCreating={isCreatingChat}
          isInEmptyChat={!!activeConversationId && messages.length === 0}
          onSelectConversation={handleSelectConversation}
          onNewConversation={createNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onClearAllConversations={handleClearAllConversations}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">AI Assistant</span>
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="flex-1 mb-4 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollRef}>
            <CardContent className="p-4">
              {isLoadingConversation ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-6">Ask me anything about Japanese! I can help with:</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <Badge variant="secondary">Pronunciation</Badge>
                    <Badge variant="secondary">Example Sentences</Badge>
                    <Badge variant="secondary">Word Suggestions</Badge>
                    <Badge variant="secondary">Grammar Help</Badge>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(prompt)}
                        className="text-xs"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.parts.map((part, index) => {
                          if (part.type === "text") {
                            // User messages: plain text
                            if (message.role === "user") {
                              return (
                                <div key={index} className="whitespace-pre-wrap">
                                  {part.text}
                                </div>
                              )
                            }

                            // Assistant messages: render markdown
                            return (
                              <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children, ...props }) => {
                                      const text = String(children)
                                      const japaneseMatch = text.match(/[ぁ-んァ-ン一-龯]+/)
                                      return (
                                        <div className="flex items-start gap-2 mb-2">
                                          <p {...props} className="flex-1 m-0">
                                            {children}
                                          </p>
                                          {japaneseMatch && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 shrink-0 mt-0.5"
                                              onClick={() => speakText(japaneseMatch[0])}
                                            >
                                              <Volume2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      )
                                    },
                                    h1: ({ children }) => (
                                      <h3 className="text-lg font-bold mt-3 mb-2">{children}</h3>
                                    ),
                                    h2: ({ children }) => (
                                      <h4 className="text-base font-bold mt-3 mb-2">{children}</h4>
                                    ),
                                    h3: ({ children }) => (
                                      <h5 className="text-sm font-bold mt-2 mb-1">{children}</h5>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>
                                    ),
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => (
                                      <code className="bg-background/50 px-1 py-0.5 rounded text-sm font-mono">
                                        {children}
                                      </code>
                                    ),
                                  }}
                                >
                                  {part.text}
                                </ReactMarkdown>
                              </div>
                            )
                          }
                          return null
                        })}

                        {/* Quick add button for word suggestions */}
                        {message.role === "assistant" && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {message.parts.map((part) => {
                              if (part.type !== "text") return null
                              const matches = part.text.match(/([一-龯]+)\s*[（(]([ぁ-んァ-ン]+)[）)]/g)
                              if (!matches) return null
                              return matches.slice(0, 3).map((match, idx) => {
                                const kanjiMatch = match.match(/([一-龯]+)/)
                                const hiraganaMatch = match.match(/[（(]([ぁ-んァ-ン]+)[）)]/)
                                if (!kanjiMatch || !hiraganaMatch) return null
                                const kanji = kanjiMatch[1]
                                const hiragana = hiraganaMatch[1]
                                const isInDictionary = words.some(
                                  (w) => w.kanji === kanji || w.hiragana === hiragana
                                )
                                if (isInDictionary) return null
                                return (
                                  <Button
                                    key={idx}
                                    variant="secondary"
                                    size="sm"
                                    className="text-xs gap-1"
                                    disabled={addingWord === hiragana}
                                    onClick={() =>
                                      addWordToDictionary({
                                        kanji,
                                        hiragana,
                                        definition: "Added from AI suggestion",
                                      })
                                    }
                                  >
                                    {addingWord === hiragana ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <BookPlus className="h-3 w-3" />
                                    )}
                                    Add {kanji}
                                  </Button>
                                )
                              })
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Japanese words, pronunciation, or grammar..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </main>
    </div>
  )
}
