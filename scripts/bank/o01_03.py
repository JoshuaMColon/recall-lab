from lib import mcq, out, bug, code

# ---------------------------------------------------------------- 01 Variables, expressions & operators
O = "01"
mcq(O, 1, "Which operator gives the remainder after integer division?", "%", ["//", "/", "**"],
    "`%` (modulo) returns the remainder: 17 % 5 is 2. `//` is floor division (the whole-number quotient), `/` is true division and always gives a float, and `**` is exponentiation.")
mcq(O, 1, "What is the value of `7 / 2` in Python 3?", "3.5", ["3", "4", "3.0"],
    "In Python 3 the `/` operator always performs true division and returns a float, so 7 / 2 is 3.5. Use `//` if you want the floor quotient 3.", verify="print(7 / 2)")
mcq(O, 1, "Which of these is a valid variable name?", "total_cost", ["2nd_place", "total-cost", "class"],
    "Names may contain letters, digits and underscores but cannot start with a digit. A hyphen is read as minus, and `class` is a reserved keyword.")
mcq(O, 2, "What is the value of `2 + 3 * 4 ** 2`?", "50", ["400", "80", "196"],
    "Exponentiation binds tightest (4 ** 2 = 16), then multiplication (3 * 16 = 48), then addition (2 + 48 = 50).", verify="print(2 + 3 * 4 ** 2)")
mcq(O, 2, "What does `-7 // 2` evaluate to?", "-4", ["-3", "-3.5", "3"],
    "Floor division rounds toward negative infinity, not toward zero. -3.5 floors to -4.", verify="print(-7 // 2)")
mcq(O, 2, "After `x = 10` then `x -= 3` then `x *= 2`, what is x?", "14", ["17", "4", "20"],
    "Augmented assignment updates in place: 10 - 3 = 7, then 7 * 2 = 14.", verify="x = 10\nx -= 3\nx *= 2\nprint(x)")
mcq(O, 2, "What is `2 ** 3 ** 2`?", "512", ["64", "36", "12"],
    "`**` is right-associative, so it is evaluated as 2 ** (3 ** 2) = 2 ** 9 = 512.", verify="print(2 ** 3 ** 2)")
mcq(O, 1, "What type is the result of `4 * 2.0`?", "float", ["int", "str", "It raises a TypeError"],
    "Mixing an int and a float in arithmetic promotes the result to float: 4 * 2.0 is 8.0.", verify="print(type(4 * 2.0).__name__)")
mcq(O, 2, "Which statement swaps the values of `a` and `b` in one line?", "a, b = b, a", ["a = b; b = a", "a == b", "swap(a, b)"],
    "Tuple packing/unpacking evaluates the right side first, then assigns, so `a, b = b, a` swaps. `a = b; b = a` loses the original value of a.")
mcq(O, 3, "What is `round(2.5)` in Python 3?", "2", ["3", "2.5", "3.0"],
    "Python 3 uses banker's rounding (round half to even), so 2.5 rounds to 2 while 3.5 rounds to 4.", verify="print(round(2.5))")
mcq(O, 1, "What does `abs(-12)` return?", "12", ["-12", "0", "1"],
    "`abs()` returns the absolute (non-negative) value of a number.", verify="print(abs(-12))")

for a, b in [(17, 5), (29, 4), (100, 7), (8, 3)]:
    out(O, 1, f"""
        a = {a}
        b = {b}
        print(a // b, a % b)
        """, f"`{a} // {b}` is the whole-number quotient and `{a} % {b}` is what is left over. print() separates its arguments with a space, so the output is {{out}}.")
for x0, s, m in [(5, 3, 2), (12, 4, 3), (1, 9, 10)]:
    out(O, 1, f"""
        x = {x0}
        x += {s}
        x *= {m}
        x -= 1
        print(x)
        """, f"Work step by step: {x0} + {s} = {x0+s}, times {m} = {(x0+s)*m}, minus 1 = {{out}}.")
for e in ["10 - 4 - 3", "(10 - 4) * 2 ** 2", "18 / 3 * 2", "7 + 8 // 3 % 2"]:
    out(O, 2, f"print({e})", f"Apply precedence: parentheses, then `**`, then `* / // %` left to right, then `+ -` left to right. `{e}` evaluates to {{out}}. (Remember `/` always produces a float.)")
out(O, 2, """
    a = 3
    b = a
    a = a + 4
    print(a, b)
    """, "`b = a` copies the current value 3 into b. Changing `a` afterwards does not affect b, so the output is {out}.")
out(O, 2, """
    price = 19.99
    qty = 3
    total = price * qty
    print(round(total, 2))
    """, "19.99 * 3 is 59.97 (with tiny floating-point noise that round(..., 2) removes). Output: {out}.")
out(O, 3, """
    n = 7
    n = n ** 2 % 10
    print(n)
    """, "`**` runs first: 7 ** 2 = 49, then 49 % 10 = 9. Output: {out}.")

bug(O, 1, "This program should print the average of three scores (85.0). Click the buggy line.", """
    s1 = 80
    s2 = 85
    s3 = 90
    avg = s1 + s2 + s3 / 3
    print(avg)
    """, 4, "avg = (s1 + s2 + s3) / 3",
    "Division binds tighter than addition, so only s3 was divided by 3. Parentheses force the sum to be computed first.")
bug(O, 2, "This should convert 100 minutes to hours and minutes and print `1 40`. Click the buggy line.", """
    total = 100
    hours = total / 60
    minutes = total % 60
    print(hours, minutes)
    """, 2, "hours = total // 60",
    "`/` gives 1.6666…, not a whole number of hours. Floor division `//` gives the whole hours (1).")
bug(O, 2, "This should double the counter and print 10. Click the buggy line.", """
    counter = 5
    counter =* 2
    print(counter)
    """, 2, "counter *= 2",
    "The augmented operator is `*=`. Written as `=*` Python reads `counter = *2`, which is a syntax error.")

code(O, 1, "Read an integer number of seconds and print it as minutes and seconds separated by a space. Example: input `125` prints `2 5`.", """
    s = int(input())
    print(s // 60, s % 60)
    """, ["125", "59", "3600", "61"],
    "Floor division by 60 gives whole minutes and `% 60` gives the leftover seconds.")
code(O, 2, "Read the radius of a circle (a float) and print its area rounded to 2 decimal places. Use 3.14159 for pi. Example: `2` prints `12.57`.", """
    r = float(input())
    print(round(3.14159 * r ** 2, 2))
    """, ["2", "1", "10.5", "0.3"],
    "Area is pi times r squared: `3.14159 * r ** 2`. `round(value, 2)` keeps two decimal places.")
code(O, 2, "Read two integers on separate lines, a and b. Print their sum, difference (a - b) and product on one line separated by spaces. Example: `7` and `3` print `10 4 21`.", """
    a = int(input())
    b = int(input())
    print(a + b, a - b, a * b)
    """, ["7\n3", "2\n9", "-4\n-6", "0\n5"],
    "Read each line with input(), convert with int(), and pass the three expressions to a single print().")

# ---------------------------------------------------------------- 02 Input, output & type conversion
O = "02"
mcq(O, 1, "What type does `input()` always return?", "str", ["int", "It depends on what the user types", "float"],
    "input() returns the typed text as a string, even if it looks like a number. Convert it with int() or float() before doing arithmetic.")
mcq(O, 1, "If the user types `4`, what does `print(input() * 3)` show?", "444", ["12", "4 4 4", "An error"],
    "The input is the string '4'. Multiplying a string by an int repeats it, giving '444'.", verify="print('4' * 3)")
mcq(O, 1, "Which call raises a ValueError?", "int('3.7')", ["float('3.7')", "int(3.7)", "str(3.7)"],
    "int() can convert a float value (truncating it) but it cannot parse a string that contains a decimal point. Use int(float('3.7')) for that.")
mcq(O, 2, "What does `print('a', 'b', 'c', sep='-')` print?", "a-b-c", ["a b c", "abc", "a-b-c-"],
    "`sep` replaces the default space placed between arguments.", verify="print('a', 'b', 'c', sep='-')")
mcq(O, 2, "What does `print('Hi', end='!')` followed by `print('There')` display?", "Hi!There", ["Hi!\nThere", "Hi There!", "Hi\n!There"],
    "`end` replaces the newline normally printed after the arguments, so the next print continues on the same line.", verify="print('Hi', end='!')\nprint('There')")
mcq(O, 2, "Which f-string prints `3.14` when `pi = 3.14159`?", "f'{pi:.2f}'", ["f'{pi:2}'", "f'{pi.2f}'", "f'{round(pi)}'"],
    "The format spec `.2f` means fixed-point with 2 digits after the decimal point.")
mcq(O, 1, "What does `int(9.99)` return?", "9", ["10", "9.99", "A ValueError"],
    "int() truncates toward zero when given a float; it does not round.", verify="print(int(9.99))")
mcq(O, 2, "What does `str(5) + str(5)` evaluate to?", "'55'", ["10", "'10'", "'5 5'"],
    "Both sides are strings, so + concatenates them.")
mcq(O, 3, "What does `f'{7:03d}'` produce?", "'007'", ["'7  '", "'  7'", "'7.000'"],
    "The spec `03d` pads the integer with zeros to a width of 3.", verify="print(repr(f'{7:03d}'))")
mcq(O, 2, "Which line correctly reads a whole number from the user into `n`?", "n = int(input())", ["n = input(int())", "n = int.input()", "int(n) = input()"],
    "Call input() first to get the text, then wrap it in int() to convert it.")
mcq(O, 3, "What does `f'{\"go\":>5}|'` produce?", "'   go|'", ["'go   |'", "' go  |'", "'go|'"],
    "`>5` right-aligns the value in a field 5 characters wide, padding on the left with spaces.", verify="print(repr(f'{\"go\":>5}|'))")

for name, age in [("Ana", "20"), ("Raj", "34"), ("Lee", "9")]:
    out(O, 1, """
        name = input()
        age = int(input())
        print(f"{name} will be {age + 1} next year")
        """, "input() reads each line as text; int() converts the age so that +1 is arithmetic. The f-string inserts the values: {out}.", stdin=f"{name}\n{age}")
for v in ["2.5", "10", "0.125"]:
    out(O, 2, """
        x = float(input())
        print(x * 2, int(x * 2))
        """, "float() parses the text, multiplication keeps it a float, and int() truncates the decimal part. Output: {out}.", stdin=v)
out(O, 1, "print('A', 'B', sep='')\nprint('C', end=' ')\nprint('D')",
    "`sep=''` removes the space between A and B; `end=' '` keeps D on the same line as C. Output: {out}.")
out(O, 2, "total = 7\ncount = 2\nprint(f'avg={total / count:.1f}')",
    "7 / 2 is 3.5 and `.1f` shows one decimal place: {out}.")
out(O, 2, "x = '12'\ny = 3\nprint(x * y)\nprint(int(x) * y)",
    "A string times an int repeats the string; after int() conversion it is ordinary multiplication. Output: {out}.")
out(O, 3, "amount = 1234.5\nprint(f'${amount:,.2f}')",
    "The `,` option adds thousands separators and `.2f` gives two decimals: {out}.")
out(O, 2, "n = int('  42 ')\nprint(n + 1)", "int() ignores surrounding whitespace, so '  42 ' becomes 42 and the result is {out}.")

bug(O, 1, "This should read two numbers and print their sum. For input 3 and 4 it should print 7. Click the buggy line.", """
    a = input()
    b = int(input())
    print(a + b)
    """, 1, "a = int(input())", "Line 1 leaves `a` as a string, so `a + b` tries to add a str and an int and raises a TypeError. Convert both inputs.", stdin="3\n4")
bug(O, 2, "This should print `Total: 12`. Click the buggy line.", """
    count = 12
    message = "Total: " + count
    print(message)
    """, 2, 'message = "Total: " + str(count)', "You cannot concatenate a str and an int. Convert with str() or use an f-string.")
bug(O, 2, "This should print the price with two decimals: `Price: 5.50`. Click the buggy line.", """
    price = 5.5
    print(f"Price: {price:.2}")
    """, 2, 'print(f"Price: {price:.2f}")', "`.2` alone means 2 significant digits (giving 5.5). `.2f` means 2 digits after the decimal point.")

code(O, 1, "Read a name and print `Hello, <name>!`. Example: `Sam` prints `Hello, Sam!`.", """
    name = input()
    print(f"Hello, {name}!")
    """, ["Sam", "Grace Hopper", "x"], "An f-string (or concatenation) builds the greeting from the input text.")
code(O, 2, "Read a temperature in Fahrenheit (may be a decimal) and print it in Celsius with exactly 1 decimal place. Formula: (F - 32) * 5 / 9. Example: `212` prints `100.0`.", """
    f = float(input())
    c = (f - 32) * 5 / 9
    print(f"{c:.1f}")
    """, ["212", "32", "98.6", "-40", "0"], "Convert with float(), apply the formula with parentheses, and format with `:.1f`.")
code(O, 2, "Read an item name, a quantity (int) and a unit price (float), one per line. Print `<qty> x <name> = $<total>` with the total to 2 decimals. Example: `pen`, `3`, `1.25` prints `3 x pen = $3.75`.", """
    name = input()
    qty = int(input())
    price = float(input())
    print(f"{qty} x {name} = ${qty * price:.2f}")
    """, ["pen\n3\n1.25", "notebook\n2\n4.5", "eraser\n10\n0.3"], "Convert each input to the right type, multiply, then format the money with `.2f`.")

# ---------------------------------------------------------------- 03 Branching & Boolean logic
O = "03"
mcq(O, 1, "What is the value of `not (3 > 2)`?", "False", ["True", "None", "3"],
    "3 > 2 is True and `not` flips it to False.", verify="print(not (3 > 2))")
mcq(O, 1, "Which keyword starts an alternative condition checked only if the earlier `if` was false?", "elif", ["else if", "elseif", "or if"],
    "Python spells it `elif`. `else if` would need a nested if inside an else block.")
mcq(O, 2, "What is `True or False and False`?", "True", ["False", "None", "A SyntaxError"],
    "`and` binds tighter than `or`, so this is True or (False and False) = True or False = True.", verify="print(True or False and False)")
mcq(O, 2, "Which values are falsy in Python?", "0, '', [], None", ["0, 'False', [0]", "Only False", "' ', 0.0, [None]"],
    "Zero numbers, empty containers/strings and None are falsy. A string with a space or a list containing one element is truthy.")
mcq(O, 2, "What does `1 < x < 10` mean in Python?", "x is greater than 1 and less than 10", ["(1 < x) is compared to 10", "A syntax error", "x is between 1 and 10 inclusive"],
    "Python chains comparisons: `1 < x < 10` is the same as `1 < x and x < 10`.")
mcq(O, 1, "Which operator tests equality?", "==", ["=", "===", "is equal"],
    "`==` compares values; a single `=` is assignment. Python has no `===`.")
mcq(O, 2, "With `x = 15`, which branch runs?\n\nif x > 10: A\nelif x > 5: B\nelse: C", "A only", ["A and B", "B only", "C only"],
    "An if/elif/else chain runs only the first branch whose condition is true and skips the rest.")
mcq(O, 3, "What is printed by `print(5 and 0, 0 or 'x')`?", "0 x", ["False x", "True True", "5 0"],
    "`and` returns the first falsy operand (or the last one); `or` returns the first truthy operand. So 5 and 0 is 0, and 0 or 'x' is 'x'.", verify="print(5 and 0, 0 or 'x')")
mcq(O, 2, "Which condition is True when `n` is an even number?", "n % 2 == 0", ["n / 2 == 0", "n // 2 == 1", "n % 2 == 1"],
    "An even number leaves remainder 0 when divided by 2.")
mcq(O, 2, "What does `'apple' < 'banana'` evaluate to?", "True", ["False", "TypeError", "None"],
    "Strings compare lexicographically by character code; 'a' comes before 'b'.", verify="print('apple' < 'banana')")
mcq(O, 3, "What is `bool('False')`?", "True", ["False", "None", "ValueError"],
    "Any non-empty string is truthy, including the text 'False'.", verify="print(bool('False'))")

for score in [95, 82, 71, 40]:
    out(O, 1, f"""
        score = {score}
        if score >= 90:
            grade = "A"
        elif score >= 80:
            grade = "B"
        elif score >= 70:
            grade = "C"
        else:
            grade = "F"
        print(grade)
        """, f"The chain checks conditions top to bottom and stops at the first true one. For {score} the result is {{out}}.")
for t in [15, 25, 35]:
    out(O, 2, f"""
        temp = {t}
        if temp > 20:
            print("warm")
        if temp > 30:
            print("hot")
        else:
            print("ok")
        """, "These are two separate if statements, so both are evaluated; the else belongs only to the second. Output: {out}.")
out(O, 2, """
    a = 4
    b = 9
    if a > 5 or b > 5 and a == 4:
        print("yes")
    else:
        print("no")
    """, "`and` is evaluated before `or`: a > 5 is False, but (b > 5 and a == 4) is True, so the whole condition is True: {out}.")
out(O, 2, """
    items = []
    if items:
        print("has items")
    else:
        print("empty")
    """, "An empty list is falsy, so the else branch runs: {out}.")
out(O, 3, """
    x = 7
    print(x > 5 and x < 10, not x == 7, x != 8)
    """, "Each expression is evaluated independently: True, False (because x == 7 is True), True. Output: {out}.")
out(O, 2, """
    year = 2024
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    print(leap)
    """, "2024 is divisible by 4 and not by 100, so it is a leap year: {out}.")

bug(O, 1, "This should print `adult` for ages 18 and up. With age 18 it prints `minor`. Click the buggy line.", """
    age = 18
    if age > 18:
        print("adult")
    else:
        print("minor")
    """, 2, "if age >= 18:", "`>` excludes 18 itself. Use `>=` to include the boundary.")
bug(O, 2, "For a score of 95 this should print only `A`, but it prints two grades. Click the buggy line.", """
    score = 95
    if score >= 90:
        print("A")
    if score >= 80:
        print("B")
    else:
        print("C")
    """, 4, "elif score >= 80:", "Line 4 starts a brand-new if statement, so it is checked even after the A branch ran. Making it `elif` joins it to the same chain, so only the first matching branch runs.")
bug(O, 2, "This should print `weekend` when day is \"Sat\". It prints weekend for every day. Click the buggy line.", """
    day = "Mon"
    if day == "Sat" or "Sun":
        print("weekend")
    else:
        print("weekday")
    """, 2, 'if day == "Sat" or day == "Sun":', "`\"Sun\"` on its own is a non-empty string, which is always truthy. Each comparison needs its own `day ==`, or use `day in (\"Sat\", \"Sun\")`.")

code(O, 1, "Read an integer and print `even` or `odd`.", """
    n = int(input())
    print("even" if n % 2 == 0 else "odd")
    """, ["4", "7", "0", "-3"], "Use `n % 2 == 0` to test for even numbers.")
code(O, 2, "Read a whole-number score (0-100) and print the letter grade: 90+ A, 80+ B, 70+ C, 60+ D, otherwise F.", """
    s = int(input())
    if s >= 90:
        print("A")
    elif s >= 80:
        print("B")
    elif s >= 70:
        print("C")
    elif s >= 60:
        print("D")
    else:
        print("F")
    """, ["95", "80", "79", "60", "12", "100"], "Check thresholds from highest to lowest with if/elif so the first match wins.")
code(O, 2, "Read three integers (one per line) and print the largest without using max().", """
    a = int(input())
    b = int(input())
    c = int(input())
    big = a
    if b > big:
        big = b
    if c > big:
        big = c
    print(big)
    """, ["1\n2\n3", "9\n4\n7", "-5\n-2\n-9", "6\n6\n1"], "Keep the best value so far and replace it whenever you see a bigger one.")
code(O, 3, "Read a year and print `leap` if it is a leap year, otherwise `common`. Leap years are divisible by 4, except century years, which must be divisible by 400.", """
    y = int(input())
    if y % 400 == 0 or (y % 4 == 0 and y % 100 != 0):
        print("leap")
    else:
        print("common")
    """, ["2024", "2023", "1900", "2000", "2100"], "Combine the rules with and/or and parentheses: divisible by 400, or by 4 but not by 100.")
