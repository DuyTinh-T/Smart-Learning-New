import { QuizView } from "@/components/quiz/quiz-view"
import { Header } from "@/components/header"

export default async function QuizPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <QuizView courseId={id} lessonId={lessonId} />
      </main>
    </div>
  )
}
