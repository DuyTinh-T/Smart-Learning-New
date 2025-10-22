"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Target, Award, BookOpen } from "lucide-react"
import { motion } from "framer-motion"

const userData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  bio: "Passionate learner exploring web development and design. Always eager to learn new technologies and improve my skills.",
  avatar: "/placeholder.svg",
  joinDate: "January 2024",
  coursesCompleted: 5,
  certificatesEarned: 5,
  hoursLearned: 127,
  learningGoals: [
    "Master React and Next.js",
    "Build 3 full-stack projects",
    "Learn TypeScript fundamentals",
    "Complete UI/UX design course",
  ],
  achievements: [
    { id: 1, title: "First Course Completed", icon: "🎓", date: "Feb 2024" },
    { id: 2, title: "Week Streak", icon: "🔥", date: "Mar 2024" },
    { id: 3, title: "Quiz Master", icon: "⭐", date: "Mar 2024" },
    { id: 4, title: "Fast Learner", icon: "⚡", date: "Apr 2024" },
  ],
}

export function UserProfile() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account and learning preferences</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {userData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-1">{userData.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{userData.email}</p>
                  <Badge variant="outline" className="mb-6">
                    Member since {userData.joinDate}
                  </Badge>

                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm">Courses</span>
                      </div>
                      <span className="font-semibold">{userData.coursesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-accent" />
                        <span className="text-sm">Certificates</span>
                      </div>
                      <span className="font-semibold">{userData.certificatesEarned}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm">Hours Learned</span>
                      </div>
                      <span className="font-semibold">{userData.hoursLearned}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="bg-card">
                <TabsTrigger value="personal">
                  <User className="h-4 w-4 mr-2" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="goals">
                  <Target className="h-4 w-4 mr-2" />
                  Learning Goals
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Alex" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Johnson" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={userData.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" rows={4} defaultValue={userData.bio} />
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>Your learning milestones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {userData.achievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="text-3xl">{achievement.icon}</div>
                          <div>
                            <p className="font-semibold">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground">{achievement.date}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Goals</CardTitle>
                    <CardDescription>Set and track your learning objectives</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userData.learningGoals.map((goal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center gap-3 p-4 rounded-lg border"
                      >
                        <Target className="h-5 w-5 text-primary" />
                        <span className="flex-1">{goal}</span>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </motion.div>
                    ))}
                    <Button variant="outline" className="w-full bg-transparent">
                      Add New Goal
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive course updates via email</p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="course-reminders">Course Reminders</Label>
                        <p className="text-sm text-muted-foreground">Get reminded about incomplete lessons</p>
                      </div>
                      <Switch id="course-reminders" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-courses">New Course Alerts</Label>
                        <p className="text-sm text-muted-foreground">Notify me about new courses</p>
                      </div>
                      <Switch id="new-courses" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="achievements">Achievement Notifications</Label>
                        <p className="text-sm text-muted-foreground">Celebrate your learning milestones</p>
                      </div>
                      <Switch id="achievements" defaultChecked />
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Preferences</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
