import { LessonView } from "@/components/course/lesson-view"
import { Header } from "@/components/header"

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <LessonView courseId={id} lessonId={lessonId} />
      </main>
    </div>
  )
}
