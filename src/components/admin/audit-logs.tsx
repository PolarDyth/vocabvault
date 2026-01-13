"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Eye, UserCog, Sparkles, Trash2, AlertCircle } from "lucide-react"
import type { AuditLog } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: queryError } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (queryError) {
      if (queryError.message.includes("does not exist") || queryError.code === "42P01") {
        setError(
          "The audit_logs table doesn't exist. Please run the database migration script (003_create_admin_tables.sql).",
        )
      } else {
        setError(`Error loading audit logs: ${queryError.message}`)
      }
      setLoading(false)
      return
    }

    let filteredLogs = data || []
    if (actionFilter !== "all") {
      filteredLogs = filteredLogs.filter((log) => log.action.toLowerCase().includes(actionFilter.toLowerCase()))
    }

    setLogs(filteredLogs)
    setLoading(false)
  }, [actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return UserCog
    if (action.includes("ai")) return Sparkles
    if (action.includes("delete")) return Trash2
    return Eye
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("delete")) return "destructive"
    if (action.includes("disable")) return "secondary"
    return "default"
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Track administrative actions and changes</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
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
          <div className="flex gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="ai">AI Feature Actions</SelectItem>
                <SelectItem value="delete">Delete Actions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Unable to load audit logs
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const ActionIcon = getActionIcon(log.action)

                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ActionIcon className="h-4 w-4 text-muted-foreground" />
                            <Badge variant={getActionBadgeVariant(log.action)}>{formatAction(log.action)}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{log.target_type}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                                <DialogDescription>
                                  {formatAction(log.action)} on {log.target_type}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Action:</span>
                                    <p className="font-medium">{formatAction(log.action)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Target Type:</span>
                                    <p className="font-medium">{log.target_type}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Target ID:</span>
                                    <p className="font-mono text-xs">{log.target_id || "N/A"}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Timestamp:</span>
                                    <p className="font-medium">{new Date(log.created_at).toLocaleString()}</p>
                                  </div>
                                </div>

                                {log.old_value && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">Previous Value:</span>
                                    <ScrollArea className="mt-1 h-24 rounded-md border bg-muted/50 p-2">
                                      <pre className="text-xs">{JSON.stringify(log.old_value, null, 2)}</pre>
                                    </ScrollArea>
                                  </div>
                                )}

                                {log.new_value && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">New Value:</span>
                                    <ScrollArea className="mt-1 h-24 rounded-md border bg-muted/50 p-2">
                                      <pre className="text-xs">{JSON.stringify(log.new_value, null, 2)}</pre>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
