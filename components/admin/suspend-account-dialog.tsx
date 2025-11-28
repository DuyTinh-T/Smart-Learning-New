"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SuspendAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  userName: string
  userType: "teacher" | "student"
  currentStatus: string
  onSuccess: () => void
}

export function SuspendAccountDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userType,
  currentStatus,
  onSuccess,
}: SuspendAccountDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isSuspended = currentStatus !== "active"
  const action = isSuspended ? "activate" : "suspend"

  const handleConfirm = async () => {
    if (!userId) return

    try {
      setLoading(true)

      const endpoint = userType === "teacher" 
        ? `/api/admin/teachers/${userId}/status`
        : `/api/admin/students/${userId}/status`

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: isSuspended, // If currently suspended, activate it
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} account`)
      }

      toast({
        title: "Success",
        description: data.message || `Account ${action}d successfully`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${action}ing account:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} account`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSuspended ? "Activate" : "Suspend"} {userType === "teacher" ? "Teacher" : "Student"} Account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSuspended ? (
              <>
                Are you sure you want to <strong>activate</strong> {userName}'s account?
                <br />
                <br />
                The user will be able to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Login to their account</li>
                  <li>Access all platform features</li>
                  {userType === "teacher" ? (
                    <>
                      <li>Manage their courses</li>
                      <li>Interact with students</li>
                    </>
                  ) : (
                    <>
                      <li>Enroll in courses</li>
                      <li>Continue their learning</li>
                    </>
                  )}
                </ul>
              </>
            ) : (
              <>
                Are you sure you want to <strong>suspend</strong> {userName}'s account?
                <br />
                <br />
                This action will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Prevent the user from logging in</li>
                  <li>Disable access to all platform features</li>
                  {userType === "teacher" ? (
                    <>
                      <li>Hide their courses from students</li>
                      <li>Stop all course-related activities</li>
                    </>
                  ) : (
                    <>
                      <li>Pause their course enrollments</li>
                      <li>Prevent new enrollments</li>
                    </>
                  )}
                </ul>
                <br />
                <span className="text-muted-foreground text-sm">
                  You can reactivate the account at any time.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={isSuspended ? "" : "bg-destructive hover:bg-destructive/90"}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSuspended ? "Activate Account" : "Suspend Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
