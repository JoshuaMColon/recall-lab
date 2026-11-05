"""Beginner walkthroughs for every multiple-choice question.

Keyed by the id assigned in source order. Each lesson assumes the reader has
not seen the idea before, then names the right choice and the usual traps.
"""

MCQ_LESSON = {
"d335-01-mcq-01": """Division of whole numbers asks two different questions. How many times does the second number fit? What is left over?

The leftover is called the remainder. The symbol for it is `%`. Picture 17 cookies and 5 people. Each person gets 3 (that uses 15). 2 cookies remain, so `17 % 5` is 2.

`//` answers "how many whole times?" and would give 3. `/` keeps the decimal, so 17 / 5 is 3.4. `**` means "to the power of". Only `%` is the remainder.""",
"d335-01-mcq-02": """In Python 3, the single slash `/` means "divide and keep the fraction". 7 divided by 2 is three and a half, written `3.5`. The result is a float, which is a number that can have a decimal point.

It is not the whole number 3. That would be floor division, written `//`. It is not 3.0 either: 3.0 would mean the math came out even, and 7 / 2 does not. It is not rounded up to 4.

So `7 / 2` is `3.5`.""",
"d335-01-mcq-03": """A variable name is a label you invent. It may use letters, digits, and the underscore `_`. It cannot start with a digit, so `2nd_place` is illegal.

A hyphen is the minus sign. Python reads `total-cost` as "total minus cost", not as one name. `class` is already a Python word, so you cannot use it as a label.

`total_cost` follows the rules: letters and one underscore, and it does not start with a digit.""",
"d335-01-mcq-04": """Python does not simply go left to right. Powers happen first, then multiplication, then addition.

`4 ** 2` is 4 times 4, which is 16. Then `3 * 16` is 48. Then `2 + 48` is 50.

400 would mean someone did `(2 + 3 * 4) ** 2` or grouped differently. 80 and 196 are other grouping mistakes. The value is 50.""",
"d335-01-mcq-05": """Floor division `//` does not chop toward zero. It moves toward negative infinity, which means "down" on the number line, even for negative numbers.

`-7 / 2` is -3.5. The next whole number down from -3.5 is -4, not -3. -3 would be closer to zero. -3.5 is the exact division, which `/` would give, not `//`.

So `-7 // 2` is -4.""",
"d335-01-mcq-06": """`x -= 3` means `x = x - 3`. `x *= 2` means `x = x * 2`. Each line uses the value x has at that moment.

Start at 10. Subtract 3 and x is 7. Multiply by 2 and x is 14.

17 would be 10 + 3 + something else. 4 would be if you subtracted after multiplying. 20 would be if you only multiplied. The stored value is 14.""",
"d335-01-mcq-07": """When two `**` operators sit in a row, Python does the right-hand one first. It does not go left to right.

So `2 ** 3 ** 2` means `2 ** (3 ** 2)`. `3 ** 2` is 9. `2 ** 9` is 512.

64 would be `(2 ** 3) ** 2`, the left-to-right reading. 36 and 12 are other slips. The value is 512.""",
"d335-01-mcq-08": """A float is a number that can have a decimal point, like 2.0 or 8.0. An int is a whole number, like 4.

If you mix them in arithmetic, Python gives you a float. `4 * 2.0` is `8.0`, and the type of that result is float.

It does not stay an int. It is not text. And it does not crash. The type name is float.""",
"d335-01-mcq-09": """`a, b = b, a` swaps two names in one line. Python first notes both values on the right, then stores them on the left. Nothing is lost.

`a = b` followed by `b = a` does not swap. After the first line both names hold the old b, so the original a is gone. `a == b` only asks whether they are equal. It stores nothing. There is no built-in `swap` function.

The one-line swap is `a, b = b, a`.""",
"d335-01-mcq-10": """`round` usually moves to the nearest whole number. The awkward case is exactly halfway, like 2.5.

Python 3 uses banker's rounding: a halfway number goes to the nearest even whole number. 2 is even, 3 is odd, so 2.5 goes to 2. (3.5 would go to 4, because 4 is the even neighbor.)

It does not stay 2.5, and it does not become 2.0 unless you asked for a float. `round(2.5)` is 2.""",
"d335-01-mcq-11": """`abs` means absolute value: how far a number is from zero, written as a positive number. Direction is thrown away.

`abs(-12)` is 12. `abs(12)` is also 12. `abs(0)` is 0.

It does not keep the minus sign, and it does not turn the number into 1 or 0. The result is 12.""",

"d335-02-mcq-01": """`input()` reads what a person types and always gives it back as text. Text is the type called str, short for string. That stays true even if the keys they pressed were digits.

Python does not guess "this looks like a number". If you need a number, you convert it yourself with `int()` for a whole number or `float()` for a decimal.

So the type of `input()` is str.""",
"d335-02-mcq-02": """The person types the character 4. `input()` gives you the text `'4'`, not the number 4.

Multiplying text by a whole number repeats the text. `'4' * 3` is `'444'`, the character three times.

It is not 12, because no addition happened. It is not three separate 4s with spaces. And it is not an error. The screen shows 444.""",
"d335-02-mcq-03": """`int()` can turn a float number into a whole number by chopping off the decimal: `int(3.7)` is 3. It can also read text, but only if that text is a plain whole number.

The text `'3.7'` contains a dot, so `int('3.7')` cannot read it and raises ValueError. `float('3.7')` works, because float is allowed to have a decimal. `str(3.7)` just makes text.

The call that fails is `int('3.7')`. If you need a whole number from that text, do `int(float('3.7'))`.""",
"d335-02-mcq-04": """`print` puts a space between its values unless you say otherwise. `sep` is the separator you want instead of that space.

`sep='-'` means "put a hyphen between them". So `print('a', 'b', 'c', sep='-')` writes `a-b-c`.

It does not glue them into `abc` (that would be an empty separator). It does not keep the spaces. And it does not add an extra hyphen after c. The line is a-b-c.""",
"d335-02-mcq-05": """After it prints, `print` normally starts a new line. `end` replaces that ending. `end='!'` means "end with an exclamation mark and do not start a new line".

So `Hi` is written, then `!`, and the next `print('There')` continues on the same line. You see `Hi!There`.

A new line would appear only if you left `end` alone. There is no space unless you put one in `end`.""",
"d335-02-mcq-06": """An f-string drops a value into text. After the value, a colon starts a format. `.2f` means "show this number with exactly two digits after the decimal point".

`pi` is 3.14159. `f'{pi:.2f}'` rounds it for display and shows `3.14`.

`f'{pi:2}'` is not that format. `f'{pi.2f}'` is a syntax mistake: the colon is missing. `f'{round(pi)}'` would be the whole number 3. The one that prints 3.14 is `f'{pi:.2f}'`.""",
"d335-02-mcq-07": """`int()` on a float chops toward zero. It does not round to the nearest whole number.

`int(9.99)` throws away `.99` and leaves 9. It does not become 10. It does not stay 9.99, because int means a whole number. And it does not raise an error: a float is a legal input to `int()`.

The result is 9.""",
"d335-02-mcq-08": """`str(5)` is the text `'5'`, not the number 5. The `+` sign on two pieces of text glues them. It does not add.

`'5' + '5'` is `'55'`.

10 would be number addition. `'10'` would mean you added first and then made text. `'5 5'` would mean a space was inserted. Nothing here adds a space. The value is the text `'55'`.""",
"d335-02-mcq-09": """Inside an f-string, `:03d` is a format for a whole number. `0` means "pad with zeros". `3` means "make it three characters wide". `d` means "this is an integer".

7 is only one digit, so two zeros are added on the left: `'007'`.

Spaces would be the padding if you did not write the 0. `.000` would be a decimal format, and this is not one. The text is `'007'`.""",
"d335-02-mcq-10": """Reading a whole number is two steps, in this order. First `input()` gets the text. Then `int()` converts that text.

`n = int(input())` does exactly that: the result of input is handed straight to int, and the number is stored in n.

`input(int())` calls int too early, with nothing to convert. `int.input` is not a real function. `int(n) = input()` tries to assign to a call, which is illegal. The working line is `n = int(input())`.""",
"d335-02-mcq-11": """In a format, `>5` means "put this text at the right edge of a field that is 5 characters wide". Empty spots on the left become spaces.

The word `go` is 2 characters, so it needs 3 spaces in front. Then the `|` sits right after the field. You get three spaces, then go, then the bar: `'   go|'`.

`<` would pad on the right instead. A field with no `>` does not move the word. The result is `'   go|'`.""",

"d335-03-mcq-01": """A comparison such as `3 > 2` is a yes-or-no question. 3 is greater than 2, so the answer is True.

`not` flips a yes into a no, or a no into a yes. `not True` is False.

The result is the word False, not the number 3, and not None. `not (3 > 2)` is False.""",
"d335-03-mcq-02": """When the first `if` is false, you can ask another question with `elif`. That is the whole word Python uses. It is short for "else if", but you do not write the space.

`else if` and `elseif` are not Python. `or if` is not a keyword either.

If you really want the two words, you would write `else:` and then a new `if` inside it. The keyword that starts the next check in the same chain is `elif`.""",
"d335-03-mcq-03": """`and` is done before `or`, the way multiplication is done before addition.

`False and False` is False. The expression becomes `True or False`. `or` is true if either side is true, so the whole thing is True.

It is not a syntax error. Python does allow `and` and `or` together. Read it as True or (False and False), not as (True or False) and False.""",
"d335-03-mcq-04": """In an `if`, some values count as no. They are called falsy. The usual ones are: the number 0, the empty text `''`, the empty list `[]`, and `None`. False itself is falsy too.

A string that contains anything, even a space, counts as yes. A list with one item counts as yes, even if that item is 0 or None. The text `'False'` is not the value False. It is a non-empty string, so it counts as yes.

The falsy group in the choices is `0, '', [], None`.""",
"d335-03-mcq-05": """Python lets you chain comparisons. `1 < x < 10` means "x is greater than 1 and x is less than 10". Both parts must be true.

It does not include 1 or 10. "Inclusive" would use `<=`. It is not a syntax error. And Python does not compare the result of `1 < x` (a True or False) against 10.

So the phrase that matches is: x is greater than 1 and less than 10.""",
"d335-03-mcq-06": """`==` asks "are these two values equal?" and gives True or False.

A single `=` does not ask a question. It stores a value in a name. Python has no `===`. And `is equal` is not an operator.

The equality test is `==`.""",
"d335-03-mcq-07": """An `if` / `elif` / `else` chain picks exactly one branch. Python checks from the top and stops at the first true condition. Later branches are skipped even if they would also have been true.

Here x is 15. `x > 10` is true, so branch A runs. `x > 5` is also true, but it is an `elif`, so it is never asked. C is the backup, and it is not used.

Only A runs.""",
"d335-03-mcq-08": """`and` and `or` do not always give True or False. They give you one of the actual values.

`and` walks left to right and returns the first value that counts as no. If both count as yes, it returns the last one. `5 and 0` hits 0, which counts as no, so the result is 0.

`or` returns the first value that counts as yes. `0 or 'x'` skips 0 and returns `'x'`.

`print` shows those two results with a space: `0 x`.""",
"d335-03-mcq-09": """An even number divides by 2 with nothing left over. The leftover is `%`. Zero leftover is `n % 2 == 0`.

`n % 2 == 1` is the odd numbers. `n / 2 == 0` would mean the number divided by 2 is zero, which is not "even". `n // 2 == 1` is only true for 2 and 3, not for every even number.

The even test is `n % 2 == 0`.""",
"d335-03-mcq-10": """Python can compare text. It looks at the first character, then the next, using the same order as the alphabet. `'a'` comes before `'b'`, so `'apple'` comes before `'banana'`.

The comparison is True. It is not an error: two strings are allowed to use `<`. It is not None.

`'apple' < 'banana'` is True.""",
"d335-03-mcq-11": """`bool()` asks "does this count as yes?" Any text that is not empty counts as yes, no matter what the letters say.

The text `'False'` has five characters. It is not empty. So `bool('False')` is True.

The real value False is different from the word written in quotes. No error is raised. The answer is True.""",

"d335-04-mcq-01": """`range(start, stop, step)` builds a list of numbers. It begins at start, adds step each time, and stops before stop. It never includes stop.

`range(2, 8, 2)` starts at 2, then 4, then 6. The next one would be 8, but 8 is the stop, so it is left out.

2, 4, 6, 8 includes the stop. 4, 6, 8 skips the start. The values are 2, 4, 6.""",
"d335-04-mcq-02": """`range(5)` means "start at 0 and stop before 5". The numbers are 0, 1, 2, 3 and 4. Count them: five numbers.

The body of `for i in range(5)` runs once per number, so it runs 5 times. It does not depend on some old value of i. It is not 4, and it is not 6.

It runs 5 times.""",
"d335-04-mcq-03": """`break` means "leave this loop right now". The lines after the loop are what run next.

`continue` only skips the rest of this pass and starts the next pass. `pass` does nothing at all. It is a placeholder. `return` leaves the whole function, not just the loop.

The statement that exits the nearest loop is `break`.""",
"d335-04-mcq-04": """`continue` means "skip the rest of this lap and start the next one". The loop itself keeps going.

It does not end the loop. That is `break`. It does not jump back to the first item and forget the rest. And it is not `pass`, which does nothing.

So continue skips the rest of the current iteration and moves to the next one.""",
"d335-04-mcq-05": """A negative step counts downward. `range(3, 0, -1)` starts at 3, then 2, then 1. It stops before 0, so 0 is not included.

You get `3 2 1` with spaces, because `end=' '` stays on one line.

`3 2 1 0` includes the stop. `0 1 2 3` is counting up. `1 2 3` dropped the start. The print is 3 2 1.""",
"d335-04-mcq-06": """Use `for` with `range` when you know how many times, or you are walking a collection. Use `while` when you do not know the count ahead of time, and you want to keep going until something becomes true. "Ask again until the input is valid" is that kind of job.

`if` does not repeat. A list comprehension builds a list. It is not a prompt loop.

The best fit is `while`.""",
"d335-04-mcq-07": """A `while` loop repeats as long as its check is true. Something inside the loop has to change that check, or it never ends.

Here `i` starts at 0 and the body only prints i. i stays 0. `0 < 3` stays true forever. The program prints 0 over and over.

It is not a syntax error. It does not print 0 1 2, because nothing adds 1 to i. You would write `i += 1` inside the loop to make it stop.""",
"d335-04-mcq-08": """A `for` loop can have an `else`. That `else` runs when the loop finishes the normal way, because it ran out of items. It does not run if you leave early with `break`.

It is not "after every pass". It is not "only if the body never ran", though that can be a side effect. And it is the opposite of "only after a break".

The else runs when the loop finishes without hitting break.""",
"d335-04-mcq-09": """A loop inside a loop multiplies. The outer loop runs 3 times (`range(3)`). Each of those times, the inner loop runs 4 times (`range(4)`).

3 times 4 is 12. Each inner pass prints one line, so 12 lines are printed.

7 would be 3 + 4, which is not how nested loops work. The count is 12.""",
"d335-04-mcq-10": """`range(10, 20)` starts at 10 and stops before 20. The numbers are 10, 11, 12, 13, 14, 15, 16, 17, 18, 19.

Count them: 10 numbers. The width of the range is stop minus start, which is 20 - 10 = 10.

It is not 20, not 9, and not 11. `len(range(10, 20))` is 10.""",

"d335-05-mcq-01": """A function is a named recipe you can run later. Python starts that recipe with the keyword `def`, then the name, then parentheses, then a colon. The steps of the recipe are indented underneath.

`function`, `fun`, and `define` are not Python keywords.

You define a function with `def`.""",
"d335-05-mcq-02": """`return` is how a function hands a value back. If the function never reaches a `return`, Python still has to hand something back. That something is `None`, which means "no value".

It is not 0, and it is not an empty string, unless you returned those on purpose. It is not an error. Reaching the end quietly is allowed.

A function with no return statement returns None.""",
"d335-05-mcq-03": """`print` writes text on the screen for a human to see. The caller does not receive that text as a value. `return` hands a value back to the line that called the function, and it does not by itself show anything.

They are not the same. Print does not end the function the way return does. A function that only prints still returns None to the caller.

print shows text on screen; return hands a value back to the caller.""",
"d335-05-mcq-04": """A parameter can have a default, written with `=` in the definition. If the caller leaves that argument out, the default is used.

`area(w, h=2)` means h is 2 unless you pass something else. `area(5)` sets w to 5 and h to 2. `5 * 2` is 10.

It is not an error, because h has a default. It is not 5, and it is not 7. The result is 10.""",
"d335-05-mcq-05": """A keyword argument names the parameter at the call. You write `name=value`. `greet(name='Kai')` passes the text Kai to the parameter called name.

`greet('Kai')` passes a value too, but by position, not by name. `greet = 'Kai'` stores text in a variable. `greet['name']` looks up a dictionary. Neither one is a call with a keyword.

The keyword call is `greet(name='Kai')`.""",
"d335-05-mcq-06": """A name you assign inside a function belongs to that function. It is local. When the function returns, that name disappears. Code outside cannot see it.

It is not automatically returned. You need `return` for that. It is not visible everywhere, unless you used the `global` statement, and this question says you did not. It is not a constant. Python does not have that rule here.

The variable is local to that function.""",
"d335-05-mcq-07": """Calling `f(n)` copies the value of n into the parameter x. Inside f, `x = x + 1` stores 6 in the local name x. That does not write back into n.

n was 5 before the call and is still 5 after it. There is no NameError, because n exists. The function returns None, but the program prints n, not the return value.

The program prints 5.""",
"d335-05-mcq-08": """A default like `box=[]` is created once, when Python reads the `def` line, not each time you call the function. Every call that skips the argument shares that same list.

`add(1)` appends 1. The shared list is `[1]`. `add(2)` appends 2 to that same list, so it is `[1, 2]`.

`[2]` would be true if each call started a fresh list. To get that, write `box=None` and create `box = []` inside the function when box is None.""",
"d335-05-mcq-09": """A function returns one value. To hand back two numbers, pack them into one tuple with a comma: `return a, b`. The caller can unpack: `x, y = f()`.

`return a` followed by `return b` does not return both. The first return leaves the function, and the second line never runs. `return [a] [b]` is not valid syntax for two values.

The way to return two values is `return a, b`, which is a tuple.""",
"d335-05-mcq-10": """The names written in the `def` parentheses are parameters. They are the slots. The values you pass in a call are arguments. They fill those slots.

People mix the two words up. Arguments are not the names in the definition. Returns are what comes back. Modules are other files.

The names in the definition are parameters.""",

"d335-06-mcq-01": """A string is a row of characters. Positions start at 0, not at 1. For `s = 'python'`, position 0 is `'p'`, position 1 is `'y'`, and the last character `'n'` is position 5.

`'y'` is what you get if you start counting at 1. `'n'` is `s[-1]` or `s[5]`. `'python'` is the whole string, which would be `s`, not `s[0]`.

`s[0]` is `'p'`.""",
"d335-06-mcq-02": """A negative index counts from the end. `-1` means "one step back from the end", which is the last character. You do not have to know the length.

`'python'` ends in `'n'`. `'p'` is the start, index 0. `'o'` is the second to last, index -2. Asking for -1 is legal. It is not an IndexError.

`s[-1]` is `'n'`.""",
"d335-06-mcq-03": """A slice `s[start:stop]` includes the start index and stops before the stop index. `s[1:4]` on `'python'` takes indexes 1, 2 and 3: `'y'`, `'t'`, `'h'`. That is `'yth'`.

`'ytho'` includes index 4, which is the stop, and slices do not include the stop. `'pyth'` started at 0. `'yt'` skipped a character. The slice is `'yth'`.""",
"d335-06-mcq-04": """`count` tells you how many times a piece appears, without overlapping. In `'banana'`, the piece `'an'` appears in "b-an-an-a": once starting at the second letter, and once starting at the fourth.

That is 2. It is not 1, not 3, and not 4. The letters a and n each appear more often, but the question asks for the pair `'an'`.

`'banana'.count('an')` is 2.""",
"d335-06-mcq-05": """Strings are immutable. That means you cannot change a character inside an existing string. `s[0] = 'b'` tries to do that, so Python raises TypeError.

The string does not become `'bat'` or `'bcat'`. And it is not a silent no-op. The line fails.

To get a new string you build one: `s = 'b' + s[1:]`, which is `'bat'`.""",
"d335-06-mcq-06": """`split` cuts a string every time it sees the separator. It keeps an empty piece when two separators are next to each other.

`'a,b,,c'.split(',')` sees a comma, then b, then two commas in a row (an empty piece), then c. The list is `['a', 'b', '', 'c']`.

Dropping the empty string would hide the double comma. The result is a list, not a tuple, and not the original unsplit text.""",
"d335-06-mcq-07": """`join` is the reverse of split. You start with the separator and ask it to glue a list of strings together, with the separator between items.

`'-'.join(['x', 'y', 'z'])` puts a hyphen between x, y and z. That is `'x-y-z'`.

It does not put a hyphen before the first item or after the last. It returns text, not a list. The result is `'x-y-z'`.""",
"d335-06-mcq-08": """`find` looks for a smaller string inside a bigger one and returns the index where it starts. If it is not there, `find` returns -1. It does not crash, and it does not return None.

`'hello'.find('z')` does not find z, so the result is -1. 0 would mean "found at the start".

The related method `index` would raise ValueError instead. `find` is the one that returns -1.""",
"d335-06-mcq-09": """`strip()` removes whitespace from both ends of a string: spaces, tabs, and newlines at the start or the end. It does not remove spaces in the middle. `lstrip` does only the left side. `rstrip` does only the right.

There is no `trim()` in Python. `split()` cuts the string into words. `remove()` is not a string method.

The method that clears both ends is `strip()`.""",
"d335-06-mcq-10": """A slice can take a step as a third number. `[::-1]` means "the whole string, step -1". A step of -1 walks backward, which reverses the string.

`'stressed'` backward is `'desserts'`.

It is not the original word, not just the first character, and not a scrambled typo. The result is `'desserts'`.""",
"d335-06-mcq-11": """Methods run from left to right. `'Data Science'.lower()` first makes `'data science'`. Then `.replace(' ', '_')` changes the space into an underscore.

You get `'data_science'`.

`'Data_Science'` would mean the replace happened before lower. `'DATA_SCIENCE'` would be upper, not lower. `'data science'` forgot the replace. The chained result is `'data_science'`.""",
"d335-06-mcq-12": """`len` counts every character, and a space is a character. `'hi there'` is h, i, space, t, h, e, r, e.

That is 8. 7 would be if you skipped the space. 2 would be if you counted words. 9 would be an extra character that is not there.

`len('hi there')` is 8.""",

"d335-07-mcq-01": """`append` adds one item at the end of the list you already have. It changes that list. It returns None, not a new list.

`nums` starts as `[1, 2, 3]`. After `nums.append(4)` it is `[1, 2, 3, 4]`.

It does not insert at the front. It does not wrap 4 in another list, which is what `append([4])` would do. And nums does change. The list becomes `[1, 2, 3, 4]`.""",
"d335-07-mcq-02": """`sort` rearranges the list you already have and returns None. `sorted` leaves the original alone and returns a new sorted list.

A common bug is `x = x.sort()`. The list is sorted, then x is set to None, and you have lost the name for the list.

They are not identical. `sorted` works on any collection of comparable items, not only numbers. And `sort` does not return a new list. The true statement is: list.sort() sorts in place and returns None; sorted() returns a new sorted list.""",
"d335-07-mcq-03": """`b = a` does not copy a list. Both names point at the same list. Changing the list through b is visible through a.

`b.append(3)` adds 3 to that shared list, so a is `[1, 2, 3]`.

`[1, 2]` would mean a copy was made. To copy, use `a.copy()` or `a[:]`. The value of a is `[1, 2, 3]`.""",
"d335-07-mcq-04": """`pop()` with no index removes the last item and gives that item back to you. The list gets shorter.

`[1, 2, 3].pop()` removes 3 and returns 3. It does not return 1, which would be the first item. It does not return the leftover list. And it does not return None. `append` is the method that returns None.

The returned value is 3.""",
"d335-07-mcq-05": """A tuple is a sequence written with parentheses, like `(3, 4)`. Immutable means you cannot add, remove, or replace items after it is created. There is no `append` on a tuple.

Tuples do not use square brackets. Those are lists. A tuple may hold mixed types. Because a tuple cannot change, it is allowed as a dictionary key. A list is not.

The true statement is: tuples are immutable sequences.""",
"d335-07-mcq-06": """A list comprehension builds a new list by running an expression once per item. `range(4)` is 0, 1, 2, 3. `x * 2` doubles each of those.

0*2, 1*2, 2*2, 3*2 gives `[0, 2, 4, 6]`.

`[2, 4, 6, 8]` started at 1 instead of 0. `[0, 2, 4, 6, 8]` included 4, and range stops before the stop. The list is `[0, 2, 4, 6]`.""",
"d335-07-mcq-07": """The `if` inside a comprehension is a filter. An item is kept only when the check is true. `n % 3 == 0` means "divides by 3 with nothing left over".

`range(10)` includes 0. 0 divided by 3 has remainder 0, so 0 is kept. Then 3, 6 and 9. The list is `[0, 3, 6, 9]`.

`[3, 6, 9]` forgot 0. `[0, 3, 6]` forgot 9. The full result includes both.""",
"d335-07-mcq-08": """`len` counts the items in the outer list only. It does not dive in and count what is inside those items.

`[[1, 2], [3]]` has two items. The first item happens to be a list of two numbers. The second happens to be a list of one number. The outer length is still 2.

It is not 3 (that would add the inner lengths) and not 1. `len` of the outer list is 2.""",
"d335-07-mcq-09": """`remove` deletes by value. It finds the first item equal to what you passed, and deletes that item. `nums.remove(5)` removes the first 5, not "the item at position 5".

It does not return 5. It returns None. It does not remove every 5, only the first. If 5 is missing, it raises ValueError.

Removing by position is `pop(i)` or `del`. Removing by value is `remove`.""",
"d335-07-mcq-10": """Parentheses can mean "this is a tuple" or just "do this math first". A comma is what makes a tuple. A one-item tuple needs a trailing comma so Python can tell: `(7,)` is a tuple holding 7. `(7)` is just the number 7.

`[7]` is a one-item list, not a tuple. `tuple 7` is not syntax.

The one-item tuple is `(7,)`.""",
"d335-07-mcq-11": """`*` on a list repeats the list. `[1, 2] * 2` is `[1, 2, 1, 2]`. It does not multiply the numbers inside.

`+` on lists glues them. `[1, 2, 1, 2] + [3]` is `[1, 2, 1, 2, 3]`.

`[2, 4, 3]` would be number math. `[1, 2, 3, 1, 2, 3]` would be if you added first and then repeated. There is no TypeError. The list is `[1, 2, 1, 2, 3]`.""",

"d335-08-mcq-01": """A dictionary stores each value under a key. You read it with square brackets and the key. Keys that are text need quotes, because the quotes mean "this is text", not "this is a variable name".

`p['age']` looks up the key age. `p[age]` without quotes looks for a variable named age. `p.age` is attribute style, which dicts do not use for keys. `p(age)` would try to call p like a function.

The lookup is `p['age']`.""",
"d335-08-mcq-02": """`d[key]` demands that the key exist. If it does not, Python raises KeyError and stops. It does not return None, or 0, and it does not create the key.

If you want a backup value instead of a crash, use `d.get(key)` or `d.get(key, default)`.

Reading a missing key with square brackets raises a KeyError.""",
"d335-08-mcq-03": """`get` looks up a key and, if the key is missing, returns the backup you supplied instead of crashing.

`{'a': 1}` has no key `'b'`. `get('b', 0)` returns the backup, which is 0. It does not raise KeyError. It does not return None, because you passed 0 as the backup. None would be the backup only if you left it off.

The result is 0.""",
"d335-08-mcq-04": """`in` on a dictionary asks about keys, not values. `'x' in {'x': 5, 'y': 6}` is True because `'x'` is a key. The 5 is a value, and `in` does not look at it.

It does not raise TypeError. To ask about values, use `in d.values()`.

The test checks whether `'x'` is a key.""",
"d335-08-mcq-05": """`items()` walks a dictionary and gives you each key and its value together, as a pair. You can unpack the pair: `for k, v in d.items():`.

`d.keys()` gives only keys, so it cannot unpack into two names. `d.values()` gives only values. `for k, v in d` also walks keys only, and unpacking a key into two names fails unless the key itself is a pair.

The loop that gives you both is `for k, v in d.items():`.""",
"d335-08-mcq-06": """A set keeps each value once. Duplicates are dropped. `set([1, 2, 2, 3, 3, 3])` becomes `{1, 2, 3}`.

There are 3 values left, not 6. `len` of that set is 3.

Order is not the point of a set. Uniqueness is.""",
"d335-08-mcq-07": """Dictionary keys are unique. Assigning to a key that is already there replaces the old value. It does not add a second copy of the key.

It is not a KeyError. KeyError is for reading a missing key. And the dictionary does change.

`d['k'] = new` replaces the old value.""",
"d335-08-mcq-08": """A dictionary key has to be hashable, which for everyday values means it cannot change later. Numbers and strings are fine. A tuple of those is fine, because a tuple cannot change. A list can change, so it cannot be a key. Using one raises TypeError.

So `[1, 2]` cannot be a key. `(1, 2)`, `'12'`, and `12` can.

The one that cannot be a key is `[1, 2]`.""",
"d335-08-mcq-09": """`&` on two sets keeps only the items that are in both. That is called the intersection.

`{1, 2, 3} & {2, 3, 4}` shares 2 and 3. The result is `{2, 3}`.

The union, everything in either set, would be `{1, 2, 3, 4}`, and that operator is `|`, not `&`. `{1, 4}` is what is not shared. The intersection is `{2, 3}`.""",
"d335-08-mcq-10": """`pop` on a dictionary removes a key and gives you the value that was stored there. `d.pop('temp')` deletes `'temp'` and returns its value.

There is no `d.remove` or `d.delete` for this. `d['temp'] = None` does not remove the key. It stores None under that key. `del d['temp']` deletes the key but does not give the value back.

The call that removes the key and returns the value is `d.pop('temp')`.""",

"d335-09-mcq-01": """`int('abc')` fails because the text is not a whole number. The function `int` is willing to receive text. The problem is this particular text. That kind of failure is ValueError.

TypeError would mean the kind of value was not allowed at all, such as adding text to a number. SyntaxError means the program is misspelled and cannot start. NameError means a name was never defined.

`int('abc')` raises ValueError.""",
"d335-09-mcq-02": """Dividing by zero is not allowed. Python raises ZeroDivisionError. That is true for `/`, `//`, and `%`.

It does not return infinity. It does not warn and continue. And it is not a ValueError. The values are the right kind. The math itself is impossible.

`10 / 0` raises ZeroDivisionError.""",
"d335-09-mcq-03": """`+` can add numbers, or it can glue text to text. It cannot mix the two. `'5'` is text and `5` is a number, so `'5' + 5` raises TypeError.

It does not become `'55'` or 10. You would need `str(5)` or `int('5')` first. It is not a syntax error. The line is spelled fine. It fails while running because the types do not match.""",
"d335-09-mcq-04": """A NameError means Python hit a name that has not been given a value in a place it can see. A typo does this. So does using a variable on a line above the line that creates it.

KeyError is a missing dictionary key. IndexError is a bad position in a list or string. ValueError is a value of an acceptable type that still cannot be used.

Using a variable before assigning it raises NameError.""",
"d335-09-mcq-05": """`finally` is the cleanup section of a `try`. It runs when the try succeeds, when an error is caught, and when an error is not caught. It is the "no matter what" block. People use it to close a file or a connection.

It is not "only if there was an error". That is `except`. It is not "only if there was no error". That is `else`.

finally always runs, whether or not an exception occurred.""",
"d335-09-mcq-06": """`try` / `except` / `else` splits three situations. `except` runs when the error you named happens. `else` runs only when the `try` block finishes with no error at all.

It is valid Python. It does not run always, and it does not run when an error was caught.

The else runs when the try block finished without an exception.""",
"d335-09-mcq-07": """A traceback is the stack of calls Python prints when a program crashes. It lists the calls from the outside in. The line that actually failed, and the error name, are at the bottom.

The first line is the outermost call, often your file. It is not the failing line. The failing line is not hidden.

Look at the bottom, just above the error message.""",
"d335-09-mcq-08": """To raise your own error, use `raise` and an error value. `raise ValueError('bad input')` stops the function and carries the message "bad input".

`throw` is not Python. `except` handles an error. It does not raise one. `error(...)` is not a built-in.

The statement is `raise ValueError('bad input')`.""",
"d335-09-mcq-09": """A syntax error means the code is not legal Python, so it cannot start. A missing colon, as in `if x > 3` with no `:`, is that kind of mistake. Python reports it before any line runs.

`int('x')`, `[1][5]`, and `10 / 0` are spelled legally. They fail later, while running: ValueError, IndexError, and ZeroDivisionError.

The syntax error is the `if` that is missing its colon.""",
"d335-09-mcq-10": """A bare `except:` catches every error, including ones you did not expect, such as a typo that raises NameError. If the block then does nothing, the bug disappears and the program continues in a bad state.

It is not limited to KeyError. `except KeyError` would be. It is legal syntax, so that is not the problem. The problem is that it hides bugs you need to see.

Catch the specific error you expect, for example `except ValueError:`.""",

"d335-10-mcq-01": """`import math` loads the math module and gives it the name `math` in your file. Names inside the module are reached through that name: `math.sqrt(16)`.

`sqrt(16)` alone is not defined, because you did not import sqrt by itself. `16.sqrt()` is not how numbers work. There is no `math.root`.

After `import math`, the call is `math.sqrt(16)`.""",
"d335-10-mcq-02": """`from math import pi` copies the name `pi` into your file. After that you write `pi`, not `math.pi`.

It does not copy every math function. Only the names you listed. It does not rename the module. And it is valid.

What it allows is using `pi` directly, without the `math.` prefix.""",
"d335-10-mcq-03": """`as` gives an imported module a shorter or clearer local name. `import random as rnd` loads random and lets you call it `rnd`. `rnd.randint(1, 6)` is a die roll.

It does not import only a piece called rnd. It does not create a random number by itself. And it does not fail.

It imports random under the alias rnd.""",
"d335-10-mcq-04": """A die shows 1, 2, 3, 4, 5, or 6. Both ends count. `random.randint(1, 6)` includes both 1 and 6, so 6 is possible.

`random.randrange(1, 6)` stops before 6, so it is 1 through 5. `random.choice(range(6))` picks from 0 through 5. `random.random() * 6` is a decimal from 0 up to but not including 6, not the integer 6 as a face.

The call that can return 6 is `random.randint(1, 6)`.""",
"d335-10-mcq-05": """`math.floor` rounds down, toward negative infinity. "Down" means toward smaller numbers, not toward zero.

-2.5 is halfway between -3 and -2. The next whole number downward is -3. -2 would be toward zero. -2.5 itself is not a whole number, so floor does not leave it.

`math.floor(-2.5)` is -3.""",
"d335-10-mcq-06": """`math.ceil` rounds up, toward positive infinity. "Up" means toward larger numbers.

4.1 is just above 4. The next whole number upward is 5. Floor would give 4. Ceil does not leave the decimal in place.

`math.ceil(4.1)` is 5.""",
"d335-10-mcq-07": """Every module has a name stored in `__name__`. When you run a file directly, Python sets that name to the text `'__main__'`. When some other file imports it, `__name__` is the module's own name instead, such as `'helpers'`.

It is not the filename, not None, and not the word `'main'` without the underscores.

Inside a file that is being run directly, `__name__` is `'__main__'`.""",
"d335-10-mcq-08": """Importing a module runs its top-level code. If that code includes a demo or a test, the demo would run every time someone imports the file. That is usually not what you want.

`if __name__ == '__main__':` is true only when the file is started directly. Importers skip that block.

The guard is not required for a program to run, and it does not change speed. It runs your demo when the file is executed, and not when it is imported.""",
"d335-10-mcq-09": """`random.choice(items)` returns one element from the list, chosen at random. `random.shuffle(items)` is different: it reorders the whole list in place and returns None.

`items.random`, `random.item`, and `random.pick` are not real functions.

The function that returns one random item is `random.choice(items)`.""",
"d335-10-mcq-10": """`dir(module)` lists the names a module provides. `help(module)` prints the documentation for it. Those are the tools you use from inside Python when you want to know what is there.

`print(module)` shows a short label, not the contents. `import *` dumps names into your file and is not a lookup. `module.list` is not a thing.

Look it up with `dir(module)` or `help(module)`.""",

"d335-11-mcq-01": """The mode is a short letter that says what you intend to do with a file. `'r'` means read. It is also the default if you leave the mode off. The file must already exist.

`'w'` writes and erases what was there. `'a'` appends, adding to the end. `'x'` creates a new file and fails if the file already exists.

The reading mode is `'r'`.""",
"d335-11-mcq-02": """Mode `'w'` means "write, starting over". If the file already exists, its old contents are erased as soon as you open it. Then you write the new text.

New text is not added at the end. That is mode `'a'`. It is not read-only. And it does not raise FileExistsError. That behavior belongs to mode `'x'`.

Opening with `'w'` erases the existing contents before writing.""",
"d335-11-mcq-03": """`with open(...) as f` is a context manager. It opens the file, runs the indented block, and then closes the file for you. The close happens even if the block raises an error. You do not have to remember `f.close()`.

It is not a speed trick, and it is not only for writing. It does not lock the file forever. Closing is the point.

The file is closed automatically when the block ends, even after an error.""",
"d335-11-mcq-04": """`readline()` reads one line, including the newline at the end. When there are no more lines, it returns an empty string `''`. That empty string is how you know you are done.

A blank line in the middle of the file is not the end. It is a line whose text is just the newline, so you get `'\\n'`. You do not get None, and readline does not raise EOFError at the end.

At the end of the file, `readline()` returns `''`.""",
"d335-11-mcq-05": """`write` puts exactly the characters you give it into the file. Unlike `print`, it does not add a newline for you. If you want the next piece on a new line, you include `'\\n'` in the text yourself.

`f.write('hi')` writes h and i and stops. The file contains `hi`, not `hi` plus a new line.

What it does not do automatically is add a newline.""",
"d335-11-mcq-06": """A file object can be looped over. `for line in f:` gives you one line each pass. Each line still ends with `'\\n'` until you strip it.

`f.read()` reads the whole file as one string. Looping over that string gives characters, not lines. `f.lines()` is not a method. `while f` does not walk lines.

The usual pattern is `for line in f:`.""",
"d335-11-mcq-07": """Mode `'r'` only reads. If the file is not there, Python raises FileNotFoundError. It does not create the file for you.

Creating a missing file is what `'w'` or `'a'` will do. A missing file is not a ValueError or a KeyError.

Opening a missing file for reading raises FileNotFoundError.""",
"d335-11-mcq-08": """Each line from `for line in f` includes the newline at the end. `rstrip('\\n')` removes that trailing newline and leaves the rest of the text. `strip()` also works if you are fine removing whitespace on both ends.

`lower()` changes case and keeps the newline. `split()` breaks the line on every space, which is more than removing the newline. `line[1:]` drops the first character, not the last.

The call that drops the trailing newline is `line.rstrip('\\n')`.""",
"d335-11-mcq-09": """`split` cuts on a separator you choose. For a simple comma-separated line, the separator is the comma. `'ana,90,85'.split(',')` gives `['ana', '90', '85']`.

`split()` with no argument splits on whitespace, and this line has no spaces, so you would get one piece. `list(line)` would give a list of characters. `join` glues pieces together. It does not cut.

The call is `line.split(',')`. The csv module is the safer tool when fields can contain quotes, but for this plain line, split on the comma is enough.""",
}

