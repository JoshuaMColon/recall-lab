from lib import mcq, out, bug, code

# ---------------------------------------------------------------- 04 Loops
O = "04"
mcq(O, 1, "What values does `range(2, 8, 2)` produce?", "2, 4, 6", ["2, 4, 6, 8", "2, 8", "4, 6, 8"],
    "range(start, stop, step) stops before `stop`, so 8 is excluded.", verify="print(*range(2, 8, 2), sep=', ')")
mcq(O, 1, "How many times does `for i in range(5):` run its body?", "5", ["4", "6", "It depends on i"],
    "range(5) yields 0, 1, 2, 3, 4: five values.")
mcq(O, 1, "Which statement immediately exits the nearest enclosing loop?", "break", ["continue", "pass", "return"],
    "`break` leaves the loop. `continue` skips to the next iteration, `pass` does nothing, and `return` leaves the whole function.")
mcq(O, 2, "What does `continue` do inside a loop?", "Skips the rest of the current iteration and moves to the next one", ["Ends the loop", "Restarts the loop from the first item", "Does nothing"],
    "continue jumps back to the loop header to fetch the next item (or re-test the while condition).")
mcq(O, 2, "What is printed by `for i in range(3, 0, -1): print(i, end=' ')`?", "3 2 1", ["3 2 1 0", "0 1 2 3", "1 2 3"],
    "With a negative step range counts down and still stops before 0.", verify="for i in range(3, 0, -1): print(i, end=' ')\nprint()")
mcq(O, 2, "Which loop is the best fit when you don't know in advance how many repetitions you need (e.g. keep asking until valid input)?", "while", ["for over range()", "a list comprehension", "if"],
    "A while loop repeats as long as a condition holds, which suits 'repeat until something happens'.")
mcq(O, 2, "What happens with `i = 0` then `while i < 3: print(i)` (nothing else in the body)?", "It loops forever printing 0", ["It prints 0 1 2", "It prints nothing", "SyntaxError"],
    "i never changes, so `i < 3` stays True forever. Update the loop variable inside the body.")
mcq(O, 3, "When does the `else` block of a `for` loop run?", "When the loop finishes without hitting break", ["Only if the loop body never runs", "After every iteration", "Only after a break"],
    "A loop's else runs when the loop ends normally; a break skips it. It is handy for 'search and report not found'.")
mcq(O, 2, "How many lines does this print?\n\nfor r in range(3):\n    for c in range(4):\n        print(r, c)", "12", ["7", "4", "3"],
    "The inner loop runs 4 times for each of the 3 outer iterations: 3 x 4 = 12.")
mcq(O, 1, "What does `len(range(10, 20))` return?", "10", ["20", "9", "11"],
    "range(10, 20) covers 10..19, which is 10 numbers.", verify="print(len(range(10, 20)))")

for n in [4, 6, 10]:
    out(O, 1, f"""
        total = 0
        for i in range(1, {n} + 1):
            total += i
        print(total)
        """, f"The loop adds 1 through {n}. The accumulator ends at {{out}}.")
for n in [5, 12]:
    out(O, 2, f"""
        n = {n}
        steps = 0
        while n != 1:
            if n % 2 == 0:
                n = n // 2
            else:
                n = 3 * n + 1
            steps += 1
        print(steps)
        """, "Trace the while loop until n reaches 1, counting each pass. It takes {out} steps.")
out(O, 2, """
    for i in range(6):
        if i == 4:
            break
        if i % 2 == 0:
            continue
        print(i)
    """, "Even values are skipped by continue, and the loop stops at 4 with break. Only odd numbers before 4 print: {out}.")
out(O, 2, """
    word = "loop"
    count = 0
    for ch in word:
        if ch == "o":
            count += 1
    print(count)
    """, "A for loop over a string visits each character; two of them are 'o': {out}.")
out(O, 2, """
    for i in range(1, 4):
        print("*" * i)
    """, "Each iteration prints i stars, building a small triangle: {out}.")
out(O, 3, """
    for n in [3, 8, 5]:
        if n > 6:
            print("found", n)
            break
    else:
        print("none")
    print("done")
    """, "The loop breaks when it finds 8, so the else block is skipped. Output: {out}.")
out(O, 3, """
    result = ""
    for i in range(3):
        for j in range(i):
            result += str(j)
    print(result)
    """, "i=0 adds nothing, i=1 adds '0', i=2 adds '01'. The final string is {out}.")
out(O, 2, """
    x = 100
    while x > 10:
        x = x // 3
    print(x)
    """, "100 -> 33 -> 11 -> 3; the loop stops once x is not greater than 10: {out}.")
out(O, 1, """
    for i in range(0, 10, 3):
        print(i, end=" ")
    print()
    """, "Counting from 0 in steps of 3 below 10: {out}.")

bug(O, 1, "This should print the numbers 1 to 5. Click the buggy line.", """
    for i in range(1, 5):
        print(i)
    """, 1, "for i in range(1, 6):", "range stops before its end value, so range(1, 5) only reaches 4. Use range(1, 6).")
bug(O, 2, "This should sum the list and print 15. Click the buggy line.", """
    nums = [1, 2, 3, 4, 5]
    total = 0
    for n in nums:
        total = n
    print(total)
    """, 4, "total += n", "`total = n` overwrites the accumulator each time, leaving the last item. Add to it with `+=`.")
bug(O, 2, "This countdown should print 3, 2, 1 and then `liftoff`. Click the buggy line.", """
    n = 3
    while n > 0:
        print(n)
        n += 1
        if n > 10:
            break
    print("liftoff")
    """, 4, "n -= 1", "The counter moves the wrong way, so the loop never counts down (the break only stops it from running forever).")
bug(O, 3, "This should print the index of the first negative number (2). Click the buggy line.", """
    data = [4, 7, -1, 3, -8]
    pos = -1
    for i in range(len(data)):
        if data[i] < 0:
            pos = i
    print(pos)
    """, 5, "pos = i; break", "Without a break the loop keeps going and later negatives overwrite pos, giving the last index (4) instead of the first.")

code(O, 1, "Read a positive integer n and print the numbers from 1 to n, one per line.", """
    n = int(input())
    for i in range(1, n + 1):
        print(i)
    """, ["3", "1", "5"], "Use range(1, n + 1) because the stop value is excluded.")
code(O, 2, "Read a positive integer n and print n factorial (1 x 2 x ... x n).", """
    n = int(input())
    f = 1
    for i in range(2, n + 1):
        f *= i
    print(f)
    """, ["5", "1", "10", "3"], "Start an accumulator at 1 and multiply it by each number from 2 to n.")
code(O, 2, "Read integers one per line until the user enters 0. Then print how many numbers were entered (not counting the 0) and their sum, separated by a space.", """
    count = 0
    total = 0
    while True:
        n = int(input())
        if n == 0:
            break
        count += 1
        total += n
    print(count, total)
    """, ["4\n5\n0", "0", "10\n-2\n7\n1\n0"], "A `while True` loop with a break on the sentinel value (0) handles an unknown number of inputs.")
code(O, 3, "Read a positive integer n and print a right triangle of numbers: line i contains the numbers 1..i separated by spaces. Example n=3:\n1\n1 2\n1 2 3", """
    n = int(input())
    for i in range(1, n + 1):
        print(" ".join(str(j) for j in range(1, i + 1)))
    """, ["3", "1", "5"], "An outer loop picks the row and an inner sequence builds the numbers for that row.")
code(O, 3, "Read a positive integer and print the sum of its digits. Example: `4096` prints `19`.", """
    n = int(input())
    s = 0
    while n > 0:
        s += n % 10
        n //= 10
    print(s)
    """, ["4096", "7", "1111", "98765"], "`n % 10` gives the last digit and `n //= 10` removes it; repeat until n is 0. (Looping over str(n) also works.)")

# ---------------------------------------------------------------- 05 Functions
O = "05"
mcq(O, 1, "Which keyword defines a function?", "def", ["function", "fun", "define"],
    "Functions are defined with `def name(parameters):` followed by an indented body.")
mcq(O, 1, "What does a function return if it has no return statement?", "None", ["0", "An empty string", "It raises an error"],
    "Falling off the end of a function returns None.")
mcq(O, 2, "What is the difference between `print()` and `return` inside a function?", "print shows text on screen; return hands a value back to the caller", ["They are the same", "return shows text; print stores it", "print ends the function"],
    "Printing does not give the caller a value to use. A function that only prints still returns None.")
mcq(O, 2, "Given `def area(w, h=2): return w * h`, what is `area(5)`?", "10", ["5", "7", "TypeError"],
    "h uses its default value 2 when it isn't passed, so 5 * 2 = 10.", verify="def area(w, h=2): return w * h\nprint(area(5))")
mcq(O, 2, "Which call uses a keyword argument?", "greet(name='Kai')", ["greet('Kai')", "greet = 'Kai'", "greet['name']"],
    "A keyword argument passes a value by parameter name: `name='Kai'`.")
mcq(O, 2, "A variable assigned inside a function (without `global`) is...", "local to that function", ["visible everywhere", "automatically returned", "a constant"],
    "Assignment inside a function creates a local variable that disappears when the function returns.")
mcq(O, 3, "What does this print?\n\ndef f(x):\n    x = x + 1\nn = 5\nf(n)\nprint(n)", "5", ["6", "None", "NameError"],
    "Rebinding the parameter x inside f does not change the caller's variable n.", verify="def f(x):\n    x = x + 1\nn = 5\nf(n)\nprint(n)")
mcq(O, 3, "What does this print?\n\ndef add(item, box=[]):\n    box.append(item)\n    return box\nadd(1)\nprint(add(2))", "[1, 2]", ["[2]", "[1]", "[]"],
    "A default list is created once when the function is defined and is shared between calls. Use `box=None` and create a new list inside instead.",
    verify="def add(item, box=[]):\n    box.append(item)\n    return box\nadd(1)\nprint(add(2))")
mcq(O, 2, "How can a function return two values?", "return a, b  (a tuple)", ["return a; return b", "return [a] [b]", "It can't"],
    "`return a, b` packs both values into a tuple, which the caller can unpack: `x, y = f()`.")
mcq(O, 1, "What are the names listed in a function definition's parentheses called?", "parameters", ["arguments", "returns", "modules"],
    "Parameters are the names in the definition; arguments are the actual values passed in a call.")

for a, b in [(3, 4), (10, 2), (7, 7)]:
    out(O, 1, f"""
        def combine(x, y):
            return x * 2 + y

        print(combine({a}, {b}))
        """, f"x gets {a} and y gets {b}, so the function returns {a} * 2 + {b} = {{out}}.")
out(O, 2, """
    def show(n):
        print(n * 2)

    result = show(4)
    print(result)
    """, "show() prints 8 but returns nothing, so result is None. Output: {out}.")
out(O, 2, """
    def power(base, exp=2):
        return base ** exp

    print(power(3), power(2, 5), power(exp=3, base=2))
    """, "The default exp is 2; keyword arguments may come in any order. Output: {out}.")
out(O, 2, """
    count = 10

    def bump():
        count = 99
        return count

    print(bump(), count)
    """, "Assigning count inside bump creates a local variable; the global count stays 10. Output: {out}.")
out(O, 2, """
    def min_max(values):
        return min(values), max(values)

    lo, hi = min_max([4, 9, 1, 7])
    print(hi - lo)
    """, "The function returns a tuple (1, 9) that is unpacked into lo and hi; 9 - 1 = {out}.")
out(O, 3, """
    def first_even(nums):
        for n in nums:
            if n % 2 == 0:
                return n
        return -1

    print(first_even([3, 5, 6, 8]), first_even([1, 3]))
    """, "return exits the function immediately at the first even number; if none is found the loop ends and -1 is returned. Output: {out}.")
out(O, 3, """
    total = 0

    def add(n):
        global total
        total += n

    add(5)
    add(7)
    print(total)
    """, "`global total` makes the assignment update the module-level variable: {out}.")
out(O, 2, """
    def describe(name, *, loud=False):
        text = "hi " + name
        return text.upper() if loud else text

    print(describe("ada"), describe("bo", loud=True))
    """, "loud defaults to False; passing loud=True uppercases the text. Output: {out}.")

bug(O, 1, "`square(4)` should give 16 and the program should print 16. Click the buggy line.", """
    def square(n):
        print(n * n)

    result = square(4) + 0
    print(result)
    """, 2, "return n * n", "The function prints instead of returning, so it returns None and `None + 0` raises a TypeError.")
bug(O, 2, "This should print 6.0, the average of the list. Click the buggy line.", """
    def average(nums):
        total = sum(nums)
        return total / len(nums)
        print("done")

    print(averge([4, 6, 8]))
    """, 6, "print(average([4, 6, 8]))", "The call misspells the function name, raising NameError. (The print after return is unreachable but harmless.)")
bug(O, 3, "This should print `[1]` then `[2]`, each call starting with a fresh list. Click the buggy line.", """
    def collect(x, bucket=[]):
        bucket.append(x)
        return bucket

    print(collect(1))
    print(collect(2))
    """, 1, "def collect(x, bucket=None):\n    bucket = [] if bucket is None else bucket",
    "The default list is created once and shared across calls, so the second call prints [1, 2]. Default to None and create the list inside the function.")
bug(O, 2, "This should print 25. Click the buggy line.", """
    def area(width, height):
        return width * height

    w = 5
    print(area(w))
    """, 5, "print(area(w, w))", "area() requires two arguments; calling it with one raises a TypeError.")

code(O, 1, "Write a function `double(n)` that returns n times 2. Then read an integer and print `double` of it.", """
    def double(n):
        return n * 2

    print(double(int(input())))
    """, ["4", "-3", "0"], "Return the value rather than printing inside the function, then print the returned result.",
    starter="def double(n):\n    # return n times 2\n    pass\n\nprint(double(int(input())))\n")
code(O, 2, "Write `is_prime(n)` returning True when n is a prime number (n > 1 with no divisors other than 1 and itself). Read an integer and print the result.", """
    def is_prime(n):
        if n < 2:
            return False
        for d in range(2, int(n ** 0.5) + 1):
            if n % d == 0:
                return False
        return True

    print(is_prime(int(input())))
    """, ["7", "1", "15", "2", "97"], "Return False as soon as a divisor is found; checking up to the square root is enough.",
    starter="def is_prime(n):\n    pass\n\nprint(is_prime(int(input())))\n")
code(O, 2, "Write `bmi(weight_kg, height_m)` that returns weight / height squared rounded to 1 decimal. Read the weight then the height (floats) and print the result.", """
    def bmi(weight_kg, height_m):
        return round(weight_kg / height_m ** 2, 1)

    w = float(input())
    h = float(input())
    print(bmi(w, h))
    """, ["70\n1.75", "50\n1.6", "90\n1.9"], "Exponentiation binds tighter than division, so `weight / height ** 2` is correct.")
code(O, 3, "Write `count_vowels(text)` returning the number of vowels (a, e, i, o, u, either case). Read a line and print the count.", """
    def count_vowels(text):
        return sum(1 for ch in text.lower() if ch in "aeiou")

    print(count_vowels(input()))
    """, ["Hello World", "rhythm", "AEIOU aeiou", "Python"], "Lower-case the text and count the characters that appear in 'aeiou'.")

# ---------------------------------------------------------------- 06 Strings
O = "06"
mcq(O, 1, "With `s = 'python'`, what is `s[0]`?", "'p'", ["'y'", "'n'", "'python'"],
    "String indexes start at 0.", verify="s = 'python'\nprint(repr(s[0]))")
mcq(O, 1, "With `s = 'python'`, what is `s[-1]`?", "'n'", ["'p'", "'o'", "IndexError"],
    "Negative indexes count from the end; -1 is the last character.", verify="s = 'python'\nprint(repr(s[-1]))")
mcq(O, 2, "With `s = 'python'`, what is `s[1:4]`?", "'yth'", ["'ytho'", "'pyth'", "'yt'"],
    "A slice includes the start index and stops before the end index: indexes 1, 2, 3.", verify="s = 'python'\nprint(repr(s[1:4]))")
mcq(O, 2, "What does `'banana'.count('an')` return?", "2", ["1", "3", "4"],
    "count() counts non-overlapping occurrences: b-an-an-a.", verify="print('banana'.count('an'))")
mcq(O, 2, "What happens with `s = 'cat'` then `s[0] = 'b'`?", "TypeError: strings are immutable", ["s becomes 'bat'", "s becomes 'bcat'", "Nothing"],
    "Strings cannot be changed in place. Build a new string instead: `s = 'b' + s[1:]`.")
mcq(O, 2, "What does `'a,b,,c'.split(',')` return?", "['a', 'b', '', 'c']", ["['a', 'b', 'c']", "['a,b,,c']", "('a', 'b', 'c')"],
    "Splitting on a separator keeps empty strings between consecutive separators.", verify="print('a,b,,c'.split(','))")
mcq(O, 2, "What does `'-'.join(['x', 'y', 'z'])` return?", "'x-y-z'", ["'-x-y-z-'", "['x-y-z']", "'xyz-'"],
    "join() places the separator string between the items.", verify="print(repr('-'.join(['x', 'y', 'z'])))")
mcq(O, 2, "What does `'hello'.find('z')` return?", "-1", ["None", "0", "ValueError"],
    "find() returns -1 when the substring isn't present. (index() would raise ValueError.)", verify="print('hello'.find('z'))")
mcq(O, 1, "Which method removes whitespace from both ends of a string?", "strip()", ["trim()", "split()", "remove()"],
    "strip() removes leading and trailing whitespace; lstrip()/rstrip() do one side.")
mcq(O, 3, "What is `'stressed'[::-1]`?", "'desserts'", ["'stressed'", "'s'", "'detsserts'"],
    "A step of -1 walks the string backwards, reversing it.", verify="print(repr('stressed'[::-1]))")
mcq(O, 2, "What does `'Data Science'.lower().replace(' ', '_')` return?", "'data_science'", ["'Data_Science'", "'data science'", "'DATA_SCIENCE'"],
    "Methods chain left to right: lower() first, then replace the space.", verify="print(repr('Data Science'.lower().replace(' ', '_')))")
mcq(O, 1, "What does `len('hi there')` return?", "8", ["7", "2", "9"],
    "The space counts as a character: h, i, space, t, h, e, r, e.", verify="print(len('hi there'))")

for word in ["notebook", "Mississippi", "algorithm"]:
    out(O, 1, f"""
        w = "{word}"
        print(w[0], w[-1], len(w))
        """, f"Index 0 is the first character, -1 the last, and len() counts all {len(word)} characters: {{out}}.")
for s, a, b in [("computer", 2, 5), ("keyboard", 0, 3), ("database", 4, 8)]:
    out(O, 2, f"""
        s = "{s}"
        print(s[{a}:{b}])
        print(s[:{a}] + s[{b}:])
        """, f"s[{a}:{b}] takes indexes {a} up to {b - 1}; the second line joins everything before {a} with everything from {b} on. Output: {{out}}.")
out(O, 2, """
    line = "  Ada Lovelace  "
    clean = line.strip()
    first, last = clean.split()
    print(last.upper(), first[0] + ".")
    """, "strip() removes the outer spaces, split() breaks on whitespace, then we index and uppercase: {out}.")
out(O, 2, """
    s = "level"
    print(s == s[::-1])
    """, "Reversing 'level' gives the same text, so it is a palindrome: {out}.")
out(O, 2, """
    msg = "one two three"
    words = msg.split()
    print(len(words), "-".join(w[0] for w in words))
    """, "split() gives three words; joining their first letters with '-' gives {out}.")
out(O, 3, """
    s = "hello"
    t = s.replace("l", "L", 1)
    print(s, t)
    """, "replace's third argument limits the number of replacements; s itself is unchanged because strings are immutable. Output: {out}.")
out(O, 2, """
    code = "AB-1234"
    print(code[:2].isalpha(), code[3:].isdigit(), code.startswith("AB"))
    """, "All three checks succeed: {out}.")
out(O, 3, """
    s = "abcdef"
    print(s[::2], s[1::2], s[-3:])
    """, "A step of 2 takes every other character from the start; starting at 1 gives the others; -3: takes the last three. Output: {out}.")

bug(O, 1, "This should print the last character, `n`. Click the buggy line.", """
    word = "python"
    last = word[len(word)]
    print(last)
    """, 2, "last = word[len(word) - 1]", "Valid indexes run from 0 to len - 1, so word[6] raises IndexError. Use len(word) - 1 or simply -1.")
bug(O, 2, "This should print `HELLO`. Click the buggy line.", """
    s = "hello"
    s.upper()
    print(s)
    """, 2, "s = s.upper()", "String methods return new strings; they don't change the original. Assign the result back.")
bug(O, 2, "This should print `3` (the number of words). Click the buggy line.", """
    sentence = "the quick fox"
    words = sentence.split(",")
    print(len(words))
    """, 2, "words = sentence.split()", "The sentence has no commas, so split(',') returns a single item. split() with no argument splits on whitespace.")
bug(O, 3, "This should capitalize the first letter: `Python`. Click the buggy line.", """
    s = "python"
    s[0] = s[0].upper()
    print(s)
    """, 2, "s = s[0].upper() + s[1:]", "Strings are immutable, so item assignment raises TypeError. Build a new string (or use s.capitalize()).")

code(O, 1, "Read a word and print it reversed.", """
    print(input()[::-1])
    """, ["hello", "a", "racecar", "Python3"], "Slicing with a step of -1 reverses a string.")
code(O, 2, "Read a sentence and print the number of words in it.", """
    print(len(input().split()))
    """, ["the quick brown fox", "hello", "  spaced   out  words "], "split() with no arguments splits on any run of whitespace and ignores leading/trailing spaces.")
code(O, 2, "Read a line of text and print `True` if it is a palindrome ignoring case and spaces, otherwise `False`. Example: `Never odd or even` prints `True`.", """
    s = input().lower().replace(" ", "")
    print(s == s[::-1])
    """, ["Never odd or even", "hello", "Taco cat", "ab"], "Normalize the text (lower-case, remove spaces) and compare it to its reverse.")
code(O, 3, "Read a full name like `grace brewster hopper` and print the initials in upper case followed by periods, e.g. `G.B.H.`.", """
    print("".join(w[0].upper() + "." for w in input().split()))
    """, ["grace brewster hopper", "alan turing", "ada"], "Split into words, take each first character, upper-case it and join the pieces.")

# ---------------------------------------------------------------- 07 Lists & tuples
O = "07"
mcq(O, 1, "What does `nums.append(4)` do to `nums = [1, 2, 3]`?", "nums becomes [1, 2, 3, 4]", ["nums becomes [4, 1, 2, 3]", "It returns a new list and nums is unchanged", "nums becomes [1, 2, 3, [4]]"],
    "append() adds one item to the end of the list in place (and returns None).")
mcq(O, 2, "What is the difference between `sort()` and `sorted()`?", "list.sort() sorts in place and returns None; sorted() returns a new sorted list", ["They are identical", "sorted() works only on numbers", "sort() returns a new list"],
    "A common bug is `x = x.sort()`, which sets x to None.")
mcq(O, 2, "After `a = [1, 2]` and `b = a` and `b.append(3)`, what is `a`?", "[1, 2, 3]", ["[1, 2]", "[3]", "[1, 2, [3]]"],
    "`b = a` makes both names refer to the same list object. Use `a.copy()` or `a[:]` for an independent copy.", verify="a = [1, 2]\nb = a\nb.append(3)\nprint(a)")
mcq(O, 2, "What does `[1, 2, 3].pop()` return?", "3", ["1", "None", "[1, 2]"],
    "pop() with no index removes and returns the last item.", verify="print([1, 2, 3].pop())")
mcq(O, 2, "Which statement about tuples is true?", "Tuples are immutable sequences", ["Tuples can grow with append()", "Tuples must contain one type", "Tuples use square brackets"],
    "Tuples, written with parentheses, can't be changed after creation; that makes them safe for fixed records and dictionary keys.")
mcq(O, 2, "What does `[x * 2 for x in range(4)]` produce?", "[0, 2, 4, 6]", ["[2, 4, 6, 8]", "[0, 1, 2, 3, 0, 1, 2, 3]", "[0, 2, 4, 6, 8]"],
    "A list comprehension applies the expression to each value of range(4) = 0..3.", verify="print([x * 2 for x in range(4)])")
mcq(O, 3, "What does `[n for n in range(10) if n % 3 == 0]` produce?", "[0, 3, 6, 9]", ["[3, 6, 9]", "[0, 3, 6]", "[1, 4, 7]"],
    "The if clause keeps only multiples of 3; 0 counts.", verify="print([n for n in range(10) if n % 3 == 0])")
mcq(O, 1, "What does `len([[1, 2], [3]])` return?", "2", ["3", "1", "4"],
    "The outer list has two elements, each of which happens to be a list.", verify="print(len([[1, 2], [3]]))")
mcq(O, 2, "What does `nums.remove(5)` do?", "Removes the first item equal to 5", ["Removes the item at index 5", "Removes every 5", "Returns 5"],
    "remove() deletes by value (first match) and raises ValueError if absent; pop(i) or del removes by index.")
mcq(O, 2, "How do you create a tuple containing just the number 7?", "(7,)", ["(7)", "[7]", "tuple 7"],
    "The trailing comma makes a one-item tuple; (7) is just the number 7 in parentheses.")
mcq(O, 3, "What is `[1, 2] * 2 + [3]`?", "[1, 2, 1, 2, 3]", ["[2, 4, 3]", "[1, 2, 3, 1, 2, 3]", "TypeError"],
    "`*` repeats a list and `+` concatenates lists.", verify="print([1, 2] * 2 + [3])")

for data in [[4, 8, 15, 16, 23, 42], [9, 2, 7, 1], [5, 5, 3]]:
    out(O, 1, f"""
        nums = {data}
        print(nums[1], nums[-2], len(nums))
        """, "Index 1 is the second item, -2 is the second-to-last, and len() counts the items: {out}.")
out(O, 2, """
    a = [3, 1, 2]
    b = sorted(a)
    a.sort(reverse=True)
    print(a, b)
    """, "sorted() made a new ascending list b; then a was sorted in place in descending order. Output: {out}.")
out(O, 2, """
    stack = [1, 2, 3]
    stack.append(4)
    top = stack.pop()
    stack.insert(0, top)
    print(stack)
    """, "Append 4, pop it back off, then insert it at index 0: {out}.")
out(O, 2, """
    m = [[1, 2, 3], [4, 5, 6]]
    print(m[1][0], m[0][-1], len(m[0]))
    """, "m[1] is the second row and [0] its first item; m[0][-1] is the end of the first row. Output: {out}.")
out(O, 2, """
    point = (3, 4)
    x, y = point
    print(x * y, point[0] + point[1])
    """, "Tuple unpacking assigns 3 to x and 4 to y. Output: {out}.")
out(O, 3, """
    a = [1, 2, 3]
    b = a
    c = a[:]
    a.append(4)
    print(len(b), len(c))
    """, "b is another name for the same list, so it sees the append; c is a copy made before it. Output: {out}.")
out(O, 2, """
    words = ["kiwi", "fig", "banana"]
    print([len(w) for w in words], max(words, key=len))
    """, "The comprehension maps each word to its length; max with key=len returns the longest word. Output: {out}.")
out(O, 3, """
    nums = [5, 3, 8, 1]
    nums[1:3] = [0]
    print(nums)
    """, "Assigning to a slice replaces those positions (indexes 1 and 2) with the new items: {out}.")
out(O, 2, """
    scores = [70, 85, 90]
    scores[0] += 10
    print(sum(scores) / len(scores))
    """, "Lists are mutable, so scores[0] becomes 80; the average of 80, 85 and 90 is {out}.")

bug(O, 1, "This should print the numbers in ascending order: `[1, 2, 3]`. Click the buggy line.", """
    nums = [3, 1, 2]
    nums = nums.sort()
    print(nums)
    """, 2, "nums.sort()", "sort() sorts in place and returns None, so assigning its result replaces the list with None.")
bug(O, 2, "This should print `[1, 2, 3]` and keep `original` unchanged as `[1, 2]`. Click the buggy line.", """
    original = [1, 2]
    copy = original
    copy.append(3)
    print(copy, original)
    """, 2, "copy = original.copy()", "Assignment doesn't copy a list; both names share one object. Copy it with .copy() or slicing.")
bug(O, 2, "This should print the last item, 30. Click the buggy line.", """
    values = [10, 20, 30]
    print(values[3])
    """, 2, "print(values[-1])", "With 3 items the valid indexes are 0, 1 and 2, so values[3] raises IndexError.")
bug(O, 3, "This should remove all the odd numbers and print `[2, 4]`. Click the buggy line.", """
    nums = [1, 3, 2, 5, 4]
    for n in nums:
        if n % 2 == 1:
            nums.remove(n)
    print(nums)
    """, 2, "for n in nums[:]:", "Removing items from a list while looping over it shifts positions, so some items are skipped (3 survives). Loop over a copy, or build a new list with a comprehension.")

code(O, 1, "Read integers on one line separated by spaces and print their sum.", """
    nums = [int(x) for x in input().split()]
    print(sum(nums))
    """, ["1 2 3", "10", "-5 5 7 8"], "split() the line, convert each piece with int(), then sum().")
code(O, 2, "Read integers on one line separated by spaces. Print the largest and smallest values, separated by a space.", """
    nums = [int(x) for x in input().split()]
    print(max(nums), min(nums))
    """, ["4 9 1 7", "5", "-3 -8 -1"], "Build a list from the input and use max() and min().")
code(O, 2, "Read words on one line separated by spaces and print them sorted alphabetically, separated by spaces.", """
    print(" ".join(sorted(input().split())))
    """, ["pear apple fig", "zeta alpha", "one"], "sorted() returns a new list; join it back into a single line.")
code(O, 3, "Read integers on one line separated by spaces and print only the even ones (in their original order) separated by spaces. If there are none, print `none`.", """
    evens = [n for n in input().split() if int(n) % 2 == 0]
    print(" ".join(evens) if evens else "none")
    """, ["1 2 3 4", "7 9", "10 -2 5 6"], "Filter with a comprehension, then handle the empty case separately.")
