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
import { Plus, Upload, X, Loader2, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { courseApi, handleApiError, type CreateCourseData } from "@/lib/api/course-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  price: number;
  visibility: 'public' | 'private';
}

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [modules, setModules] = useState<{ title: string }[]>([])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState("manual")
  const [aiTopic, setAiTopic] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    thumbnail: '',
    price: 0,
    visibility: 'public'
  })

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (title, description, category)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create course data
      const courseData: CreateCourseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags,
        thumbnail: formData.thumbnail || undefined,
        price: formData.price,
        visibility: formData.visibility
      }

      // Create the course
      const response = await courseApi.create(courseData)

      if (!response.success) {
        throw new Error(handleApiError(response.error, response.details))
      }

      const courseId = response.data._id

      // Add modules to the course if any
      if (modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i]
          if (module.title.trim()) {
            const moduleResponse = await courseApi.addModule(courseId, {
              title: module.title.trim(),
              order: i + 1
            })
            
            if (!moduleResponse.success) {
              console.warn(`Failed to add module "${module.title}":`, moduleResponse.error)
            }
          }
        }
      }

      toast({
        title: "Success!",
        description: "Course created successfully",
      })

      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: [],
        thumbnail: '',
        price: 0,
        visibility: 'public'
      })
      setModules([])
      setTagInput('')
      setOpen(false)

    } catch (error: any) {
      console.error('Error creating course:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addModule = () => {
    setModules([...modules, { title: "" }])
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const updateModule = (index: number, title: string) => {
    const updated = [...modules]
    updated[index].title = title
    setModules(updated)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    updateFormData('tags', formData.tags.filter((_, i) => i !== index))
  }

  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course topic",
        variant: "destructive",
      })
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          level: 'intermediate',
          numQuestions: 5,
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate course')
      }

      // Auto-fill form with AI-generated data
      const aiData = data.data
      updateFormData('title', aiData.lessonTitle || aiTopic)
      updateFormData('description', aiData.objective || `Learn about ${aiTopic}`)
      
      // Extract category from topic
      const topicLower = aiTopic.toLowerCase()
      if (topicLower.includes('web') || topicLower.includes('html') || topicLower.includes('css')) {
        updateFormData('category', 'web-development')
      } else if (topicLower.includes('python') || topicLower.includes('java') || topicLower.includes('programming')) {
        updateFormData('category', 'programming')
      } else if (topicLower.includes('ai') || topicLower.includes('machine learning')) {
        updateFormData('category', 'artificial-intelligence')
      } else if (topicLower.includes('design')) {
        updateFormData('category', 'design')
      } else if (topicLower.includes('data')) {
        updateFormData('category', 'data-science')
      }

      // Add AI-generated tags
      if (aiData.keyPoints && aiData.keyPoints.length > 0) {
        updateFormData('tags', aiData.keyPoints.slice(0, 5))
      }

      // Add a module with AI-generated content
      setModules([{ title: aiData.lessonTitle || `Introduction to ${aiTopic}` }])

      toast({
        title: "✨ Success!",
        description: "Course outline generated by AI. You can now edit and create.",
      })

      // Switch to manual tab to show generated content
      setActiveTab("manual")

    } catch (error: any) {
      console.error('AI generation error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate course with AI",
        variant: "destructive",
      })
    } finally {
      setAiLoading(false)
    }
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
            <DialogDescription>Create manually or use AI to generate course outline</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <div className="border rounded-lg p-6 space-y-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Generate Course with AI</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter a topic and let AI create a course outline for you. You can edit everything before creating.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="aiTopic">Course Topic</Label>
                        <Input
                          id="aiTopic"
                          placeholder="e.g., React Hooks, Python for Beginners, Web Design..."
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              generateWithAI()
                            }
                          }}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={generateWithAI}
                        disabled={aiLoading || !aiTopic.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating with AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Course Outline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                After generation, switch to "Manual Entry" tab to review and edit
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Course Thumbnail (URL)</Label>
              <Input 
                id="thumbnail" 
                placeholder="https://example.com/image.jpg" 
                value={formData.thumbnail}
                onChange={(e) => updateFormData('thumbnail', e.target.value)}
              />
              <span className="text-sm text-muted-foreground">Enter image URL (recommended: 1200x630px)</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Introduction to Python" 
                required 
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="data-science">Data Science</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="artificial-intelligence">Artificial Intelligence</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="0" 
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <select
                id="visibility"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.visibility}
                onChange={(e) => updateFormData('visibility', e.target.value as 'public' | 'private')}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what students will learn..." 
                rows={4} 
                required 
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Course Modules (Optional)</Label>
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
                    onChange={(e) => updateModule(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
          </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  )
}
