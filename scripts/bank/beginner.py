"""Rewrite bank explanations for a reader who has never seen the idea.

build.py calls expand_all() after the questions are authored. Answers, prompts,
tests and difficulty are left alone. The original sentence is kept as the
"one-line version" and a step-by-step walkthrough is added around it.
"""
import os
import sys
import tempfile
import warnings

_SKIP_NAMES = {"print", "input"}


def _show(value):
    if callable(value) and not isinstance(value, type):
        name = getattr(value, "__name__", "") or "function"
        if name == "<lambda>":
            return "a small function"
        return f"a function named {name}"
    if isinstance(value, set):
        return "{" + ", ".join(sorted(repr(x) for x in value)) + "}"
    if isinstance(value, frozenset):
        return "frozenset({" + ", ".join(sorted(repr(x) for x in value)) + "})"
    try:
        text = repr(value)
    except Exception:
        return None
    if " at 0x" in text or text.startswith("<"):
        return None
    if len(text) > 90:
        text = text[:87] + "..."
    return text


def _snap(locals_):
    out = {}
    for key, value in locals_.items():
        if key.startswith("_") or key in _SKIP_NAMES:
            continue
        shown = _show(value)
        if shown is None:
            continue
        out[key] = shown
    return out


def _diff(before, after):
    notes = []
    for key, value in after.items():
        if key not in before:
            notes.append(f"`{key}` now holds {value}")
        elif before[key] != value:
            notes.append(f"`{key}` changes from {before[key]} to {value}")
    return notes


def trace_program(code, stdin="", files=None, limit=36):
    """Run code and return a list of finished line steps. None if it will not compile."""
    lines = code.splitlines()
    stdin_lines = iter((stdin or "").splitlines(keepends=False))
    steps = []
    open_step = {}
    stack = []
    overflow = {"hit": False}
    seen = {"n": 0}
    printed = []

    def user_print(*args, sep=" ", end="\n", file=None, flush=False):
        text = sep.join(str(a) for a in args) + ("" if end is None else end)
        printed.append(text)
        if stack:
            step = open_step.get(id(stack[-1]))
            if step is not None:
                step["prints"].append(text)

    def user_input(prompt=""):
        try:
            return next(stdin_lines)
        except StopIteration as exc:
            raise EOFError("EOF when reading a line") from exc

    def close(frame):
        step = open_step.pop(id(frame), None)
        if not step:
            return
        after = _snap(frame.f_locals)
        step["diff"] = _diff(step["before"], after)
        parent = None
        seen_self = False
        for outer in reversed(stack):
            if outer is frame:
                seen_self = True
                continue
            if not seen_self:
                continue
            candidate = open_step.get(id(outer))
            if candidate:
                parent = candidate
                break
        if parent is not None:
            parent.setdefault("nested", []).append(step)
        else:
            steps.append(step)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<recall>":
            return tracer
        seen["n"] += 1
        if seen["n"] > 800:
            overflow["hit"] = True
            raise RuntimeError("trace limit")
        if event == "call":
            stack.append(frame)
            return tracer
        if event == "line":
            if id(frame) in open_step:
                close(frame)
            if len(steps) >= limit:
                overflow["hit"] = True
                open_step[id(frame)] = None
                return tracer
            lineno = frame.f_lineno
            text = lines[lineno - 1].rstrip() if 1 <= lineno <= len(lines) else ""
            open_step[id(frame)] = {
                "lineno": lineno,
                "text": text,
                "before": _snap(frame.f_locals),
                "prints": [],
            }
            return tracer
        if event == "return":
            if id(frame) in open_step and open_step[id(frame)] is not None:
                close(frame)
            else:
                open_step.pop(id(frame), None)
            if stack and stack[-1] is frame:
                stack.pop()
        return tracer

    ns = {"__name__": "__main__", "print": user_print, "input": user_input}
    error = None
    old = os.getcwd()
    try:
        with tempfile.TemporaryDirectory() as folder:
            for name, body in (files or {}).items():
                with open(os.path.join(folder, name), "w") as handle:
                    handle.write(body)
            os.chdir(folder)
            try:
                compiled = compile(code, "<recall>", "exec")
            except SyntaxError as exc:
                return {"steps": [], "error": "SyntaxError", "overflow": False, "detail": str(exc)}
            sys.settrace(tracer)
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", RuntimeWarning)
                    warnings.simplefilter("ignore", ResourceWarning)
                    exec(compiled, ns, ns)
            except RuntimeError as exc:
                if str(exc) != "trace limit":
                    error = "RuntimeError"
            except Exception as exc:
                error = type(exc).__name__
            finally:
                sys.settrace(None)
                for frame in list(stack):
                    if id(frame) in open_step and open_step[id(frame)] is not None:
                        close(frame)
    finally:
        os.chdir(old)
    return {"steps": steps, "error": error, "overflow": overflow["hit"], "printed": "".join(printed)}


def _describe_print(chunks):
    text = "".join(chunks)
    if text == "":
        return "This line prints nothing."
    newline = text.endswith("\n")
    body = text[:-1] if newline else text
    space = ""
    if body.endswith(" "):
        space = " It leaves a space at the end."
        body = body.rstrip(" ")
    shown = body if body != "" else "(only a space)"
    if newline:
        return f"This line prints `{shown}` and then starts a new line.{space}"
    return f"This line prints `{shown}` and stays on the same line.{space}"


def _empty_with(step, seen):
    text = step["text"].strip()
    if not text.startswith("with "):
        return None
    if step["diff"] or step["prints"] or step.get("nested"):
        return None
    key = (step["lineno"], text)
    seen[key] = seen.get(key, 0) + 1
    if seen[key] == 1:
        return f"Line {step['lineno']}: `{text}` Python opens the file and runs the indented lines. The file is closed for you when the block ends."
    return f"Line {step['lineno']}: the `with` block ends, and Python closes the file for you."


def _flow_note(step, nxt):
    text = step["text"].strip()
    head = text.split(" ", 1)[0]
    if head not in {"if", "elif", "else:", "else", "while", "for", "return"} and not text.startswith("else"):
        return ""
    if nxt is None:
        if head == "return":
            return "This hands a value back to the line that called the function, and the function stops."
        return ""
    indented = len(step["text"]) - len(step["text"].lstrip())
    next_indent = len(nxt["text"]) - len(nxt["text"].lstrip())
    enters = nxt["lineno"] > step["lineno"] and next_indent > indented
    if head == "for":
        return "Python goes into the loop body." if enters else "The loop is finished, so Python moves on."
    if head == "while":
        return "The condition is true, so Python runs the indented lines." if enters else "The condition is false, so the loop stops."
    if head in {"if", "elif"}:
        return "This check is true, so Python runs the indented lines under it." if enters else "This check is false, so Python skips the indented lines under it."
    if text.startswith("else"):
        return "None of the earlier checks were true, so Python runs this backup plan." if enters else ""
    if head == "return":
        return "This hands a value back and leaves the function immediately."
    return ""


def _narrate_one(step, nxt):
    code = step["text"].strip() or "(blank)"
    bits = [f"Line {step['lineno']}: `{code}`"]
    if step["prints"]:
        bits.append(_describe_print(step["prints"]))
    if step["diff"]:
        bits.append("; ".join(step["diff"]) + ".")
    else:
        flow = _flow_note(step, nxt)
        if flow:
            bits.append(flow)
        elif not step["prints"]:
            bits.append("Python runs this line, then moves to the next one that should run.")
    return " ".join(bits)


def _narrate_run(run):
    first = run[0]
    last = run[-1]
    code = first["text"].strip()
    msg = f"Line {first['lineno']} (`{code}`) runs {len(run)} times."
    if first["diff"]:
        msg += " The first time, " + "; ".join(first["diff"]) + "."
    if last is not first and last["diff"]:
        msg += " The last time, " + "; ".join(last["diff"]) + "."
    printed = [p for step in run for p in step["prints"]]
    if printed:
        sample = "".join(printed[:3]).replace("\n", " / ").strip(" /")
        msg += f" It prints {len(printed)} time{'s' if len(printed) != 1 else ''}"
        if sample:
            msg += f", starting with `{sample}`"
        msg += "."
    return msg


def _narrate_steps(steps, seen=None):
    if seen is None:
        seen = {}
    parts = []
    i = 0
    while i < len(steps):
        step = steps[i]
        phrase = _empty_with(step, seen)
        if phrase:
            parts.append(phrase)
            i += 1
            continue
        if step.get("nested"):
            parts.append(_narrate_nested(step, steps[i + 1] if i + 1 < len(steps) else None, seen))
            i += 1
            continue
        j = i + 1
        while (
            j < len(steps)
            and not steps[j].get("nested")
            and steps[j]["lineno"] == step["lineno"]
            and steps[j]["text"] == step["text"]
        ):
            j += 1
        group = steps[i:j]
        if len(group) >= 3:
            parts.append(_narrate_run(group))
        else:
            for k, one in enumerate(group):
                nxt = group[k + 1] if k + 1 < len(group) else (steps[j] if j < len(steps) else None)
                parts.append(_narrate_one(one, nxt))
        i = j
    return parts


def _narrate_nested(step, nxt, seen):
    code = step["text"].strip() or "(blank)"
    inner = "\n\n".join(_narrate_steps(step["nested"], seen))
    tail = []
    if step["prints"]:
        tail.append(_describe_print(step["prints"]))
    if step["diff"]:
        tail.append("After that call finishes, " + "; ".join(step["diff"]) + ".")
    elif not step["prints"]:
        flow = _flow_note(step, nxt)
        if flow:
            tail.append(flow)
    body = f"Line {step['lineno']}: `{code}`\n\nPython steps into that line:\n\n{inner}"
    if tail:
        body += "\n\n" + " ".join(tail)
    return body


def narrate(traced):
    if traced is None:
        return "Python could not run this version, so read the repaired line below instead."
    if traced["error"] == "SyntaxError":
        return "Python cannot even start this program, because one line is not valid Python. That is called a syntax error: the spelling of the code itself is wrong."
    steps = traced["steps"]
    if not steps:
        if traced["error"]:
            return f"Python stops with an error called {traced['error']}. {_error_plain(traced['error'])}"
        return "Python runs the program without printing a step we can point at."
    parts = _narrate_steps(steps)
    if traced["overflow"]:
        parts.append("The program keeps going in the same way. The steps above are the start of the story, not every single repeat.")
    if traced["error"]:
        parts.append(f"Then Python stops with an error called {traced['error']}. {_error_plain(traced['error'])}")
    return "\n\n".join(parts)


def _error_plain(name):
    return {
        "TypeError": "A TypeError means two values were combined in a way Python does not allow, such as adding text and a number.",
        "NameError": "A NameError means Python saw a name that was never created. It is often a typo.",
        "IndexError": "An IndexError means the program asked for a position that is not in the text or the list. Positions start at 0.",
        "KeyError": "A KeyError means a dictionary was asked for a label it does not have.",
        "ValueError": "A ValueError means the kind of value was allowed, but this particular value could not be used. `int('3.7')` is a common one, because the text contains a decimal point.",
        "ZeroDivisionError": "A ZeroDivisionError means the program divided by zero.",
        "IndentationError": "An IndentationError means the spaces at the start of a line do not line up with the block they belong to.",
        "AttributeError": "An AttributeError means the program asked a value for something that value does not have.",
        "FileNotFoundError": "A FileNotFoundError means the program tried to open a file that is not there.",
        "SyntaxError": "A SyntaxError means the line is not legal Python, so the program cannot start.",
    }.get(name, "Read the error name, then compare it with the repaired line.")


_TOPIC = {
    "01": "A variable is a name stuck on a value, like a label on a box. `=` stores a value in that name. Python does math in a fixed order: parentheses first, then `**` (to the power of), then `*`, `/`, `//` and `%` from left to right, then `+` and `-` from left to right. `//` keeps only how many whole times one number fits in another. `%` is the leftover. `/` always keeps a decimal.",
    "02": "`input()` always gives you text, even when someone types digits. Text and numbers are different. `int()` makes a whole number. `float()` makes a number that can have a decimal. `str()` makes text. `print()` writes on the screen. It puts a space between values unless you set `sep`, and a new line after them unless you set `end`. An f-string (an `f` before the quotes) drops values into a sentence.",
    "03": "A condition is a yes-or-no question. `if` runs its indented lines only when the answer is yes. `elif` is another question, asked only if the earlier ones were no. `else` is the backup when every question was no. Only one branch runs. `==` asks \"are these equal?\" A single `=` stores a value. It does not compare.",
    "04": "A loop repeats work. `for n in range(...)` walks through numbers. `range` stops before the end, so `range(5)` is 0, 1, 2, 3, 4. `while` repeats as long as a check stays true, so something inside it must change or it never ends. `break` leaves the loop. `continue` skips the rest of this pass and starts the next one.",
    "05": "A function is a named recipe. `def` creates it and does not run it yet. The names in parentheses are parameters, slots for the values you pass in. `return` hands a value back to the caller. `print` only shows text. If there is no `return`, the function hands back `None`, which means nothing.",
    "06": "A string is a row of characters, and spaces count. Positions start at 0, not 1. Negative positions count backward, so `-1` is the last character. A slice such as `[1:4]` starts at 1 and stops before 4. You cannot change a string in place. Methods like `upper()` give you a new string, and you must save it if you want to keep it.",
    "07": "A list is an ordered group of values in square brackets. Positions start at 0. Lists can change in place: `append` adds one item at the end, and `sort` rearranges the same list and returns `None`. `sorted` gives you a new list. Two names can refer to one list. `b = a` does not make a copy. `a.copy()` or `a[:]` does.",
    "08": "A dictionary stores a value under a label called a key. You read it with square brackets, like `d['age']`. A missing key raises a KeyError. `get` can hand back a backup value instead. A set stores each value once. Membership with `in` on a dictionary checks the keys, not the values.",
    "09": "When Python cannot finish a line, it stops and names the problem. A traceback is the list of calls that led there. The last line of that list is the error that just happened. `try` attempts something. `except` handles one kind of error instead of crashing. `finally` runs whether or not there was an error.",
    "10": "A module is a library of ready-made tools. `import math` loads it, and you use names through the module, like `math.sqrt`. `from math import sqrt` copies that one name into your file. Code under `if __name__ == '__main__':` runs only when you start that file yourself, not when another file imports it.",
    "11": "Open a file before you read or write it. `'r'` reads. `'w'` starts the file over and erases what was there. `'a'` adds to the end. `with open(...) as f` closes the file for you even if something goes wrong. `write` does not add a new line unless you include `\\n` yourself.",
}


def _concept(q):
    code = q.get("objective", "")
    key = code.rsplit(".", 1)[-1]
    return _TOPIC.get(key, "")


def _spoken_output(text):
    lines = text.split("\n")
    if len(lines) == 1:
        return f"`{text}`"
    shown = ", then a new line, then ".join(f"`{line}`" for line in lines)
    return shown


def _prompt_plain(prompt):
    return " ".join(prompt.split())


def _mcq_body(q):
    correct = q["choices"][q["answer"]]
    return f"""**What the question is asking**

{_prompt_plain(q['prompt'])}

**The answer**

The right choice is `{correct}`.

**The idea, step by step**

{_mcq_steps(q, correct)}

**Keep this**

If another choice looks familiar, read the steps once more before you move on. The choice that fits is `{correct}`."""


def _mcq_steps(q, correct):
    custom = MCQ_LESSON.get(q["id"])
    kernel = q["explanation"]
    topic = _concept(q)
    lead = f"{topic}\n\n" if topic else ""
    if custom:
        return f"{lead}{custom}\n\nThe one-line version: {kernel}"
    sentences = [s.strip() for s in kernel.replace("!", ".").split(". ") if s.strip()]
    numbered = "\n\n".join(f"{i + 1}. {s if s.endswith('.') else s + '.'}" for i, s in enumerate(sentences))
    return f"{lead}Work through it in order.\n\n{numbered}\n\nThat is why `{correct}` is the choice that fits."


def _output_body(q):
    traced = trace_program(q["code"], q.get("stdin") or "", q.get("files"))
    concept = _concept(q)
    stdin = ""
    if q.get("stdin"):
        shown = q["stdin"].replace("\n", " / ")
        stdin = f"\n\nThe person at the keyboard types `{shown}`. Each piece is one answer to `input()`."
    files = ""
    if q.get("files"):
        names = ", ".join(f"`{name}`" for name in q["files"])
        files = f"\n\nThese files are already saved before the program runs: {names}."
    idea = f"\n\n**The idea, if it is new**\n\n{concept}" if concept else ""
    printed = _spoken_output(q["answer"])
    return f"""**What you are doing**

Pretend you are Python. Read the program from the top and write down exactly what it prints. Spaces and line breaks are part of the answer.{stdin}{files}{idea}

**Walk through it**

{narrate(traced)}

**Why that printout is right**

{q['explanation']}

**What to type**

Python prints {printed}. A new line in the real output is a new line in your answer. An extra space in the middle makes it a different answer."""


def _bug_body(q):
    traced_bad = trace_program(q["code"], q.get("stdin") or "", q.get("files"))
    fixed_lines = q["code"].split("\n")
    fixed_lines[q["answer"] - 1] = q["fix"]
    traced_good = trace_program("\n".join(fixed_lines), q.get("stdin") or "", q.get("files"))
    concept = _concept(q)
    idea = f"\n\n**The idea, if it is new**\n\n{concept}" if concept else ""
    actual = q["actual"]
    return f"""**What you are doing**

The program is supposed to do the job in the question, but one line is wrong. You only have to find that line. You do not have to rewrite the whole program.{idea}

**What the broken program does**

{narrate(traced_bad)}

The broken version ends as `{actual}`.

**The line to click**

Click line {q['answer']}. A repaired version of that line is `{q['fix'].strip()}`.

**What the repaired program does**

{narrate(traced_good)}

The repaired program prints `{q['expected']}`.

**Why this was the bug**

{q['explanation']}"""


def _code_body(q):
    example = q["tests"][0]["stdin"] if q.get("tests") else ""
    traced = trace_program(q["solution"], example, q.get("files"))
    concept = _concept(q)
    idea = f"\n\n**The idea, if it is new**\n\n{concept}" if concept else ""
    shown_in = example.replace("\n", " / ") if example else "(nothing)"
    expected = q["tests"][0]["expected"].replace("\n", " / ") if q.get("tests") else ""
    return f"""**What you are doing**

Read the job in the question, then write a small Python program that does that job for any input, not just the example. "Run examples" tries the samples you can see. "Check answer" also runs hidden tests.{idea}

**One way to solve it**

{q['explanation']}

**Watch that solution on the first example**

The first sample input is `{shown_in}`. It should print `{expected}`.

{narrate(traced)}

Your program does not have to look identical. It passes when it prints the right text for every test."""


def expand(q):
    kind = q["type"]
    if kind == "mcq":
        return _mcq_body(q)
    if kind == "output":
        return _output_body(q)
    if kind == "bug":
        return _bug_body(q)
    if kind == "code":
        return _code_body(q)
    return q["explanation"]


def expand_all(questions):
    for q in questions:
        q["explanation"] = expand(q)


# Hand-written lessons for multiple choice, keyed by stable question id.
# Each one teaches the idea as if the reader has not met it before.
from mcq_lessons import MCQ_LESSON  # noqa: E402
