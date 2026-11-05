export interface GuideSection {
  id: string
  title: string
  body: string
}

/** Beginner copy for /guide. Spoken text is this same wording, with markup stripped. */
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'what',
    title: 'What this app is',
    body: `Recall Lab is a practice app for a beginner Python course (WGU D335, Introduction to Programming in Python).

You answer short questions. After each one, the app tells you if you were right and explains the idea in plain language. When a question needs Python, your code runs inside the browser. You see what Python actually does.

You do not need to know any Python before you start. Each question teaches one small idea.

Recall Lab is an independent study tool. It is not made by WGU or zyBooks, and it is not the official exam.`,
  },
  {
    id: 'start',
    title: 'Guest demo or a free account',
    body: `You can start in two ways.

**Guest demo.** On the home page, press "Try the demo". You can practice right away. No email. Guest progress is deleted after about a day. Use this when you only want to look around.

**Free account.** Press "Create an account". Your answers, your review schedule, and your practice-exam scores are saved, so you can stop and come back another day.

If this copy of the app has accounts turned off, your progress stays in this browser instead. That is still enough to study.

Signing in from a guest session does not copy the guest answers into the account. The account starts fresh.`,
  },
  {
    id: 'rooms',
    title: 'Dashboard, Practice, Review, and Mock OA',
    body: `Once you are in, the top of the screen has four rooms.

**Dashboard.** This is your map. It shows which topics you have practiced and which ones need work. The big percent is a study signal for you. It is not an official exam score.

**Practice.** This is where you learn. You choose topics and question types, then answer a short set. You see the right answer after every question.

**Review.** This is the memory workout. The app brings back questions it thinks you might forget. If the number is zero, nothing is waiting today. That is normal when you are new.

**Mock OA.** OA means objective assessment: the timed exam at the end of the course. "Mock" means a practice version of that feeling. It is timed, and you do not see right or wrong until you submit. It is not the real exam, and it does not predict your official score.`,
  },
  {
    id: 'types',
    title: 'The four kinds of questions',
    body: `Every question is one of these four. You can mix them, or practice one kind until it feels familiar.

**Multiple choice.** Pick the one best answer. Read every choice. Some choices are traps that look almost right.

**Predict the output.** A small program is on the screen. You type exactly what it prints. Spaces and line breaks count. If you are new, read each line out loud before you type.

**Find the bug.** The program is supposed to do a job, but one line is wrong. Click that broken line. You are not asked to rewrite the whole program.

**Write the code.** You get a job in words, plus an example of what goes in and what should print. You type a Python program. "Run examples" tries only the samples you can see. "Check answer" also runs hidden tests you cannot see. Hidden tests stop a program that only works for the one example on the screen.`,
  },
  {
    id: 'grading',
    title: 'How grading works',
    body: `**Multiple choice** is right or wrong. After you check, the correct choice is marked.

**Predict the output** is compared with what Python really prints. It has to match. Spaces at the very end of a line are ignored. If only the spacing in the middle is off, you may see partial credit. A wrong word or a missing line is not correct.

**Find the bug** is correct when you click the line that causes the problem. The explanation then shows a repaired version of that line, and what the broken program did versus the fixed one.

**Write the code** runs your program on several inputs. A table shows what went in, what should print, and what your program printed. You do not have to match a sample solution word for word. Any program that prints the right answers passes.

Your program is not sent to a server to be graded. A copy of Python loads inside the browser the first time you need it. That first load can take a few seconds.`,
  },
  {
    id: 'srs',
    title: 'Spaced repetition, in plain English',
    body: `Spaced repetition is a review schedule. It is not a new kind of question.

When you miss a question, it comes back soon, often within minutes, while the idea is still fresh.

When you get a question right, the app waits longer before it shows that question again. First days, then weeks.

The Review room lists what is due now. **Due** means "it is time to see this again so you do not forget it." It does not mean you failed.

You do not manage the schedule yourself. Answer honestly, then open Review when the badge shows a number.`,
  },
  {
    id: 'ai',
    title: 'Optional extras, and what works without them',
    body: `Some copies of the app offer an AI hint, an AI note about a wrong answer, and one extra question written by AI. Those are optional. They use a free daily limit. When the limit runs out, they stop. Everything else keeps working.

You can study the whole course with the built-in questions, the explanations, the grader, Review, and the mock exam. You never have to use AI.

**Listen** buttons are optional too. They use your browser's own voice. There is no account and no fee, and no paid voice service. How human it sounds depends on this phone or computer. Some devices only have a robotic voice. Next to Listen you can pick another English voice that is already installed, and a slower or faster speed. That list cannot add a voice the device does not have. Sound never starts by itself. Press Listen when you want to hear something. Press Stop when you have heard enough. If your browser cannot speak, the button stays off and the text is still there to read.`,
  },
  {
    id: 'lessons',
    title: 'Lessons before you practice',
    body: `Lessons are short walkthroughs, one per topic, written here in plain language for a first-time programmer.

They follow the same two groups as the rest of Recall Lab.

**Scripts with control flow.** Names and math, input and output, decisions, loops, functions, text, lists, dictionaries, and errors.

**Reuse and file I/O.** Using modules that already exist, and reading and writing files.

Open Lessons from the home page, the top of the screen, or the footer. Pick a topic. Read it, or press Listen if you want it read aloud. Sound does not start by itself.

At the bottom of a lesson, press "Practice this topic". That starts a short quiz on only that topic. The lesson is the explanation. Practice is the questions.

These lessons are Recall Lab's own words. They are not a textbook, and they are not official course material.`,
  },
  {
    id: 'first',
    title: 'A calm first session',
    body: `1. Read this guide once. Press Listen on any section if you would rather hear it.

2. Start the guest demo, or create an account if you want to keep your work.

3. Optional: open Lessons and read the first topic, variables. Press Listen on a section if you would rather hear it.

4. Open Practice. Leave the topics on Mixed. Leave the question types on all of them. Choose 5 questions. Or use the practice button at the bottom of a lesson to quiz only that topic.

5. Answer slowly. After each one, read the explanation. Press Listen on the explanation if you want it read aloud.

6. When you miss something, do not rush past it. That idea will come back in Review.

7. Try a Mock OA only after a few practice sets, when you want to feel a timer. You can submit early. Unanswered questions count as not correct.

That is the whole app. You are allowed to be a beginner here.`,
  },
]

export function guidePlainText(sections: GuideSection[] = GUIDE_SECTIONS): string {
  return sections.map((s) => `${s.title}\n\n${s.body}`).join('\n\n')
}
