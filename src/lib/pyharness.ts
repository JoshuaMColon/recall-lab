/**
 * The same runner in the browser worker and in the Node bank test, so
 * "what printed" means the same thing in both places. Each run gets a
 * fresh temp directory. I replace input() so a prompt is not echoed
 * into stdout: `input("Enter: ")` and `input()` have to grade the same.
 * Asking for more lines than the test provides raises EOFError instead
 * of returning empty strings, which would spin a read-until-blank loop
 * until the worker is killed. The program is compiled as main.py so a
 * traceback line maps to the editor, not into this harness. SystemExit
 * is a clean stop. stdout is capped so a runaway print cannot balloon
 * the message back to the page.
 */
export const HARNESS = String.raw`
import sys, io, os, json, tempfile, builtins, traceback

def __rl_run(code, stdin, files_json):
    files = json.loads(files_json) if files_json else {}
    old = os.getcwd()
    d = tempfile.mkdtemp()
    os.chdir(d)
    for name, body in files.items():
        with open(name, "w") as f:
            f.write(body)
    out = io.StringIO()
    data = stdin if (stdin == "" or stdin.endswith("\n")) else stdin + "\n"
    inp = io.StringIO(data)
    real = (sys.stdin, sys.stdout, builtins.input)
    def quiet_input(prompt=""):
        line = inp.readline()
        if line == "":
            raise EOFError("the program asked for more input than the test provides")
        return line[:-1] if line.endswith("\n") else line
    sys.stdin, sys.stdout, builtins.input = inp, out, quiet_input
    err = None
    try:
        exec(compile(code, "main.py", "exec"), {"__name__": "__main__"})
    except SystemExit:
        pass
    except BaseException as e:
        line = None
        if isinstance(e, SyntaxError):
            line = e.lineno
        else:
            for fr in reversed(traceback.extract_tb(e.__traceback__)):
                if fr.filename == "main.py":
                    line = fr.lineno
                    break
        err = {"type": type(e).__name__, "message": str(e), "line": line}
    finally:
        sys.stdin, sys.stdout, builtins.input = real
        os.chdir(old)
    return json.dumps({"stdout": out.getvalue()[:20000], "error": err})
`

export interface RunCase {
  stdin: string
}

export interface RunRequest {
  id: number
  code: string
  cases: RunCase[]
  files?: Record<string, string>
}
