"""Helpers for authoring the Recall Lab question bank.

Every question is original. Answers for code-output, find-the-bug and code-writing
questions are never typed by hand: build.py runs the code with CPython and records
what it really prints, and the Vitest bank test re-runs everything under Pyodide.
"""
import hashlib, os, random, subprocess, sys, tempfile, textwrap

QUESTIONS = []
_counters = {}


def _id(obj, kind):
    _counters[(obj, kind)] = _counters.get((obj, kind), 0) + 1
    return f"d335-{obj}-{kind}-{_counters[(obj, kind)]:02d}"


def dedent(s):
    return textwrap.dedent(s).strip("\n")


def run(code, stdin="", files=None):
    """Run code with CPython in a scratch dir. Returns (stdout, error_name|None)."""
    with tempfile.TemporaryDirectory() as d:
        for name, body in (files or {}).items():
            with open(os.path.join(d, name), "w") as f:
                f.write(body)
        wrapper = (
            "import sys, traceback\n"
            "src = open('main.py').read()\n"
            "try:\n"
            "    exec(compile(src, 'main.py', 'exec'), {'__name__': '__main__'})\n"
            "except BaseException as e:\n"
            "    sys.stdout.flush()\n"
            "    print('@@ERROR@@' + type(e).__name__)\n"
        )
        with open(os.path.join(d, "main.py"), "w") as f:
            f.write(code)
        with open(os.path.join(d, "wrap.py"), "w") as f:
            f.write(wrapper)
        p = subprocess.run([sys.executable, "wrap.py"], input=stdin, cwd=d,
                           capture_output=True, text=True, timeout=10)
        out = p.stdout
        err = None
        if "@@ERROR@@" in out:
            out, err = out.split("@@ERROR@@", 1)
            err = err.strip()
        return out, err


def norm(s):
    return "\n".join(line.rstrip() for line in s.rstrip("\n").split("\n"))


def mcq(obj, diff, prompt, correct, wrong, explanation, code=None, verify=None):
    """correct: the right choice text; wrong: list of distractors.
    verify (optional): code whose printed output must equal the correct choice."""
    qid = _id(obj, "mcq")
    choices = [correct] + list(wrong)
    rnd = random.Random(int(hashlib.md5(qid.encode()).hexdigest(), 16))
    rnd.shuffle(choices)
    if verify is not None:
        o, e = run(dedent(verify))
        assert e is None and norm(o) == correct, f"{qid}: verify printed {o!r} ({e}) not {correct!r}"
    q = dict(id=qid, objective=obj, type="mcq", difficulty=diff, prompt=prompt,
             choices=choices, answer=choices.index(correct), explanation=explanation)
    if code:
        q["code"] = dedent(code)
    QUESTIONS.append(q)


def out(obj, diff, code, explanation, stdin=None, prompt=None, files=None):
    """Code-output prediction. `{out}` in the explanation is replaced by the real output."""
    qid = _id(obj, "out")
    code = dedent(code)
    o, e = run(code, stdin or "", files)
    assert e is None, f"{qid} raised {e}: {code}"
    o = norm(o)
    assert o != "", f"{qid} printed nothing"
    assert len(o.split("\n")) <= 6, f"{qid}: output too long"
    q = dict(id=qid, objective=obj, type="output", difficulty=diff,
             prompt=prompt or ("What does this program print?" if not stdin else "What does this program print for the input shown?"),
             code=code, answer=o, explanation=explanation.replace("{out}", o.replace("\n", " / ")))
    if stdin:
        q["stdin"] = stdin.rstrip("\n")
    if files:
        q["files"] = files
    QUESTIONS.append(q)


def bug(obj, diff, prompt, code, line, fix, explanation, stdin=None, files=None):
    """Find-the-bug: `line` is the 1-based buggy line, `fix` the corrected line."""
    qid = _id(obj, "bug")
    code = dedent(code)
    lines = code.split("\n")
    assert 1 <= line <= len(lines), qid
    fixed_lines = list(lines)
    indent = lines[line - 1][: len(lines[line - 1]) - len(lines[line - 1].lstrip())]
    fixed_lines[line - 1] = indent + fix.strip()
    fixed = "\n".join(fixed_lines)
    bo, be = run(code, stdin or "", files)
    fo, fe = run(fixed, stdin or "", files)
    assert fe is None, f"{qid}: fixed code raised {fe}"
    assert (norm(bo), be) != (norm(fo), None), f"{qid}: bug changes nothing"
    q = dict(id=qid, objective=obj, type="bug", difficulty=diff, prompt=prompt, code=code,
             answer=line, fix=fixed_lines[line - 1], expected=norm(fo),
             actual=(f"{be}" if be else norm(bo)), explanation=explanation)
    if stdin:
        q["stdin"] = stdin.rstrip("\n")
    if files:
        q["files"] = files
    QUESTIONS.append(q)


def code(obj, diff, prompt, solution, inputs, explanation, starter=None, visible=2, files=None):
    """Code-writing: tests are stdin -> expected stdout, expected computed from `solution`.
    The first `visible` tests are shown as examples; the rest stay hidden."""
    qid = _id(obj, "code")
    solution = dedent(solution)
    tests = []
    for i, stdin in enumerate(inputs):
        o, e = run(solution, stdin, files)
        assert e is None, f"{qid}: solution raised {e} on {stdin!r}"
        tests.append(dict(stdin=stdin.rstrip("\n"), expected=norm(o), hidden=i >= visible))
    assert len({t["expected"] for t in tests}) > 1 or len(tests) == 1, f"{qid}: tests all identical"
    q = dict(id=qid, objective=obj, type="code", difficulty=diff, prompt=prompt,
             starter=dedent(starter) if starter else "# Write your program here\n",
             tests=tests, solution=solution, explanation=explanation)
    if files:
        q["files"] = files
    QUESTIONS.append(q)
