"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, UserCog, Ban, Trash2, Shield, AlertCircle, Sparkles } from "lucide-react"
import type { UserProfile, UserRole, UserStatus } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserAIFeaturesDialog } from "./user-ai-features-dialog"
import { createClient } from "@/utils/supabase/client"

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<UserRole>("user")
  const [editStatus, setEditStatus] = useState<UserStatus>("active")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: profiles, error: queryError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (queryError) {
        if (queryError.message.includes("does not exist") || queryError.code === "42P01") {
          setError(
            "The user_profiles table doesn't exist. Please run the database migration script (003_create_admin_tables.sql).",
          )
        } else {
          setError(`Error fetching users: ${queryError.message}`)
        }
        setLoading(false)
        return
      }

      let filteredProfiles = profiles || []

      if (roleFilter !== "all") {
        filteredProfiles = filteredProfiles.filter((p) => p.role === roleFilter)
      }
      if (statusFilter !== "all") {
        filteredProfiles = filteredProfiles.filter((p) => p.status === statusFilter)
      }

      const usersWithStats = await Promise.all(
        filteredProfiles.map(async (profile) => {
          // Use admin function to get word count (bypasses RLS)
          const { data: wordCount } = await supabase.rpc("get_user_word_count", {
            target_user_id: profile.user_id,
          })

          return {
            ...profile,
            word_count: wordCount || 0,
          }
        }),
      )

      setUsers(usersWithStats)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("An unexpected error occurred while fetching users.")
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return user.display_name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query)
  })

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setEditStatus(user.status)
    setEditDialogOpen(true)
  }

  const handleAIFeatures = (user: UserProfile) => {
    setSelectedUser(user)
    setAiDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        role: editRole,
        status: editStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedUser.id)

    if (!updateError) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("audit_logs").insert({
          admin_id: user.id,
          action: "update_user",
          target_type: "user_profile",
          target_id: selectedUser.id,
          old_value: { role: selectedUser.role, status: selectedUser.status },
          new_value: { role: editRole, status: editStatus },
        })
      }

      fetchUsers()
    }

    setEditDialogOpen(false)
    setSelectedUser(null)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "delete_user",
        target_type: "user_profile",
        target_id: selectedUser.id,
        old_value: { display_name: selectedUser.display_name, role: selectedUser.role },
        new_value: null,
      })
    }

    const { error: deleteError } = await supabase.from("user_profiles").delete().eq("id", selectedUser.id)

    if (!deleteError) {
      fetchUsers()
    }

    setDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "default"
      case "moderator":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "default"
      case "suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View, edit, and manage user accounts and their AI feature access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Setup Required</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Words</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Unable to load users
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.display_name || "Unnamed"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{user.word_count}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAIFeatures(user)}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              AI Features
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setEditRole(user.role)
                                setEditStatus(user.status === "suspended" ? "active" : "suspended")
                                handleSaveUser()
                              }}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {user.status === "suspended" ? "Unsuspend" : "Suspend"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update role and status for {selectedUser?.display_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-chart-4" />
                      Moderator
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as UserStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.display_name}? This action cannot be undone and will remove
              all their data including saved words and flashcard progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserAIFeaturesDialog
        user={selectedUser}
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onSaved={fetchUsers}
      />
    </div>
  )
}
