export type QType = 'mcq' | 'output' | 'bug' | 'code'

export interface Objective {
  id: string // e.g. "D335.04"
  code: string // "04"
  competency: string
  title: string
  summary: string
  weight: number // share of the mock OA, percent
  position: number
}

export interface Competency {
  id: string
  title: string
  summary: string
}

export interface Course {
  code: string
  title: string
  summary: string
  note: string
  competencies: Competency[]
}

interface BaseQuestion {
  id: string
  objective: string
  type: QType
  difficulty: 1 | 2 | 3
  prompt: string
  explanation: string
  /** Files that exist in the working directory when the code runs. */
  files?: Record<string, string>
  /** Present on AI-generated questions. */
  source?: 'bank' | 'ai'
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq'
  code?: string
  choices: string[]
  answer: number
}

export interface OutputQuestion extends BaseQuestion {
  type: 'output'
  code: string
  stdin?: string
  answer: string
}

export interface BugQuestion extends BaseQuestion {
  type: 'bug'
  code: string
  stdin?: string
  answer: number // 1-based line number
  fix: string
  expected: string // what the fixed program prints
  actual: string // what the buggy program prints, or the error name
}

export interface CodeTest {
  stdin: string
  expected: string
  hidden: boolean
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code'
  starter: string
  tests: CodeTest[]
  solution: string
}

export type Question = McqQuestion | OutputQuestion | BugQuestion | CodeQuestion

export interface CourseBank {
  version: number
  course: Course
  objectives: Objective[]
  questions: Question[]
}

export type Mode = 'practice' | 'review' | 'mock'

export interface Attempt {
  id: string
  questionId: string
  objective: string
  qtype: QType
  correct: boolean
  score: number // 0..1 (partial credit for code tests)
  mode: Mode
  sessionId?: string
  elapsedMs: number
  createdAt: string // ISO
}

export interface ReviewState {
  questionId: string
  objective: string
  ease: number
  intervalDays: number
  reps: number
  lapses: number
  due: string // ISO
  lastCorrect: boolean
  updatedAt: string
}

export interface MockResult {
  id: string
  startedAt: string
  finishedAt: string
  timeLimitMin: number
  total: number
  correct: number
  byObjective: Record<string, { total: number; correct: number }>
}

/** What the learner submitted. */
export type Response =
  | { type: 'mcq'; choice: number }
  | { type: 'output'; text: string }
  | { type: 'bug'; line: number }
  | { type: 'code'; source: string }

export interface TestResult {
  stdin: string
  expected: string
  got: string
  passed: boolean
  hidden: boolean
  error?: string
}

export interface Grade {
  correct: boolean
  score: number
  tests?: TestResult[]
  note?: string
}
