import { COURSE, OBJECTIVES, objectiveById } from '../lib/bank'

export interface LessonExample {
  title: string
  /** What a beginner should notice, in plain sentences. */
  note: string
  code: string
  /** Exact stdout from running `code` as a program. */
  prints: string
}

export interface LessonSection {
  id: 'what' | 'why' | 'ideas' | 'pitfalls'
  title: string
  body: string
}

export interface Lesson {
  objectiveId: string
  slug: string
  /** One or two sentences on the lessons index. */
  blurb: string
  sections: LessonSection[]
  examples: LessonExample[]
}

const WHAT = 'What this topic is'
const WHY = 'Why it matters'
const IDEAS = 'The key ideas'
const PITFALLS = 'Common beginner pitfalls'

function sections(what: string, why: string, ideas: string, pitfalls: string): LessonSection[] {
  return [
    { id: 'what', title: WHAT, body: what },
    { id: 'why', title: WHY, body: why },
    { id: 'ideas', title: IDEAS, body: ideas },
    { id: 'pitfalls', title: PITFALLS, body: pitfalls },
  ]
}

/** Plain-language lines for the two groups already stored on the course. */
export const COMPETENCY_BLURB: Record<string, string> = {
  A: 'How a small program works: names for values, asking a person for text, choices, repetition, functions, text, lists, dictionaries, and what to do when Python reports an error.',
  B: 'How to borrow code that already exists, and how to save and load text files so the data is still there after the program stops.',
}

export const LESSONS_INTRO = `These are short lessons for someone who has never written a program.

Each lesson is one topic. Topics sit in two groups, called competencies. A competency is a big idea that several topics share. The first group is about writing a script. The second group is about reusing code and reading and writing files.

The numbers, such as 01 and 02, are labels inside Recall Lab. They keep the topics in a learning order. They are not page numbers from a textbook, and they are not an official course map.

Read one lesson. Press Listen if you want to hear it. Sound starts only when you press Listen. When the ideas feel familiar, practice that one topic.`

const RAW: Lesson[] = [
  {
    objectiveId: 'D335.01',
    slug: '01-variables',
    blurb: 'Give a value a name, then do math with it. This is the first tool every program uses.',
    sections: sections(
      `A variable is a name you stick on a value so you can use that value again. An expression is math Python can work out, like \`2 + 3\`. An operator is a symbol in that math, such as \`+\` or \`*\`.

You will see a line like \`score = 0\`. Read it as "the name score now holds 0." The \`=\` sign stores a value. It does not ask "are these the same?"`,
      `Almost every program remembers a number or a piece of text and then changes it. If you can name a value and do math with it, the later topics have somewhere to stand. Loops add to a total. Functions return a result. Those ideas start here.`,
      `A name may use letters, digits, and underscores. \`total_cost\` is a good name. A name cannot start with a digit, so \`2nd_place\` is not allowed. A name cannot be a reserved word such as \`class\`. Use a short name that says what the value is.

\`score = score + 1\` reads the old score, adds 1, and stores the new number back under the same name. \`score += 1\` is the short way to write that. \`-=\` subtracts, \`*=\` multiplies, and \`/=\` divides.

\`+\`, \`-\`, and \`*\` work like school math. \`**\` means "to the power of," so \`2 ** 3\` is 2 × 2 × 2, which is 8.

\`/\` always gives a decimal number, called a float. \`7 / 2\` is \`3.5\`, not 3.

\`//\` is floor division. It asks how many whole times the number fits, rounding down. \`7 // 2\` is 3. With a negative number, "down" means more negative, so \`-7 // 2\` is \`-4\`, not \`-3\`.

\`%\` is the remainder. \`17 % 5\` is 2, because 5 fits into 17 three times and 2 are left over.

Python does not always go left to right. Powers happen first, then multiplication and division (\`*\`, \`/\`, \`//\`, \`%\`), then addition and subtraction. Parentheses happen before any of that. \`2 + 3 * 4\` is 14, because the multiplication runs first. \`(2 + 3) * 4\` is 20.

A whole number is an int. A number with a decimal point is a float. \`3\` and \`3.0\` are the same amount, and they are different kinds of value.`,
      `**Storing versus comparing.** \`=\` stores a value. \`==\` asks whether two values are equal. You will use \`==\` in the decisions lesson.

**Hyphens are minus signs.** \`total-cost\` means "total minus cost." The name with a gap word is \`total_cost\`.

**True division.** In Python 3, \`7 / 2\` is \`3.5\`. Reach for \`//\` when you want the whole-number answer 3.

**Negative floor division.** \`-7 // 2\` rounds toward \`-4\`. The remainder operator follows the same floor rule.

**Order of operations.** \`2 + 3 * 4 ** 2\` is 50, not 400. The power runs first (16), then the multiplication (48), then the addition (50). When you are unsure, add parentheses.`,
    ),
    examples: [
      {
        title: 'Name a value, then change it',
        note: 'cookies starts at 12. `-=` subtracts 3 and stores the result. `+=` adds 1 and stores it. The printed number is 10.',
        code: `cookies = 12
cookies -= 3
cookies += 1
print(cookies)`,
        prints: '10\n',
      },
      {
        title: 'Four kinds of math',
        note: 'The first line is true division, so you get a decimal. The second is the whole-number quotient. The third is the remainder. The fourth is a power.',
        code: `print(7 / 2)
print(7 // 2)
print(17 % 5)
print(2 ** 3)`,
        prints: '3.5\n3\n2\n8\n',
      },
      {
        title: 'Parentheses change the order',
        note: 'Without parentheses, multiplication happens before addition, so the first line is 14. Parentheses force the addition to happen first, so the second line is 20.',
        code: `print(2 + 3 * 4)
print((2 + 3) * 4)`,
        prints: '14\n20\n',
      },
    ],
  },
  {
    objectiveId: 'D335.02',
    slug: '02-input-and-output',
    blurb: 'Show text on the screen, read what a person types, and turn that text into a number.',
    sections: sections(
      `Output is what the program shows. \`print\` does that. Input is what a person types. \`input\` waits for one line of typing and hands it to you as text.

That typed line is always text, even when the person typed digits. \`int\` turns digit text into a whole number. \`float\` turns it into a decimal number. \`str\` turns a number back into text.`,
      `A program that only uses numbers written in the file cannot ask anyone anything. Input and output are the conversation. Later, files are another way in and out. The same conversion skills apply there, because a file is also text until you convert it.`,
      `\`print("hi")\` shows hi and then moves to the next line.

\`print("Ada", "Lovelace")\` puts a space between the two parts. That space is the separator, and you can change it: \`print("Ada", "Lovelace", sep="-")\` shows \`Ada-Lovelace\`.

The text after the value is called the end. The usual end is a new line. \`print("hi", end="")\` stays on the same line. \`print("hi", end="!")\` shows \`hi!\` and does not move down.

\`input("Name: ")\` shows the prompt \`Name: \`, waits, and returns the text the person typed. The Enter key is not included in that text. The result is still a string. A string is a piece of text.

\`int("42")\` is the number 42. \`int("3.5")\` fails, because 3.5 is not a whole number. \`int("hello")\` fails, because those characters are not digits.

\`float("3.5")\` is 3.5. \`float("3")\` is 3.0.

\`str(3)\` is the text \`"3"\`.

An f-string drops a value into a sentence. The f sits right before the quote: \`name = "Ada"\` then \`f"Hello {name}"\` is the text \`Hello Ada\`. You can put a small calculation inside the braces: \`f"{2 + 2}"\` is the text \`4\`.

You cannot add text and a number with \`+\`. \`"score " + 5\` is an error. Use an f-string, or convert the number with \`str\` first.`,
      `**Forgetting to convert.** \`input\` returns text. \`"7" + "1"\` is the text \`71\`, not the number 8. Call \`int\` or \`float\` before you do math.

**The wrong converter.** \`int("3.5")\` crashes. Use \`float\` when a decimal is allowed.

**A missing f.** \`"Hello {name}"\` shows the braces and the word name. \`f"Hello {name}"\` shows the value. The f is what turns the braces into a slot.

**Adding text and a number.** \`"Age: " + 20\` crashes. \`"Age: " + str(20)\` works. An f-string also works: \`f"Age: {20}"\`.`,
    ),
    examples: [
      {
        title: 'Text stays text until you convert it',
        note: 'The characters 7 are text here, the way `input` would give them to you. `int` makes a number, and adding 1 then works. This program does not call `input`, so it can run on its own.',
        code: `typed = "7"
n = int(typed)
print(n + 1)`,
        prints: '8\n',
      },
      {
        title: 'The f on an f-string is required',
        note: 'The first two lines both show Hello Ada. The third line has no f, so Python prints the braces as ordinary characters.',
        code: `name = "Ada"
print("Hello", name)
print(f"Hello {name}")
print("Hello {name}")`,
        prints: 'Hello Ada\nHello Ada\nHello {name}\n',
      },
      {
        title: 'Joining text joins characters',
        note: '`str(3)` turns the number into text so `+` can join it. The second line joins two strings of digits, so you get 71, not 8.',
        code: `price = 3
print("Price: " + str(price))
print("7" + "1")`,
        prints: 'Price: 3\n71\n',
      },
    ],
  },
  {
    objectiveId: 'D335.03',
    slug: '03-decisions',
    blurb: 'Let the program choose a path with if, elif, and else, using true-or-false questions.',
    sections: sections(
      `A branch is a choice. \`if\` runs an indented block only when a condition is true. \`elif\` means "otherwise, try this next question." \`else\` runs when every question above it was false.

A condition is a true-or-false value. Those values are called Booleans. The two Boolean values are \`True\` and \`False\`. Capital letters matter.`,
      `Real tasks depend on the data. "If the score is high enough, say pass." Without a branch, every run of the program does the same steps. Decisions are how a script reacts.`,
      `Comparisons: \`==\` equal, \`!=\` not equal, \`<\` less than, \`>\` greater than, \`<=\` less than or equal, \`>=\` greater than or equal.

The line ends with a colon. The lines that belong to that choice are indented, usually four spaces. When the indent stops, the choice is over.

Python checks an \`if\` / \`elif\` / \`else\` chain from top to bottom and runs the first true branch. It skips the rest, even if a later condition would also have been true.

\`and\` is true only when both sides are true. \`or\` is true when at least one side is true. \`not\` flips a Boolean: \`not True\` is \`False\`.

You can chain a comparison: \`0 <= n <= 10\` means both \`0 <= n\` and \`n <= 10\`.

Some ordinary values count as false in an \`if\`: the number \`0\`, the decimal \`0.0\`, the empty text \`""\`, an empty list, and \`None\` (which means "no value"). Other numbers, and text that has characters, count as true. While you are learning, a direct comparison such as \`if count > 0\` is easier to read than \`if count\`.`,
      `**One equals sign.** \`if score = 70\` is a syntax error. Use \`==\` to compare.

**Missing colon or mixed indent.** The colon starts the block. Use spaces only, not a mix of tabs and spaces.

**Thinking every true line runs.** In a chain, the first true branch wins. Put the narrower test first. \`if score >= 70\` before \`elif score >= 90\` would mark a 95 as the 70 branch and never reach the 90 branch.

**and versus or.** \`age >= 18 and age <= 12\` can never be true. A person cannot be both. \`or\` would be true for almost every age, which is a different bug.

**Empty is false.** \`if name\` is false when name is \`""\`. If you meant "the name exists as a variable," that is a different question. The variable can exist and still hold empty text.`,
    ),
    examples: [
      {
        title: 'The first true branch wins',
        note: '72 is not at least 90, so the first branch is skipped. 72 is at least 70, so Python prints ok and does not look at else.',
        code: `score = 72
if score >= 90:
    print("high")
elif score >= 70:
    print("ok")
else:
    print("retry")`,
        prints: 'ok\n',
      },
      {
        title: 'Both sides of and must be true',
        note: 'The person is old enough and has a ticket, so both parts are true and the program prints enter.',
        code: `age = 20
has_ticket = True
if age >= 18 and has_ticket:
    print("enter")
else:
    print("wait")`,
        prints: 'enter\n',
      },
      {
        title: 'Empty text counts as false',
        note: 'name is an empty string, so the `if name` branch is skipped and Python prints blank. The number 3 is not zero, so the second test prints some.',
        code: `name = ""
if name:
    print("has a name")
else:
    print("blank")
count = 3
if count:
    print("some")`,
        prints: 'blank\nsome\n',
      },
    ],
  },
  {
    objectiveId: 'D335.04',
    slug: '04-loops',
    blurb: 'Repeat steps with for and while, skip a round with continue, or leave early with break.',
    sections: sections(
      `A loop repeats a block. \`for\` walks through a sequence, one item at a time. \`while\` repeats as long as a condition stays true.

\`break\` leaves the loop immediately. \`continue\` skips the rest of this round and starts the next one.`,
      `Copying the same lines ten times is how programs get long and wrong. A loop says "do this for each one" in a few lines. Totals, searches, and tables are all loops.`,
      `\`for n in range(5)\` gives n the values 0, 1, 2, 3, and 4. The stop number is not included. \`range(1, 6)\` is 1, 2, 3, 4, 5. \`range(0, 10, 2)\` is 0, 2, 4, 6, 8. The third number is the step.

\`for ch in "hi"\` visits \`h\`, then \`i\`. \`for\` works on any sequence, not only \`range\`.

An accumulator is a variable you update inside the loop. Start it before the loop: \`total = 0\`, then \`total = total + n\` on each round.

\`while\` needs a line inside the loop that eventually makes the condition false. \`n = n - 1\` is the usual idea. If nothing changes, the loop never ends.

\`break\` jumps out of the nearest loop. \`continue\` jumps to the next round of that same loop. In a \`while\`, put the update before \`continue\`, or the update may never run.

A nested loop is a loop inside a loop. The inner loop finishes all of its rounds before the outer loop takes one step. That is how you walk a grid: one loop for the row, one loop for the column.`,
      `**The stop value is excluded.** \`range(5)\` never gives you 5. If you wanted 1 through 5, write \`range(1, 6)\`.

**The accumulator starts over by accident.** If you set \`total = 0\` inside the loop, you erase the running total on every round. Set it once, above the loop.

**An endless while.** If the body never changes the value the condition uses, the program spins. Every \`while\` you write should have a step toward "false."

**continue before the update.** In a \`while\`, \`continue\` that sits above \`n = n + 1\` skips the update. The condition stays true forever.

**Inner loop versus outer loop.** \`break\` leaves only the inner loop. The outer loop keeps going.`,
    ),
    examples: [
      {
        title: 'Add the odd numbers, skip the evens',
        note: '`continue` skips the rest of the round when n is even. The accumulator keeps 1, then 3, then 5. The total is 9. `range(1, 6)` stops before 6.',
        code: `kept = 0
for n in range(1, 6):
    if n % 2 == 0:
        continue
    kept = kept + n
print(kept)`,
        prints: '9\n',
      },
      {
        title: 'Leave a while loop early',
        note: 'The loop would be willing to run while n is under 10. `break` leaves when n reaches 4, so 4 is not printed. The lines print 1, 2, and 3.',
        code: `n = 1
while n < 10:
    if n == 4:
        break
    print(n)
    n = n + 1`,
        prints: '1\n2\n3\n',
      },
      {
        title: 'A loop inside a loop',
        note: 'For row 0, the inner loop prints columns 0, 1, and 2. Then row becomes 1 and the inner loop runs again. Six lines, because 2 times 3 is 6.',
        code: `for row in range(2):
    for col in range(3):
        print(row, col)`,
        prints: '0 0\n0 1\n0 2\n1 0\n1 1\n1 2\n',
      },
    ],
  },
  {
    objectiveId: 'D335.05',
    slug: '05-functions',
    blurb: 'Name a recipe with def, pass values in, and send a result back with return.',
    sections: sections(
      `A function is a named recipe. \`def\` defines it. Writing the name with parentheses runs it. That run is a call.

Parameters are the names in the definition. Arguments are the values you pass in the call. \`return\` sends a value back to the caller and stops the function. \`print\` only shows text. It does not hand a value back.`,
      `Once a job has a name, you can do it many times without copying the lines. You can also check that one job on its own. The next topics, and real programs, are mostly functions calling other functions.`,
      `A definition looks like this: \`def add(a, b):\` and then an indented body. The call is \`add(2, 5)\`.

A default fills in a missing argument. \`def price(qty, each=3)\` lets you call \`price(4)\`, and \`each\` is 3. \`price(4, 10)\` uses 10 instead.

\`return\` stops the function. Lines after \`return\` in that same block do not run. The caller can store the result: \`n = add(2, 5)\`.

A function with no \`return\` gives back \`None\`. \`None\` means "no value." If you \`print\` inside the function and forget to \`return\`, the caller receives \`None\`. Showing text and handing back a value are different jobs.

A name you assign inside the function stays inside the function. That is local scope. \`answer = 5\` inside \`def\` does not create \`answer\` for the rest of the file.

If the function only reads a name and never assigns to it, Python looks outside the function. That outside name is global. Beginners get fewer surprises by passing values in through parameters and sending results out with \`return\`.

There is a \`global\` statement that lets a function assign to an outside name. You can ignore it until you mean to use it. Passing and returning is the clearer habit.`,
      `**Forgetting the parentheses.** \`add\` is the recipe itself. \`add(1, 2)\` cooks it. Printing \`add\` without a call shows a description of the function, not the sum.

**Printing when you meant to return.** The screen shows the number, and the caller still gets \`None\`. Math on that result fails, or quietly uses \`None\`.

**Expecting a local name to leak out.** After the call, the outside program does not have the variables from inside the function unless you returned them.

**A default list is shared.** A default like \`box=[]\` is created once, when the function is defined, not on every call. Each call that skips the argument reuses that same list, so old items are still there. Use \`box=None\` and create a fresh list inside the function when you need an empty one.`,
    ),
    examples: [
      {
        title: 'return hands a number back',
        note: 'The call add(2, 5) becomes 7, and print shows that 7. Without return, the caller would have nothing useful to print.',
        code: `def add(a, b):
    return a + b

print(add(2, 5))`,
        prints: '7\n',
      },
      {
        title: 'print is not return',
        note: 'shout prints HI as a side effect of the call. The name result receives None, because the function did not return a value. The second line prints that None.',
        code: `def shout(word):
    print(word.upper())

result = shout("hi")
print(result)`,
        prints: 'HI\nNone\n',
      },
      {
        title: 'A default list remembers old calls',
        note: 'The first call appends a and prints a one-item list. The second call uses the same default list, so b is added beside a. This is why a fresh list belongs inside the function, not in the default.',
        code: `def add_item(item, box=[]):
    box.append(item)
    return box

print(add_item("a"))
print(add_item("b"))`,
        prints: "['a']\n['a', 'b']\n",
      },
    ],
  },
  {
    objectiveId: 'D335.06',
    slug: '06-strings',
    blurb: 'Text is a row of characters. You can look at a piece of it, and you build a new string when you want a change.',
    sections: sections(
      `A string is text. It is a row of characters inside quotes. \`"hi"\` and \`'hi'\` are the same kind of value. \`"42"\` is text, not the number 42.

You can look at one character by its position, take a slice (a piece of the row), and call methods such as \`lower\` or \`replace\`. A method is a function that belongs to the value. You cannot change a string in place. Methods give you a new string.`,
      `Names, sentences, answers from \`input\`, and lines from a file are all strings. A lot of beginner Python is cleaning text: cutting spaces, changing case, and taking one part of a line.`,
      `Positions start at 0. \`"cat"[0]\` is \`c\`. \`"cat"[1]\` is \`a\`. A negative position counts from the end: \`"cat"[-1]\` is \`t\`.

A slice uses a start and a stop: \`"hello"[1:4]\` is \`ell\`. The start is included. The stop is not. Leave off the start to begin at 0. Leave off the stop to go to the end. \`len("hi")\` is 2.

\`+\` joins strings. \`"ab" + "c"\` is \`abc\`. \`*\` repeats a string: \`"ab" * 2\` is \`abab\`. You cannot \`+\` a string and a number.

Useful methods: \`upper\`, \`lower\`, \`strip\` (removes spaces and newlines at both ends), \`replace\`, \`split\`, \`find\`, \`startswith\`. \`word.upper()\` does not change \`word\`. It returns a new string. Save it if you want to keep it: \`word = word.strip()\`.

\`in\` asks whether a smaller string sits inside a bigger one. \`"py" in "python"\` is \`True\`.

Because strings cannot be edited in place, \`word[0] = "A"\` is an error. Build a new string instead: \`"A" + word[1:]\`.`,
      `**The stop index is not included.** \`"abcde"[1:4]\` is \`bcd\`, characters at positions 1, 2, and 3.

**Counting from 1.** The first character is index 0, not 1. The last character of a three-letter word is index 2, or \`-1\`.

**Methods feel like they should edit the text.** \`word.strip()\` on its own throws the new string away if you do not save it. The next line still sees the old \`word\`.

**Case matters.** \`"Hello" == "hello"\` is false. \`"Hello".lower() == "hello"\` is true.

**Text plus a number crashes.** \`"7" + 1\` is a TypeError. Convert with \`int\` or \`str\` first. That is the same rule as the input lesson, showing up again because so many values are strings.`,
    ),
    examples: [
      {
        title: 'strip and lower return a new string',
        note: 'clean is hello with the spaces gone and the letters lowered. word itself is unchanged, so the second print still shows the spaces.',
        code: `word = "  Hello  "
clean = word.strip().lower()
print(clean)
print(word)`,
        prints: 'hello\n  Hello  \n',
      },
      {
        title: 'Indexes and a slice',
        note: 'Position 0 is a. Position -1 is the last character, e. The slice from 1 up to but not including 4 is bcd.',
        code: `code = "abcde"
print(code[0])
print(code[-1])
print(code[1:4])`,
        prints: 'a\ne\nbcd\n',
      },
      {
        title: 'replace builds new text',
        note: 'replace returns bird,dog,bird. The `in` test prints True. msg itself still holds the original cat text, because the string was never edited in place.',
        code: `msg = "cat,dog,cat"
print(msg.replace("cat", "bird"))
print("dog" in msg)
print(msg)`,
        prints: 'bird,dog,bird\nTrue\ncat,dog,cat\n',
      },
    ],
  },
  {
    objectiveId: 'D335.07',
    slug: '07-lists-and-tuples',
    blurb: 'Hold many values in order. A list can grow and change. A tuple is a fixed group.',
    sections: sections(
      `A list is an ordered collection you can change: add, remove, and replace items. A tuple is an ordered collection you usually do not change. Both hold many values under one name.

You pick an item by its index, the same way you pick a character in a string. Index 0 is the first item.`,
      `One variable for one value runs out fast. A list can hold a class of scores, a shopping basket, or the lines of a file. A tuple fits a fixed record, such as a row and a column.`,
      `\`scores = [10, 20, 30]\` makes a list. \`scores[1]\` is 20. \`scores[1] = 25\` replaces that item. Lists are mutable, which means you can change them in place.

\`scores.append(40)\` adds at the end. \`scores.insert(0, 5)\` inserts at a position. \`scores.pop()\` removes the last item and gives it back. \`scores.remove(20)\` removes the first matching value.

A slice works and returns a new list: \`scores[0:2]\` is the first two items. The stop is still not included.

\`len(scores)\` is how many items. \`sum\`, \`min\`, and \`max\` work on a list of numbers.

\`for s in scores\` visits each item. \`for i, s in enumerate(scores)\` also gives you the index, starting at 0.

A comprehension builds a list in one expression: \`[n * 2 for n in range(3)]\` is \`[0, 2, 4]\`. A filter keeps some items: \`[n for n in range(6) if n % 2 == 0]\` is the even numbers in that range.

A tuple uses parentheses: \`point = (3, 4)\`. \`point[0]\` works. \`point[0] = 9\` fails. A one-item tuple needs a comma: \`(5,)\`. \`(5)\` is just the number 5 in parentheses.

\`alias = scores\` does not copy the list. Both names point at the same list. Changing one changes the other. \`scores.copy()\` or \`scores[:]\` makes a shallow copy. Shallow means the new list is separate, while items that are themselves lists are still shared.`,
      `**The last index is len - 1.** A list of 3 items uses indexes 0, 1, and 2. \`pets[3]\` raises IndexError.

**append returns None.** \`pets = pets.append("fish")\` replaces the list with \`None\`, and the next line crashes. Call \`pets.append("fish")\` on its own line. If you want a new list, write \`pets = pets + ["fish"]\`.

**Two names, one list.** After \`alias = scores\`, \`alias.append(1)\` also changes \`scores\`. Copy when you mean to have two lists.

**The filter sits at the end.** \`[n for n in nums if n > 1]\` is the shape Python accepts. The \`if\` does not go in front of the \`for\`.

**A comma makes a tuple.** \`(5)\` is a number. \`(5,)\` is a tuple. Forgetting the comma matters when a function expects a tuple.`,
    ),
    examples: [
      {
        title: 'append grows the list',
        note: 'The list starts with two names. append adds fish at the end. Index 0 is still cat. len is 3.',
        code: `pets = ["cat", "dog"]
pets.append("fish")
print(pets[0])
print(len(pets))`,
        prints: 'cat\n3\n',
      },
      {
        title: 'Build a new list with a comprehension',
        note: 'The comprehension keeps numbers greater than 1, then doubles them. 1 is dropped. 2, 3, and 4 become 4, 6, and 8.',
        code: `nums = [1, 2, 3, 4]
doubled = [n * 2 for n in nums if n > 1]
print(doubled)`,
        prints: '[4, 6, 8]\n',
      },
      {
        title: 'A tuple index, and two names for one list',
        note: 'spot[1] is 5. same and scores are one list, so appending 9 through same shows up when you print scores.',
        code: `spot = (2, 5)
print(spot[1])
scores = [1, 2]
same = scores
same.append(9)
print(scores)`,
        prints: '5\n[1, 2, 9]\n',
      },
    ],
  },
  {
    objectiveId: 'D335.08',
    slug: '08-dictionaries-and-sets',
    blurb: 'Look values up by a key, and use a set when you only care about unique items.',
    sections: sections(
      `A dictionary stores pairs: a key and a value. You look up the value by the key, not by a position. A phone contact works this way. The name is the key. The number is the value.

A set stores unique values. Duplicates disappear. You use a set when you care whether something is present, or when you want to drop repeats.`,
      `Two parallel lists, one of names and one of scores, fall out of sync the moment you insert a row. A dictionary keeps each name with its score. A set answers "have I already seen this?" without a loop you have to write yourself.`,
      `\`ages = {"Ada": 36, "Bo": 20}\` makes a dictionary. \`ages["Ada"]\` is 36. \`ages["Cy"] = 41\` adds a pair, or replaces the value if that key was already there.

A missing key with square brackets raises KeyError. \`ages.get("Cy")\` returns \`None\` instead. \`ages.get("Cy", 0)\` returns 0 when the key is missing, and returns the stored value when the key is there.

\`in\` checks keys, not values. \`"Ada" in ages\` is \`True\`. \`36 in ages\` is \`False\`, unless 36 is also a key.

\`for name in ages\` visits keys. \`for name, age in ages.items()\` gives you both. \`ages.values()\` visits values. A dictionary remembers the order you inserted the pairs.

Keys should be values that cannot change: strings, numbers, or tuples of those. A list cannot be a key.

\`seen = {"cat", "dog", "cat"}\` is a set of two strings, because a set keeps each value once. Do not rely on the order of a set. \`seen.add("fish")\` adds one item. \`"cat" in seen\` tests membership.

\`set([1, 1, 2])\` is a set of 1 and 2. An empty set is \`set()\`. \`{}\` is an empty dictionary, not an empty set.`,
      `**Square brackets on a missing key.** \`ages["Cy"]\` crashes when Cy was never stored. Use \`.get\` when the key might be absent.

**in checks keys.** To ask whether a value is stored, use \`value in ages.values()\`. \`in\` on the dictionary itself is a key test.

**Printing a set to see its order.** The order can differ from the order you typed, and it is not a promise. If order matters, use a list. If you need unique items and a stable order, build a list and skip items you have already put in a set.

**{} is a dictionary.** \`labels = {}\` then \`labels.add("a")\` fails, because a dictionary has no \`add\`. \`labels = set()\` is the empty set.

**A list as a key.** \`{[1, 2]: "no"}\` raises TypeError. Use a tuple key, \`(1, 2)\`, when you need a compound key.`,
    ),
    examples: [
      {
        title: 'get is the safe lookup',
        note: 'Bo is stored, so square brackets return 20. Cy is missing, so get returns the fallback 0 instead of crashing.',
        code: `ages = {"Ada": 36}
ages["Bo"] = 20
print(ages.get("Cy", 0))
print(ages["Bo"])`,
        prints: '0\n20\n',
      },
      {
        title: 'Loop over keys and values',
        note: 'items gives each pair. Insertion order is Ada, then Bo, so the lines come out in that order.',
        code: `ages = {"Ada": 36, "Bo": 20}
for name, age in ages.items():
    print(name, age)`,
        prints: 'Ada 36\nBo 20\n',
      },
      {
        title: 'A set drops duplicates',
        note: 'The list has a twice. The set has two members, so len is 2. Membership of a is True. The program does not print the set itself, because set order is not the lesson.',
        code: `tags = ["a", "b", "a"]
unique = set(tags)
print(len(unique))
print("a" in unique)`,
        prints: '2\nTrue\n',
      },
    ],
  },
  {
    objectiveId: 'D335.09',
    slug: '09-errors',
    blurb: 'Read the error report, then catch the errors you expect with try and except.',
    sections: sections(
      `When Python cannot finish a step, it stops and prints a traceback. That report names the error and the line. The error itself is an exception, which is a value you can catch.

\`try\` marks lines that might fail. \`except\` is what to do for one kind of error. \`else\` runs when the \`try\` block did not fail. \`finally\` runs either way. \`raise\` is how your code reports an error on purpose.`,
      `Beginners meet crashes every day. Reading the traceback is the skill that unsticks you. Catching one expected error lets a program ask again, for example when someone types letters where \`int\` needs digits.`,
      `Read a traceback from the bottom. The last line is the error type and the message. Above that, Python lists the file and the line number. Start there. Fix that line, or the value that reached it.

Names you will see often:

\`SyntaxError\` means the file is not valid Python, often a missing colon, quote, or parenthesis. Python reports this before the program really runs.

\`NameError\` means you used a name you never assigned.

\`TypeError\` means the operation does not fit the types, such as \`"a" + 1\`.

\`ValueError\` means the type is right and the value is not, such as \`int("hi")\`.

\`IndexError\` means a list or string index is out of range. \`KeyError\` means a dictionary key is missing. \`ZeroDivisionError\` means you divided by zero. \`FileNotFoundError\` means a file you tried to read is not there.

\`except ValueError:\` catches only that type. A bare \`except:\` catches everything, including typos you would rather see. Prefer a specific type.

\`else\` on a \`try\` runs only when no exception happened. \`finally\` runs when it failed, when it succeeded, and even when you return. People use \`finally\` for cleanup. For files, the \`with\` statement in the files lesson is usually the better tool.

\`raise ValueError("need a positive number")\` creates that error. The caller can catch it, or let it stop the program.

A useful debugging loop: read the line number, print the values just above the crash, change one thing, and run again.`,
      `**A syntax error is not caught by the try in that same file.** If a colon is missing, Python cannot start the file. Fix the typing. \`try\` helps with errors that happen while the program is running.

**Catching too much.** \`except:\` or \`except Exception:\` can hide a bug in a different line. Catch the error you know how to handle.

**A giant try block.** If twenty lines sit in one \`try\`, the \`except\` cannot tell you which line failed. Keep the \`try\` around the risky call, such as \`int(...)\`.

**The wrong type name.** \`except ValueError\` does not catch \`TypeError\`. They are different. Read the last line of the traceback and catch that type.

**Code below a crash does not run.** If you do not catch the error, lines after the crash in that function are skipped. That is why a missing \`return\` sometimes looks like "Python ignored my print." The print was never reached.`,
    ),
    examples: [
      {
        title: 'Catch a bad conversion',
        note: 'int("hi") would raise ValueError. The except block sets n to 0 instead, and the program prints 0 and keeps going.',
        code: `try:
    n = int("hi")
except ValueError:
    n = 0
print(n)`,
        prints: '0\n',
      },
      {
        title: 'else and finally',
        note: '10 / 2 succeeds, so except is skipped, else prints worked, and finally prints done. If you changed the divisor to 0, you would see nope and then done. finally still runs.',
        code: `try:
    print(10 / 2)
except ZeroDivisionError:
    print("nope")
else:
    print("worked")
finally:
    print("done")`,
        prints: '5.0\nworked\ndone\n',
      },
      {
        title: 'raise your own error',
        note: 'positive(-3) raises ValueError, the except prints not positive, and the function stops before the return. positive(4) returns 4, which is printed.',
        code: `def positive(n):
    if n <= 0:
        raise ValueError("need a positive number")
    return n

try:
    print(positive(-3))
except ValueError:
    print("not positive")
print(positive(4))`,
        prints: 'not positive\n4\n',
      },
    ],
  },
  {
    objectiveId: 'D335.10',
    slug: '10-modules',
    blurb: 'Load a file of ready-made functions with import, including tools that ship with Python.',
    sections: sections(
      `A module is a Python file you can load. \`import math\` loads the math module. You then use names that live on it, such as \`math.sqrt(9)\`.

The standard library is the set of modules that come with Python. You do not have to write square root, random integers, or today's date yourself.

\`if __name__ == "__main__":\` runs demo code only when you start that file directly, not when another file imports it.`,
      `Reuse is the other half of programming. A function in a module can serve many programs. The standard library is code that many people already tested, so your script stays short.`,
      `\`import math\` then \`math.sqrt(16)\`. The module name stays in front, which makes it obvious where \`sqrt\` came from.

\`import math as m\` gives the module a shorter name. You then write \`m.sqrt(16)\`.

\`from math import sqrt\` copies the name \`sqrt\` into your file. You call \`sqrt(16)\`. You do not also get the name \`math\` unless you imported it too.

\`import random\` gives you \`random.randint(1, 6)\`, which includes both ends. That is different from \`range(1, 6)\`, which stops before 6. \`random.choice(items)\` picks one item from a sequence.

Dates live in \`datetime\`. A small, clear import is \`from datetime import date\` and then \`date.today()\`.

The \`string\` module holds bags of characters such as \`string.ascii_lowercase\` and \`string.digits\`. Ordinary jobs like \`lower\` and \`strip\` are methods on the string itself. You do not import \`string\` for those.

Your own file works the same way. If \`helpers.py\` defines \`def area(r):\`, a neighbor file can \`import helpers\` and call \`helpers.area(3)\`, as long as both files are on Python's search path. The same folder is the usual case for a beginner.

Every module has a name in \`__name__\`. When you run a file directly, Python sets that to \`"__main__"\`. When another file imports it, \`__name__\` is the module's file name, such as \`"helpers"\`. Put sample prints under \`if __name__ == "__main__":\` so importing the file does not print them.`,
      `**import math does not create sqrt by itself.** After \`import math\`, the call is \`math.sqrt(9)\`. \`sqrt(9)\` is a NameError unless you used \`from math import sqrt\`.

**Star imports.** \`from math import *\` dumps many names into your file. A later name can quietly hide an earlier one. Import the few names you use.

**Naming your file random.py.** If your program is named \`random.py\`, \`import random\` may load your file instead of the standard library. Name your file after its job, not after a module you want to import.

**randint versus range.** \`random.randint(1, 6)\` can be 6. \`range(1, 6)\` never yields 6. The stop rules differ.

**Demo code at the top level.** A \`print\` that sits outside a function runs on import. Tuck demos under the \`__name__\` test, or call a \`main\` function from there.`,
    ),
    examples: [
      {
        title: 'Use the math module',
        note: 'sqrt(9) is 3.0, a float. floor cuts 3.7 down to the whole number 3. Both names are reached through the math prefix.',
        code: `import math
print(math.sqrt(9))
print(math.floor(3.7))`,
        prints: '3.0\n3\n',
      },
      {
        title: 'A random call with one possible result',
        note: 'randint includes both ends. When both ends are 1, the only possible result is 1, so this example is steady enough to read.',
        code: `from random import randint
print(randint(1, 1))`,
        prints: '1\n',
      },
      {
        title: 'Demo code runs only as the main file',
        note: 'Running this file directly sets __name__ to __main__, so it prints the area of a circle with radius 1, rounded to two decimals. If another file imported this one, that print would not run, and area would still be available to call.',
        code: `import math

def area(r):
    return math.pi * r * r

if __name__ == "__main__":
    print(round(area(1), 2))`,
        prints: '3.14\n',
      },
    ],
  },
  {
    objectiveId: 'D335.11',
    slug: '11-files',
    blurb: 'Open a text file, read or write lines, let with close it, and split a simple comma-separated row.',
    sections: sections(
      `A file is data stored outside the running program, so it is still there after the program stops. You open it, read or write text, and close it.

The \`with\` statement closes the file for you, including when an error happens in the middle. CSV-style data, for this lesson, means text with commas between fields and one record on each line.`,
      `Variables disappear when the program ends. Files are how a script remembers, and how it takes a list of records from outside. The string and error lessons meet here: a line is a string, and a missing file is an exception.`,
      `\`open(path, mode)\` opens a file. \`"r"\` reads text. It is the default. \`"w"\` writes text, creates the file if needed, and erases it if it already exists. \`"a"\` appends, adding to the end without erasing. \`"x"\` creates a new file and fails if that name already exists.

\`read()\` returns the whole file as one string, newlines included. \`readline()\` returns one line. Looping \`for line in f\` walks a line at a time and is the usual choice for a long file.

Each line usually ends with a newline character, written \`\\n\`. \`line.strip()\` removes that and any spaces at the ends. Comparing \`line == "Ada"\` fails when \`line\` is \`"Ada\\n"\`. Strip first, or compare against the newline too.

\`write(text)\` does not add a newline unless you put \`\\n\` in the text. \`print("hi", file=f)\` writes a line and adds the newline for you.

\`with open("notes.txt", "w") as f:\` assigns the open file to \`f\` and closes it when the block ends, even if a line inside raises.

A path like \`"notes.txt"\` means "in the folder where you started Python," unless you wrote a fuller path. Reading a file that is not there raises \`FileNotFoundError\`.

A simple row \`Ada,36\` becomes two fields with \`split(",")\`. Then convert the number field with \`int\`. This pattern fits rows that do not contain commas inside a field. The standard library has a \`csv\` module for quoted commas and similar wrinkles. Split is enough to see what a row is.`,
      `**"w" erases.** Opening with \`"w"\` throws away the old contents as soon as the file opens. Use \`"a"\` to add. Use \`"r"\` to read.

**A missing newline.** Two \`write\` calls without \`\\n\` glue the text into one line. Put the newline in the string, or use \`print(..., file=f)\`.

**Forgetting to strip.** The file can contain \`Ada\\n\`. A later test for equality with \`Ada\` fails, and some splits keep the newline on the last field.

**Leaving the file open.** If you \`open\` without \`with\`, you are responsible for \`close()\`. An error before \`close()\` can skip it. \`with\` is the habit to keep.

**split on a fancy row.** If a name itself contains a comma, \`split(",")\` cuts the name in half and you get too many fields. Use simple rows here. The \`csv\` module is the tool when a field itself contains a comma.

**The wrong mode.** Reading from a file you opened with \`"w"\` raises an error. Pick the mode that matches the job.`,
    ),
    examples: [
      {
        title: 'Write two lines, then read them back',
        note: 'with closes the file at the end of each block. strip removes the newline that write stored, so the printed words have no extra blank gap. This creates note.txt in the folder where the program runs.',
        code: `with open("note.txt", "w") as f:
    f.write("hello\\n")
    f.write("again\\n")

with open("note.txt", "r") as f:
    for line in f:
        print(line.strip())`,
        prints: 'hello\nagain\n',
      },
      {
        title: 'A simple comma-separated row',
        note: 'split breaks the row on each comma. The age is still text, so int converts it before the addition. The printed line is Ada 37.',
        code: `row = "Ada,36"
name, age_text = row.split(",")
print(name, int(age_text) + 1)`,
        prints: 'Ada 37\n',
      },
      {
        title: 'A missing file is an exception',
        note: 'Opening a file that is not there raises FileNotFoundError. The except block supplies empty text instead, and the program prints the word empty.',
        code: `try:
    with open("missing.txt", "r") as f:
        text = f.read()
except FileNotFoundError:
    text = ""
print("empty" if text == "" else text)`,
        prints: 'empty\n',
      },
    ],
  },
]

const rawById = new Map(RAW.map((lesson) => [lesson.objectiveId, lesson]))

/** Bank order, which is the learning order shown everywhere else in the app. */
export const LESSONS: Lesson[] = OBJECTIVES.map((objective) => {
  const lesson = rawById.get(objective.id)
  if (!lesson) throw new Error(`Missing lesson for ${objective.id}`)
  return lesson
})

const bySlug = new Map(LESSONS.map((lesson) => [lesson.slug, lesson]))

export function findLesson(key: string): Lesson | undefined {
  return bySlug.get(key) ?? rawById.get(key)
}

export function lessonPath(lesson: Lesson): string {
  return `/lessons/${lesson.slug}`
}

/** Practice quiz filtered to one objective. The quiz page already reads \`o\` and \`n\`. */
export function practicePath(objectiveId: string, count = 5): string {
  return `/quiz?o=${encodeURIComponent(objectiveId)}&n=${count}`
}

export function lessonNeighbors(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const index = LESSONS.findIndex((item) => item.objectiveId === lesson.objectiveId)
  return {
    prev: index > 0 ? LESSONS[index - 1] : undefined,
    next: index >= 0 && index < LESSONS.length - 1 ? LESSONS[index + 1] : undefined,
  }
}

export function sectionSpeech(section: LessonSection): string {
  return `${section.title}. ${section.body}`
}

export function examplesSpeech(lesson: Lesson): string {
  const bits = ['Tiny examples.']
  for (const example of lesson.examples) {
    bits.push(`${example.title}. ${example.note} The program is: ${example.code} It prints: ${example.prints}`)
  }
  return bits.join('\n\n')
}

export function lessonSpeech(lesson: Lesson): string {
  const objective = objectiveById.get(lesson.objectiveId)
  const title = objective ? `${objective.code}. ${objective.title}.` : lesson.objectiveId
  return [title, lesson.blurb, ...lesson.sections.map(sectionSpeech), examplesSpeech(lesson)].join('\n\n')
}

export function lessonsIndexSpeech(): string {
  const parts = [LESSONS_INTRO, COURSE.note]
  for (const competency of COURSE.competencies) {
    parts.push(`Competency ${competency.id}. ${competency.title}. ${COMPETENCY_BLURB[competency.id] ?? competency.summary}`)
    for (const lesson of LESSONS) {
      const objective = objectiveById.get(lesson.objectiveId)
      if (objective?.competency !== competency.id) continue
      parts.push(`${objective.code}. ${objective.title}. ${lesson.blurb}`)
    }
  }
  return parts.join('\n\n')
}

export function matchLessonPath(path: string): Lesson | 'index' | 'missing' | null {
  if (path === '/lessons') return 'index'
  if (!path.startsWith('/lessons/')) return null
  let key = path.slice('/lessons/'.length)
  try {
    key = decodeURIComponent(key)
  } catch {
    return 'missing'
  }
  if (!key || key.includes('/')) return 'missing'
  return findLesson(key) ?? 'missing'
}
