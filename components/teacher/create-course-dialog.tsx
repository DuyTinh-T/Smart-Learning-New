"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Plus, Upload, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false)
  const [modules, setModules] = useState<{ title: string; description: string }[]>([])
  const [prerequisites, setPrerequisites] = useState<string[]>([])
  const [prerequisiteInput, setPrerequisiteInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle course creation
    console.log("[v0] Course created with modules:", modules)
    setOpen(false)
  }

  const addModule = () => {
    setModules([...modules, { title: "", description: "" }])
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const updateModule = (index: number, field: "title" | "description", value: string) => {
    const updated = [...modules]
    updated[index][field] = value
    setModules(updated)
  }

  const addPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      setPrerequisites([...prerequisites, prerequisiteInput.trim()])
      setPrerequisiteInput("")
    }
  }

  const removePrerequisite = (index: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course to your teaching portfolio with detailed information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Course Thumbnail</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <span className="text-sm text-muted-foreground">Recommended: 1200x630px</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Course Title</Label>
              <Input id="title" placeholder="e.g., Introduction to Python" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select category</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="data-science">Data Science</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" placeholder="99" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe what students will learn..." rows={4} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="objectives">Learning Objectives</Label>
              <Textarea
                id="objectives"
                placeholder="What will students be able to do after completing this course?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (weeks)</Label>
                <Input id="duration" type="number" placeholder="8" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Level</Label>
                <select
                  id="level"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Prerequisites</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a prerequisite"
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addPrerequisite()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addPrerequisite}>
                  Add
                </Button>
              </div>
              {prerequisites.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {prerequisites.map((prereq, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {prereq}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removePrerequisite(index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Course Modules</Label>
                <Button type="button" variant="outline" size="sm" onClick={addModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
              {modules.map((module, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Module {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModule(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Module title"
                    value={module.title}
                    onChange={(e) => updateModule(index, "title", e.target.value)}
                  />
                  <Textarea
                    placeholder="Module description"
                    value={module.description}
                    onChange={(e) => updateModule(index, "description", e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
