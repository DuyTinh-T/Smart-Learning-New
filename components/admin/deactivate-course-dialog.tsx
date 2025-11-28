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
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface DeactivateCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string | null
  courseTitle: string
  currentStatus: boolean
  onSuccess: () => void
}

export function DeactivateCourseDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  currentStatus,
  onSuccess,
}: DeactivateCourseDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const action = currentStatus ? "deactivate" : "activate"
  const actionPast = currentStatus ? "deactivated" : "activated"
  const actionTitle = currentStatus ? "Deactivate Course" : "Activate Course"

  const handleConfirm = async () => {
    if (!courseId) return

    try {
      setLoading(true)

      const response = await fetch(`/api/admin/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} course`)
      }

      toast({
        title: "Success",
        description: `Course has been ${actionPast} successfully.`,
        variant: "default",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${action}ing course:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} course`,
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
          <AlertDialogTitle className="flex items-center gap-2">
            {currentStatus ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {actionTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Are you sure you want to {action} <span className="font-semibold">{courseTitle}</span>?
            </p>

            {currentStatus ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
                <p className="font-medium text-destructive text-sm">
                  Deactivating this course will:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Hide the course from public listings and search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Prevent new student enrollments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Existing students can still access the course content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>The teacher can still edit the course content</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground italic pt-1">
                  You can reactivate the course at any time.
                </p>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 space-y-2">
                <p className="font-medium text-green-600 dark:text-green-400 text-sm">
                  Activating this course will:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>Make the course visible in public listings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>Allow new students to enroll</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>Include the course in search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>Resume normal course operations</span>
                  </li>
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={currentStatus ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>{actionTitle}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
