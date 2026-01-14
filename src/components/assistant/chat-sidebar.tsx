"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  isCreating?: boolean
  isInEmptyChat?: boolean
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
  onClearAllConversations?: () => void
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  isCreating = false,
  isInEmptyChat = false,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onClearAllConversations,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Group conversations by date
  const groupedConversations = conversations.reduce<Record<string, Conversation[]>>((groups, conv) => {
    const dateKey = formatDate(conv.updated_at)
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(conv)
    return groups
  }, {})

  return (
    <div className="w-64 border-r bg-card/50 flex flex-col h-full">
      <div className="p-3 border-b">
        <Button 
          onClick={onNewConversation} 
          className="w-full gap-2" 
          size="sm"
          disabled={isCreating || isInEmptyChat}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isCreating ? "Creating..." : "New Chat"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {Object.entries(groupedConversations).map(([dateGroup, convs]) => (
            <div key={dateGroup}>
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">{dateGroup}</p>
              <div className="space-y-1">
                {convs.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer",
                      activeConversationId === conversation.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => {
                      if (editingId !== conversation.id) {
                        onSelectConversation(conversation.id)
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    
                    {editingId === conversation.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-6 text-sm py-0 px-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit()
                            if (e.key === "Escape") cancelEdit()
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            saveEdit()
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            cancelEdit()
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{conversation.title}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteConversation(conversation.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditing(conversation)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDeleteConversation(conversation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Clear All button */}
      {conversations.length > 0 && onClearAllConversations && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground hover:text-destructive"
            onClick={onClearAllConversations}
          >
            <Trash2 className="h-4 w-4" />
            Clear All Chats
          </Button>
        </div>
      )}
    </div>
  )
}
