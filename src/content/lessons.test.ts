import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COURSE, OBJECTIVES } from '../lib/bank'
import { toSpokenText } from '../lib/speech'
import {
  COMPETENCY_BLURB,
  LESSONS,
  LESSONS_INTRO,
  findLesson,
  lessonNeighbors,
  lessonPath,
  lessonSpeech,
  lessonsIndexSpeech,
  matchLessonPath,
  practicePath,
} from './lessons'

describe('lessons', () => {
  it('covers every objective in bank order, grouped by the bank competencies', () => {
    expect(LESSONS.map((lesson) => lesson.objectiveId)).toEqual(OBJECTIVES.map((objective) => objective.id))
    expect(new Set(LESSONS.map((lesson) => lesson.slug)).size).toBe(LESSONS.length)
    for (const competency of COURSE.competencies) {
      expect(COMPETENCY_BLURB[competency.id]?.length).toBeGreaterThan(40)
    }
    const inA = LESSONS.filter((lesson) => OBJECTIVES.find((objective) => objective.id === lesson.objectiveId)?.competency === 'A')
    const inB = LESSONS.filter((lesson) => OBJECTIVES.find((objective) => objective.id === lesson.objectiveId)?.competency === 'B')
    expect(inA.map((lesson) => lesson.objectiveId)).toEqual(['D335.01', 'D335.02', 'D335.03', 'D335.04', 'D335.05', 'D335.06', 'D335.07', 'D335.08', 'D335.09'])
    expect(inB.map((lesson) => lesson.objectiveId)).toEqual(['D335.10', 'D335.11'])
  })

  it('teaches each topic in original beginner language, with a few runnable examples', () => {
    expect(LESSONS_INTRO).toContain('Sound starts only when you press Listen')
    expect(LESSONS_INTRO.toLowerCase()).not.toContain('chapter')
    for (const lesson of LESSONS) {
      expect(lesson.slug).toMatch(/^[0-9]{2}-[a-z0-9-]+$/)
      expect(lesson.blurb.length).toBeGreaterThan(40)
      expect(lesson.sections.map((section) => section.id)).toEqual(['what', 'why', 'ideas', 'pitfalls'])
      expect(lesson.examples.length).toBeGreaterThanOrEqual(1)
      expect(lesson.examples.length).toBeLessThanOrEqual(3)
      const text = lessonSpeech(lesson)
      expect(text.length).toBeGreaterThan(1200)
      expect(text.toLowerCase()).not.toMatch(/zybook|zylab|wgud335|chapter/)
      const spoken = toSpokenText(text)
      expect(spoken.length).toBeGreaterThan(800)
      expect(spoken).not.toContain('`')
      expect(findLesson(lesson.slug)).toBe(lesson)
      expect(findLesson(lesson.objectiveId)).toBe(lesson)
      expect(practicePath(lesson.objectiveId)).toBe(`/quiz?o=${lesson.objectiveId}&n=5`)
    }
    expect(toSpokenText(lessonSpeech(findLesson('D335.01')!))).toContain('**')
    expect(toSpokenText(lessonSpeech(findLesson('D335.10')!))).toContain('__name__')
  })

  it('routes lesson urls and walks to the next topic', () => {
    expect(matchLessonPath('/lessons')).toBe('index')
    expect(matchLessonPath('/lessons/01-variables')?.toString()).not.toBe('missing')
    expect(matchLessonPath('/lessons/D335.04')).toMatchObject({ objectiveId: 'D335.04' })
    expect(matchLessonPath('/lessons/nope')).toBe('missing')
    expect(matchLessonPath('/guide')).toBeNull()
    const first = LESSONS[0]
    expect(lessonPath(first)).toBe('/lessons/01-variables')
    expect(lessonNeighbors(first).prev).toBeUndefined()
    expect(lessonNeighbors(first).next?.objectiveId).toBe('D335.02')
    expect(lessonNeighbors(LESSONS.at(-1)!).next).toBeUndefined()
    expect(lessonsIndexSpeech()).toContain('Scripts with control flow')
    expect(lessonsIndexSpeech()).toContain('Reuse and file I/O')
  })

  it('runs every example and prints the promised output', () => {
    for (const lesson of LESSONS) {
      for (const example of lesson.examples) {
        const dir = mkdtempSync(join(tmpdir(), 'rl-lesson-'))
        const got = execFileSync('python3', ['-c', example.code], { cwd: dir, encoding: 'utf8' })
        expect(got, `${lesson.objectiveId} ${example.title}`).toBe(example.prints)
      }
    }
  })
})
