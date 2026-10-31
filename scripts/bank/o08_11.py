from lib import mcq, out, bug, code

# ---------------------------------------------------------------- 08 Dictionaries & sets
O = "08"
mcq(O, 1, "How do you get the value stored under key 'age' in dict `p`?", "p['age']", ["p.age", "p(age)", "p[age]  (without quotes)"],
    "Dictionaries are indexed by key with square brackets. A bare name `age` would be looked up as a variable.")
mcq(O, 1, "What happens when you read a key that isn't in a dictionary with `d[key]`?", "A KeyError is raised", ["It returns None", "It returns 0", "The key is added"],
    "Use `d.get(key)` (or `d.get(key, default)`) to avoid the KeyError.")
mcq(O, 2, "What does `{'a': 1}.get('b', 0)` return?", "0", ["None", "KeyError", "'b'"],
    "get() returns the default when the key is missing.", verify="print({'a': 1}.get('b', 0))")
mcq(O, 2, "What does `'x' in {'x': 5, 'y': 6}` test?", "Whether 'x' is a key", ["Whether 'x' is a value", "Whether 5 is present", "It raises TypeError"],
    "Membership tests on a dict check its keys. Use `in d.values()` for values.")
mcq(O, 2, "Which loop gives you each key and value together?", "for k, v in d.items():", ["for k, v in d:", "for k, v in d.keys():", "for k in d.values():"],
    "items() yields (key, value) pairs that unpack into two loop variables.")
mcq(O, 2, "What is `len(set([1, 2, 2, 3, 3, 3]))`?", "3", ["6", "1", "4"],
    "A set keeps only unique values: {1, 2, 3}.", verify="print(len(set([1, 2, 2, 3, 3, 3])))")
mcq(O, 2, "What happens when you assign to a key that already exists: `d['k'] = new`?", "The old value is replaced", ["A second 'k' entry is added", "KeyError", "Nothing changes"],
    "Keys are unique, so assignment overwrites the existing value.")
mcq(O, 3, "Which of these can NOT be used as a dictionary key?", "[1, 2]", ["(1, 2)", "'12'", "12"],
    "Keys must be hashable (immutable). A list is mutable, so it raises TypeError; a tuple works.")
mcq(O, 2, "What does `{1, 2, 3} & {2, 3, 4}` produce?", "{2, 3}", ["{1, 2, 3, 4}", "{1, 4}", "{1}"],
    "`&` is set intersection: the items in both sets.", verify="print({1, 2, 3} & {2, 3, 4})")
mcq(O, 2, "How do you remove the key 'temp' from dict `d` and get its value back?", "d.pop('temp')", ["d.remove('temp')", "d.delete('temp')", "d['temp'] = None"],
    "pop(key) deletes the entry and returns its value. `del d['temp']` deletes without returning.")

out(O, 1, """
    stock = {"apple": 3, "pear": 5}
    stock["apple"] += 2
    stock["kiwi"] = 1
    print(stock["apple"], len(stock))
    """, "apple goes from 3 to 5 and kiwi is a new key, giving 3 keys. Output: {out}.")
out(O, 2, """
    text = "a b a c b a"
    counts = {}
    for w in text.split():
        counts[w] = counts.get(w, 0) + 1
    print(counts)
    """, "get(w, 0) starts each new word at zero before adding 1. Dicts keep insertion order: {out}.")
out(O, 2, """
    ages = {"kim": 31, "lu": 25, "max": 40}
    for name, age in ages.items():
        if age > 30:
            print(name)
    """, "items() yields each name/age pair; only the ages over 30 are printed: {out}.")
out(O, 2, """
    d = {"x": 1, "y": 2}
    print(list(d.keys()), sum(d.values()))
    """, "keys() lists the keys in insertion order and values() can be summed: {out}.")
out(O, 2, """
    a = {1, 2, 3}
    b = {3, 4}
    print(sorted(a | b), sorted(a - b))
    """, "`|` is union and `-` is difference (items in a but not b): {out}.")
out(O, 3, """
    grades = {"ana": [90, 80], "bo": [70]}
    grades["bo"].append(100)
    print(sum(grades["bo"]) / len(grades["bo"]), len(grades))
    """, "Values can be lists that you mutate in place; bo's average is (70 + 100) / 2. Output: {out}.")
out(O, 2, """
    colors = ["red", "blue", "red", "green", "blue"]
    unique = set(colors)
    print(len(colors), len(unique))
    """, "The list has 5 items but only 3 distinct colors: {out}.")
out(O, 3, """
    squares = {n: n * n for n in range(1, 4)}
    print(squares, squares.get(5, "none"))
    """, "A dict comprehension builds key: value pairs; 5 is missing so get returns the default. Output: {out}.")

bug(O, 1, "This should print 0 for a missing product instead of crashing. Click the buggy line.", """
    prices = {"tea": 3, "coffee": 4}
    item = "juice"
    print(prices[item])
    """, 3, "print(prices.get(item, 0))", "Indexing a missing key raises KeyError. get() with a default returns 0 instead.")
bug(O, 2, "This should count letters and print `{'a': 2, 'b': 1}`. Click the buggy line.", """
    counts = {}
    for ch in "aba":
        counts[ch] += 1
    print(counts)
    """, 3, "counts[ch] = counts.get(ch, 0) + 1", "The first time a letter appears its key doesn't exist yet, so `+= 1` raises KeyError.")
bug(O, 2, "This should print each name and its score like `ana 90`. Click the buggy line.", """
    scores = {"ana": 90, "bo": 75}
    for name, score in scores:
        print(name, score)
    """, 2, "for name, score in scores.items():", "Looping over a dict gives only keys; unpacking the string 'ana' into two names fails with ValueError. Use .items().")

code(O, 2, "Read a line of words and print each distinct word with how many times it appears, in order of first appearance, as `word count` lines.", """
    counts = {}
    for w in input().split():
        counts[w] = counts.get(w, 0) + 1
    for w, c in counts.items():
        print(w, c)
    """, ["red blue red", "a a a", "x y z y"], "Use a dict as a counter with get(w, 0) + 1; dicts remember insertion order.")
code(O, 2, "A phone book is given as `pb = {'ana': '555-0101', 'bo': '555-0199', 'cy': '555-0142'}`. Read a name and print the number, or `not found`.", """
    pb = {'ana': '555-0101', 'bo': '555-0199', 'cy': '555-0142'}
    print(pb.get(input().strip(), "not found"))
    """, ["bo", "zed", "ana"], "get() with a default handles missing names without an if.",
    starter="pb = {'ana': '555-0101', 'bo': '555-0199', 'cy': '555-0142'}\n# read a name and print the number or 'not found'\n")
code(O, 3, "Read two lines of space-separated words. Print the words that appear in both lines, sorted alphabetically and separated by spaces, or `none` if there are none.", """
    a = set(input().split())
    b = set(input().split())
    common = sorted(a & b)
    print(" ".join(common) if common else "none")
    """, ["cat dog fish\ndog bird cat", "one two\nthree four", "x\nx"], "Convert each line to a set and take the intersection.")

# ---------------------------------------------------------------- 09 Exceptions & debugging
O = "09"
mcq(O, 1, "What error does `int('abc')` raise?", "ValueError", ["TypeError", "SyntaxError", "NameError"],
    "The type (str) is acceptable to int(), but this particular value can't be parsed: that's a ValueError.")
mcq(O, 1, "What error does `10 / 0` raise?", "ZeroDivisionError", ["ValueError", "ArithmeticWarning", "It returns infinity"],
    "Dividing by zero raises ZeroDivisionError (for /, // and %).")
mcq(O, 1, "What error does `'5' + 5` raise?", "TypeError", ["ValueError", "SyntaxError", "It returns '55'"],
    "You cannot add a str and an int; the operand types are incompatible.")
mcq(O, 2, "Using a variable before assigning it raises...", "NameError", ["ValueError", "KeyError", "IndexError"],
    "NameError means Python couldn't find that name; often a typo or a missing assignment.")
mcq(O, 2, "When does a `finally` block run?", "Always, whether or not an exception occurred", ["Only if an exception occurred", "Only if no exception occurred", "Only after a return"],
    "finally is for cleanup that must happen no matter what, like closing a resource.")
mcq(O, 2, "When does the `else` block of a try statement run?", "When the try block finished without an exception", ["When an exception was caught", "Always", "Never; it is invalid"],
    "try/except/else: the else runs only if no exception was raised in the try block.")
mcq(O, 2, "In a traceback, where is the line that actually failed usually shown?", "At the bottom, just above the error message", ["At the top", "It is never shown", "In the first line"],
    "Tracebacks list calls from outermost to innermost; the last frame and the error type/message are at the bottom.")
mcq(O, 3, "Which statement raises your own error with a message?", "raise ValueError('bad input')", ["throw ValueError('bad input')", "error('bad input')", "except ValueError('bad input')"],
    "Python uses `raise`, not throw.")
mcq(O, 2, "Which is a syntax error rather than a runtime exception?", "if x > 3  (missing colon)", ["10 / 0", "[1][5]", "int('x')"],
    "Syntax errors are detected before the program runs; the others only fail while running.")
mcq(O, 3, "Why is a bare `except:` that silently passes considered a bad habit?", "It hides every error, including bugs you need to see", ["It is a syntax error", "It runs slower", "It only catches KeyError"],
    "Catch the specific exception you expect (e.g. `except ValueError:`) so unexpected bugs still surface.")

for v in ["42", "4.2", "hello"]:
    out(O, 1, """
        text = input()
        try:
            n = int(text)
            print("ok", n * 2)
        except ValueError:
            print("not a whole number")
        """, "int() succeeds only for whole-number text; otherwise the ValueError handler runs. Output: {out}.", stdin=v)
out(O, 2, """
    try:
        print("start")
        x = 1 / 0
        print("after")
    except ZeroDivisionError:
        print("caught")
    finally:
        print("cleanup")
    """, "The error skips the rest of the try block; the handler runs and finally always runs. Output: {out}.")
out(O, 2, """
    try:
        value = [1, 2, 3][1]
    except IndexError:
        print("bad index")
    else:
        print("got", value)
    """, "No exception occurs, so the else block runs: {out}.")
out(O, 3, """
    def check(age):
        if age < 0:
            raise ValueError("negative")
        return age

    for a in [5, -1]:
        try:
            print(check(a))
        except ValueError as e:
            print("error:", e)
    """, "The second call raises ValueError; `as e` captures it and printing e shows its message. Output: {out}.")
out(O, 3, """
    data = {"a": 1}
    try:
        print(data["b"])
    except (KeyError, IndexError) as e:
        print(type(e).__name__)
    """, "A tuple in except catches any of the listed types; the missing key raises KeyError: {out}.")

bug(O, 1, "This should print `5`. Click the line with the bug.", """
    count = 5
    print(Count)
    """, 2, "print(count)", "Names are case-sensitive; `Count` is undefined and raises NameError.")
bug(O, 2, "This should print `invalid` for non-numeric input instead of crashing. Click the buggy line.", """
    text = input()
    try:
        n = int(text)
        print(n)
    except TypeError:
        print("invalid")
    """, 5, "except ValueError:", "int('abc') raises ValueError, not TypeError, so the handler doesn't catch it.", stdin="abc")
bug(O, 2, "This should print the average 2.5. Click the buggy line.", """
    nums = [1, 2, 3, 4]
    total = 0
    for n in nums:
        total += n
    print(total / len(num))
    """, 5, "print(total / len(nums))", "`num` is a typo for `nums`, causing a NameError.")
bug(O, 3, "Both prints should show `safe: 0` instead of crashing. Click the buggy line.", """
    def safe_div(a, b):
        try:
            return a / b
        except ZeroDivisionError:
            return 0

    print("safe:", safe_div(5, 0))
    print("safe:", 5 / 0)
    """, 8, 'print("safe:", safe_div(5, 0))', "Line 8 divides directly, outside the protected function, so it still raises ZeroDivisionError. Route the division through safe_div.")

code(O, 2, "Read two lines, a and b. Print a / b rounded to 2 decimals. If either isn't a number print `bad input`; if b is zero print `cannot divide by zero`.", """
    try:
        a = float(input())
        b = float(input())
        print(round(a / b, 2))
    except ValueError:
        print("bad input")
    except ZeroDivisionError:
        print("cannot divide by zero")
    """, ["7\n2", "x\n2", "5\n0", "1\n3"], "Catch ValueError from float() and ZeroDivisionError from the division in separate handlers.")
code(O, 3, "Read lines until the line `done`. Each other line should be an integer; ignore lines that aren't. Print the sum of the valid integers.", """
    total = 0
    while True:
        line = input()
        if line == "done":
            break
        try:
            total += int(line)
        except ValueError:
            pass
    print(total)
    """, ["3\nx\n4\ndone", "done", "10\n-3\n2.5\nseven\n1\ndone"], "Wrap only the conversion in try so a bad line is skipped and the loop continues.")
code(O, 2, "Write `get_item(items, i)` that returns items[i], or the string `out of range` if the index is invalid (use try/except IndexError). Read an integer index and print `get_item(['a', 'b', 'c'], index)`.", """
    def get_item(items, i):
        try:
            return items[i]
        except IndexError:
            return "out of range"

    print(get_item(['a', 'b', 'c'], int(input())))
    """, ["1", "5", "-1", "3"], "IndexError is raised for any index outside -len..len-1.")

# ---------------------------------------------------------------- 10 Modules & libraries
O = "10"
mcq(O, 1, "After `import math`, how do you compute a square root?", "math.sqrt(16)", ["sqrt(16)", "math.root(16)", "16.sqrt()"],
    "With `import math` the module's names are reached through the module: math.sqrt.")
mcq(O, 2, "What does `from math import pi` allow?", "Using `pi` directly without the `math.` prefix", ["Using every math function without a prefix", "Renaming math to pi", "Nothing; it's invalid"],
    "from-import copies the named object into your namespace.")
mcq(O, 2, "What does `import random as rnd` do?", "Imports random under the alias rnd", ["Imports only random.rnd", "Creates a random number called rnd", "Raises ImportError"],
    "`as` gives the module a shorter local name: rnd.randint(1, 6).")
mcq(O, 2, "Which call can return 6 when simulating a die roll?", "random.randint(1, 6)", ["random.randrange(1, 6)", "random.random() * 6", "random.choice(range(6))"],
    "randint includes both endpoints. randrange(1, 6) stops before 6, and choice(range(6)) picks 0..5.")
mcq(O, 2, "What is `math.floor(-2.5)`?", "-3", ["-2", "-2.5", "2"],
    "floor rounds down toward negative infinity.", verify="import math\nprint(math.floor(-2.5))")
mcq(O, 2, "What is `math.ceil(4.1)`?", "5", ["4", "4.1", "4.0"],
    "ceil rounds up to the next whole number.", verify="import math\nprint(math.ceil(4.1))")
mcq(O, 3, "What is `__name__` equal to inside a file that is being run directly (not imported)?", "'__main__'", ["The file name", "None", "'main'"],
    "That's why scripts guard their entry point with `if __name__ == '__main__':`; on import, `__name__` is the module's name instead.")
mcq(O, 3, "Why guard code with `if __name__ == '__main__':`?", "So it runs when the file is executed but not when it is imported", ["To make it run faster", "To hide it from the debugger", "It's required for every program"],
    "Imports execute a module's top-level code; the guard keeps demo/test code from running on import.")
mcq(O, 2, "Which function returns a random item from a list?", "random.choice(items)", ["random.pick(items)", "random.item(items)", "items.random()"],
    "random.choice selects one element; random.shuffle reorders a list in place.")
mcq(O, 2, "Where would you look up everything a module provides from inside Python?", "dir(module) or help(module)", ["module.list()", "print(module)", "import *"],
    "dir() lists the names; help() shows the documentation.")

out(O, 1, """
    import math
    print(math.sqrt(49), math.pi > 3)
    """, "sqrt returns a float, so 49 gives 7.0; pi is about 3.14159. Output: {out}.")
out(O, 2, """
    import math
    print(math.floor(7.8), math.ceil(7.2), round(7.5))
    """, "floor rounds down, ceil rounds up, and round(7.5) goes to the even neighbour 8. Output: {out}.")
out(O, 2, """
    from math import gcd, factorial
    print(gcd(12, 18), factorial(4))
    """, "gcd finds the greatest common divisor (6) and factorial(4) is 24. Output: {out}.")
out(O, 2, """
    import datetime
    d = datetime.date(2024, 3, 1)
    print(d.year, d.month, d.day)
    """, "A date object exposes year, month and day attributes: {out}.")
out(O, 3, """
    from datetime import date, timedelta
    start = date(2024, 2, 27)
    later = start + timedelta(days=3)
    print(later)
    """, "2024 is a leap year, so three days after Feb 27 is Mar 1. A date prints in ISO format: {out}.")
out(O, 2, """
    import random
    random.seed(1)
    nums = [random.randint(1, 3) for _ in range(20)]
    print(min(nums) >= 1, max(nums) <= 3)
    """, "randint(1, 3) always returns a value from 1 to 3 inclusive, so both checks are True: {out}.")
out(O, 2, """
    import string
    print(string.ascii_lowercase[:5], len(string.digits))
    """, "string.ascii_lowercase is 'abc...z' and string.digits is '0123456789'. Output: {out}.")
out(O, 3, """
    import math as m
    print(round(m.hypot(3, 4)), m.isclose(0.1 + 0.2, 0.3))
    """, "hypot(3, 4) is the length of the hypotenuse, 5.0. Floating point makes 0.1 + 0.2 slightly off, but isclose tolerates that. Output: {out}.")
out(O, 2, """
    def main():
        print("running main")

    if __name__ == "__main__":
        main()
    print(__name__)
    """, "Run directly, the module's __name__ is '__main__', so the guard calls main(). Output: {out}.")

bug(O, 1, "This should print 4.0. Click the buggy line.", """
    import math
    print(sqrt(16))
    """, 2, "print(math.sqrt(16))", "`import math` doesn't put sqrt into your namespace; use math.sqrt or `from math import sqrt`.")
bug(O, 2, "This should print 10 (the ceiling of 9.2). Click the buggy line.", """
    from math import ceil
    value = 9.2
    print(math.ceil(value))
    """, 3, "print(ceil(value))", "Only ceil was imported, so the name `math` is not defined (NameError).")
bug(O, 2, "This should print the number of days between the two dates (10). Click the buggy line.", """
    from datetime import date
    a = date(2024, 1, 1)
    b = date(2024, 1, 11)
    print((b - a).day)
    """, 4, "print((b - a).days)", "Subtracting dates gives a timedelta, whose attribute is `days` (plural).")

code(O, 2, "Read the two legs of a right triangle (floats, one per line) and print the hypotenuse rounded to 2 decimals using the math module.", """
    import math
    a = float(input())
    b = float(input())
    print(round(math.sqrt(a ** 2 + b ** 2), 2))
    """, ["3\n4", "1\n1", "5.5\n2"], "math.sqrt (or math.hypot) computes the square root of a squared plus b squared.")
code(O, 3, "Read a date as `YYYY-MM-DD` and print the day of the week it falls on, e.g. `Monday`. Use the datetime module.", """
    from datetime import date
    y, m, d = map(int, input().split("-"))
    print(date(y, m, d).strftime("%A"))
    """, ["2024-01-01", "2000-02-29", "2026-10-30"], "Split the text, build a date, and format it with %A (full weekday name).")
code(O, 2, "Read a positive integer n and print the numbers 1..n that are perfect squares, separated by spaces. Use math.isqrt or math.sqrt.", """
    import math
    n = int(input())
    print(" ".join(str(i) for i in range(1, n + 1) if math.isqrt(i) ** 2 == i))
    """, ["20", "1", "50"], "A number is a perfect square when its integer square root, squared, gives the number back.")

# ---------------------------------------------------------------- 11 Files
O = "11"
SAMPLE = {"notes.txt": "first line\nsecond line\nthird line\n"}
mcq(O, 1, "Which mode opens a file for reading?", "'r'", ["'w'", "'a'", "'x'"],
    "'r' (the default) reads. 'w' truncates/creates for writing, 'a' appends, 'x' creates and fails if the file exists.")
mcq(O, 2, "What happens to an existing file opened with mode 'w'?", "Its contents are erased before writing", ["New text is added at the end", "It opens read-only", "It raises FileExistsError"],
    "'w' truncates the file. Use 'a' to add to the end.")
mcq(O, 2, "Why use `with open(...) as f:`?", "The file is closed automatically when the block ends, even after an error", ["It reads faster", "It locks the file forever", "It is required for writing"],
    "The with statement is a context manager that guarantees f.close().")
mcq(O, 2, "What does `f.readline()` return at the end of the file?", "An empty string ''", ["None", "'\\n'", "It raises EOFError"],
    "readline() returns '' once there is nothing left; a blank line inside the file would be '\\n'.")
mcq(O, 2, "What does `f.write('hi')` NOT do automatically?", "Add a newline", ["Write the text", "Return the number of characters written", "Work with mode 'w'"],
    "Unlike print, write() adds no newline; include '\\n' yourself.")
mcq(O, 2, "What is the most common way to process a text file one line at a time?", "for line in f:", ["while f:", "f.lines()", "for line in f.read():"],
    "Iterating over the file object yields lines (each ending in '\\n'). Iterating over f.read() would yield single characters.")
mcq(O, 1, "Opening a file that doesn't exist with mode 'r' raises...", "FileNotFoundError", ["ValueError", "KeyError", "It creates the file"],
    "Reading requires the file to exist; 'w' or 'a' would create it.")
mcq(O, 3, "Each line from `for line in f` ends with a newline. Which call gives you the text without it?", "line.rstrip('\\n')", ["line.split()", "line[1:]", "line.lower()"],
    "rstrip('\\n') (or strip()) removes the trailing newline. split() also splits on inner spaces.")
mcq(O, 2, "In a CSV line `'ana,90,85'`, which call gives `['ana', '90', '85']`?", "line.split(',')", ["line.split()", "list(line)", "line.join(',')"],
    "Split on the comma delimiter. (The csv module handles quoted fields too.)")

out(O, 1, """
    with open("notes.txt") as f:
        lines = f.readlines()
    print(len(lines), lines[0].strip())
    """, "notes.txt has three lines; readlines() returns them in a list (with newlines, which strip() removes). Output: {out}.", files=SAMPLE)
out(O, 2, """
    with open("notes.txt") as f:
        first = f.readline()
        rest = f.read()
    print(first.strip(), "|", rest.count("\\n"))
    """, "readline() consumes the first line; read() returns the remaining two lines, which contain two newlines. Output: {out}.", files=SAMPLE)
out(O, 2, """
    with open("log.txt", "w") as f:
        f.write("a\\n")
    with open("log.txt", "a") as f:
        f.write("b\\n")
    with open("log.txt") as f:
        print(f.read().split())
    """, "'w' creates the file with 'a'; 'a' appends 'b'. Reading back and splitting gives {out}.")
out(O, 2, """
    with open("out.txt", "w") as f:
        f.write("x")
    with open("out.txt", "w") as f:
        f.write("y")
    print(open("out.txt").read())
    """, "Each 'w' open erases the file, so only the second write survives: {out}.")
out(O, 3, """
    total = 0
    with open("scores.csv") as f:
        next(f)
        for line in f:
            name, score = line.strip().split(",")
            total += int(score)
    print(total)
    """, "next(f) skips the header row; the remaining scores 90, 75 and 60 add up to {out}.", files={"scores.csv": "name,score\nana,90\nbo,75\ncy,60\n"})
out(O, 3, """
    import csv
    with open("people.csv", newline="") as f:
        rows = list(csv.DictReader(f))
    print(len(rows), rows[1]["city"])
    """, "DictReader uses the header for keys; there are two data rows and the second one's city is {out}.", files={"people.csv": "name,city\nAna,Austin\nBo,Boise\n"})
out(O, 2, """
    with open("notes.txt") as f:
        for i, line in enumerate(f, start=1):
            if "second" in line:
                print(i)
    """, "enumerate numbers the lines starting at 1; 'second' is on line {out}.", files=SAMPLE)

bug(O, 1, "This should add a line to the end of log.txt, keeping the old line, and print 2. Click the buggy line.", """
    with open("log.txt", "w") as f:
        f.write("old\\n")
    with open("log.txt", "w") as f:
        f.write("new\\n")
    print(len(open("log.txt").readlines()))
    """, 3, 'with open("log.txt", "a") as f:', "Mode 'w' wipes the file. Mode 'a' appends.")
bug(O, 2, "This should print each line of notes.txt without blank lines in between. Click the buggy line.", """
    with open("notes.txt") as f:
        for line in f:
            print(line)
    """, 3, "print(line.rstrip())", "Each line already ends in '\\n' and print adds another, producing blank lines.", files=SAMPLE)
bug(O, 2, "This should write two lines, `a` and `b`, and print 2. Click the buggy line.", """
    with open("pair.txt", "w") as f:
        f.write("a")
        f.write("b\\n")
    print(len(open("pair.txt").readlines()))
    """, 2, 'f.write("a\\n")', "write() doesn't add newlines, so the file contains 'ab' on one line.")

code(O, 2, "A file `notes.txt` exists (it is created for you). Print the number of lines it contains, then the longest line (without its newline). If several lines are equally long, print the first.", """
    with open("notes.txt") as f:
        lines = [line.rstrip("\\n") for line in f]
    print(len(lines))
    print(max(lines, key=len))
    """, [""], "Read the lines, strip newlines, then use len() and max(key=len).", visible=1, files={"notes.txt": "alpha\nbravo charlie\ndelta\n"})
code(O, 2, "Read a line of text from input, write it to a new file `copy.txt`, then open `copy.txt` again and print its contents in upper case.", """
    text = input()
    with open("copy.txt", "w") as f:
        f.write(text)
    with open("copy.txt") as f:
        print(f.read().upper())
    """, ["hello file", "Python 3", "x"], "Open once with 'w' to write and again with 'r' to read it back.")
code(O, 3, "The file `grades.csv` has a header `name,score` followed by one row per student (it is created for you). Print the name of the student with the highest score.", """
    best_name, best = None, -1
    with open("grades.csv") as f:
        next(f)
        for line in f:
            name, score = line.strip().split(",")
            if int(score) > best:
                best_name, best = name, int(score)
    print(best_name)
    """, [""], "Skip the header, split each row on commas, convert the score and track the maximum.", visible=1, files={"grades.csv": "name,score\nana,88\nbo,93\ncy,71\n"})
