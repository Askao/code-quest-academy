// A level: Recursion. OCR H446 2.2.1 (recursion, and how it compares with
// iteration); AQA 7517 4.1.1.16 (recursive techniques: base case, the stack
// frames a recursive call uses).
export const topic = "recursion";

export const lessons = [
  {
    title: "Base case and general case",
    summary: "Functions that call themselves, and the case that makes them stop.",
    notes: `
A **recursive** subroutine is one that calls itself. It solves a problem by solving a smaller version of the same problem.

Every recursive subroutine needs two parts:

- a **base case**: a case simple enough to answer straight away, without calling itself. This is what makes the recursion stop;
- a **general case** (or recursive case): where it calls itself on a smaller problem, getting closer to the base case each time.

\`\`\`python
def factorial(n):
    if n <= 1:                     # base case
        return 1
    return n * factorial(n - 1)    # general case

print(factorial(4))                # 24
\`\`\`

\`factorial(4)\` works out \`4 * factorial(3)\`, which needs \`3 * factorial(2)\`, which needs \`2 * factorial(1)\`. \`factorial(1)\` is the base case and returns 1, and the answers multiply back up: 2, 6, 24.

---

**Three checks for any recursive subroutine:**

1. Is there a base case?
2. Does every general case call itself on a *smaller* problem?
3. Will the problem always shrink until it reaches the base case?

If any answer is no, the calls never stop, and Python ends the program with a \`RecursionError\`.
`,
    worked_example: `def sum_to(n):
    if n == 0:
        return 0
    return n + sum_to(n - 1)

print(sum_to(5))`,
    worked_example_note:
      "sum_to(5) is 5 + sum_to(4), and so on down to sum_to(0), the base case, which returns 0. The answers then add back up to 15.",
    quiz: [
      {
        question: "What is the base case of a recursive function?",
        options: [
          "The case it can answer without calling itself",
          "The first time the function is called",
          "The case where it calls itself",
          "The largest input it can handle",
        ],
        answer: "The case it can answer without calling itself",
        explanation: "The base case returns an answer directly, which is what stops the chain of calls.",
      },
      {
        question: "def f(n): return n * f(n - 1) — what is wrong with this function?",
        options: [
          "It has no base case, so it never stops",
          "Nothing",
          "It should call f(n + 1)",
          "Functions can't call themselves",
        ],
        answer: "It has no base case, so it never stops",
        explanation: "Without a base case the calls go on until Python stops the program with a RecursionError.",
      },
      {
        question: "def f(n): if n == 0: return 0; return 2 + f(n - 1). What is f(3)?",
        options: ["6", "3", "8", "0"],
        answer: "6",
        explanation: "f(3) = 2 + f(2) = 2 + 2 + f(1) = 2 + 2 + 2 + f(0) = 6.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Recursive countdown",
        brief: `
Write a **recursive** procedure \`countdown(n)\` that prints \`n\`, then \`n - 1\`, and so on down to 1, each on its own line, and then prints \`Liftoff!\`.

The base case is \`n == 0\`: it just prints \`Liftoff!\`. Don't use a loop.

Input a whole number and call \`countdown\` with it. For example, 3 prints 3, 2, 1, Liftoff!`,
        starter: "def countdown(n):\n    pass\n",
        hints: [
          "if n == 0: print(\"Liftoff!\"), otherwise print n and then call countdown(n - 1).",
          "The recursive call goes after the print, so the numbers come out largest first.",
        ],
        solution: `def countdown(n):
    if n == 0:
        print("Liftoff!")
    else:
        print(n)
        countdown(n - 1)

countdown(int(input()))`,
        inputs: ["3", "0", "5"],
      },
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Power, recursively",
        brief: `
Write a recursive function \`power(base, exponent)\` that returns base raised to the power of exponent, for a whole-number exponent of 0 or more. Don't use \`**\` or \`pow\`.

- Base case: any number to the power 0 is 1.
- General case: base × power(base, exponent − 1).

Input the base and then the exponent (whole numbers, one per line) and print the result. For example, 2 and 5 prints \`32\`.`,
        starter: "def power(base, exponent):\n    pass\n",
        hints: [
          "if exponent == 0: return 1",
          "Otherwise return base * power(base, exponent - 1).",
        ],
        solution: `def power(base, exponent):
    if exponent == 0:
        return 1
    return base * power(base, exponent - 1)

print(power(int(input()), int(input())))`,
        inputs: ["2\n5", "7\n0", "3\n4", "-2\n3"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Add up the digits",
        brief: `
Write a recursive function \`digit_sum(n)\` that returns the sum of the digits of a whole number \`n\` (0 or more).

- \`n % 10\` gives the last digit, and \`n // 10\` gives the number without its last digit.
- Base case: a number below 10 is its own digit sum.

Input a whole number and print its digit sum. For example, 4096 prints \`19\`.`,
        starter: "def digit_sum(n):\n    pass\n",
        hints: [
          "if n < 10: return n",
          "Otherwise return n % 10 + digit_sum(n // 10).",
        ],
        solution: `def digit_sum(n):
    if n < 10:
        return n
    return n % 10 + digit_sum(n // 10)

print(digit_sum(int(input())))`,
        inputs: ["4096", "7", "0", "999999"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Reverse a word",
        brief: `
Write a recursive function \`reverse(text)\` that returns \`text\` backwards. Don't use slicing with a step (\`[::-1]\`), \`reversed\` or a loop.

Think of it this way: the reverse of a word is the reverse of everything after the first letter, followed by the first letter. The base case is an empty string, whose reverse is itself.

Input a word and print it reversed. For example, \`python\` prints \`nohtyp\`.`,
        starter: "def reverse(text):\n    pass\n",
        hints: [
          "text[0] is the first letter and text[1:] is everything after it.",
          "return reverse(text[1:]) + text[0], with if text == \"\": return \"\" as the base case.",
        ],
        solution: `def reverse(text):
    if text == "":
        return ""
    return reverse(text[1:]) + text[0]

print(reverse(input()))`,
        inputs: ["python", "a", "racecar", "level up"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Palindrome check",
        brief: `
A palindrome reads the same backwards as forwards, like \`racecar\`.

Write a recursive function \`is_palindrome(word)\` that returns \`True\` or \`False\`:
- a word of 0 or 1 letters is a palindrome (base case);
- otherwise, it's a palindrome only if its first and last letters match **and** the middle part (without them) is a palindrome.

Ignore capital letters by working on the lower-case version. Input a word and print \`True\` or \`False\`.`,
        starter: "def is_palindrome(word):\n    pass\n",
        hints: [
          "word[1:-1] is the word without its first and last letters.",
          "Call it with is_palindrome(input().lower()).",
        ],
        solution: `def is_palindrome(word):
    if len(word) <= 1:
        return True
    if word[0] != word[-1]:
        return False
    return is_palindrome(word[1:-1])

print(is_palindrome(input().lower()))`,
        inputs: ["racecar", "Hannah", "python", "ab", "x"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Multiply by adding",
        brief: `
Write a recursive function \`multiply(a, b)\` that returns a × b for whole numbers, with \`b\` 0 or more, **using only addition**.

- Base case: anything multiplied by 0 is 0.
- General case: a × b is a + (a × (b − 1)).

Input \`a\` and then \`b\`, one per line, and print the result.`,
        starter: "def multiply(a, b):\n    pass\n",
        hints: [
          "if b == 0: return 0",
          "return a + multiply(a, b - 1)",
        ],
        solution: `def multiply(a, b):
    if b == 0:
        return 0
    return a + multiply(a, b - 1)

print(multiply(int(input()), int(input())))`,
        inputs: ["6\n7", "5\n0", "-3\n4"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 25,
        title: "Count a letter",
        brief: `
Write a recursive function \`count(text, letter)\` that returns how many times \`letter\` appears in \`text\`. Don't use \`.count()\` or a loop.

Base case: an empty string contains the letter 0 times. General case: look at the first character (1 if it matches, 0 if not) and add the count for the rest of the string.

Input a line of text and then a single letter, and print the count.`,
        starter: "def count(text, letter):\n    pass\n",
        hints: [
          "if text == \"\": return 0",
          "(1 if text[0] == letter else 0) + count(text[1:], letter)",
        ],
        solution: `def count(text, letter):
    if text == "":
        return 0
    return (1 if text[0] == letter else 0) + count(text[1:], letter)

print(count(input(), input()))`,
        inputs: ["banana\na", "banana\nz", "mississippi\ns"],
      },
    ],
  },
  {
    title: "The call stack",
    summary: "How recursive calls are stored, what happens on the way back up, and recursion versus iteration.",
    notes: `
Every time a subroutine is called, the computer pushes a **stack frame** onto the **call stack**. The frame holds that call's parameters, its local variables and the **return address** (where to carry on when it finishes). When the call returns, its frame is popped off.

With recursion, each call gets its own frame, so each has its own copy of \`n\`:

\`\`\`
factorial(3)   waiting for factorial(2)
factorial(2)   waiting for factorial(1)
factorial(1)   base case: returns 1      <- top of the stack
\`\`\`

The frames are popped in reverse order, so any code that comes **after** the recursive call runs on the way back up:

\`\`\`python
def show(n):
    if n == 0:
        return
    print("Down", n)
    show(n - 1)
    print("Up", n)     # runs as the frames come off the stack
\`\`\`

---

**Recursion or iteration?** Anything recursive can be written with a loop, and the other way round.

- Recursion can be much shorter and clearer for problems that are naturally recursive: trees, mazes, divide-and-conquer sorts.
- But every call uses a stack frame, so deep recursion uses a lot of memory and can cause a **stack overflow** (Python raises \`RecursionError\` after about 1000 levels). Each call also takes time to set up.
- A loop uses the same memory however many times it repeats.
`,
    worked_example: `def show(n):
    if n == 0:
        print("Base case")
        return
    print("Down", n)
    show(n - 1)
    print("Up", n)

show(2)`,
    worked_example_note:
      "Down 2 and Down 1 print as the calls go onto the stack. After the base case, each frame finishes the rest of its code as it comes off, so Up 1 prints before Up 2.",
    quiz: [
      {
        question: "What is stored in a stack frame?",
        options: [
          "The call's parameters, local variables and return address",
          "The whole program",
          "Only the final answer",
          "The global variables",
        ],
        answer: "The call's parameters, local variables and return address",
        explanation: "Each call gets its own frame, which is why every recursive call has its own copy of n.",
      },
      {
        question: "Why can very deep recursion crash a program?",
        options: [
          "Each call adds a stack frame, and the stack runs out of space",
          "Recursive functions can't return values",
          "The base case runs too often",
          "Python can't call a function more than once",
        ],
        answer: "Each call adds a stack frame, and the stack runs out of space",
        explanation: "This is a stack overflow. Python stops it with a RecursionError after about 1000 levels.",
      },
      {
        question: "In show(n) from the notes, why does Up 1 print before Up 2?",
        options: [
          "Frames come off the stack in the reverse order they went on",
          "Python prints smaller numbers first",
          "The base case prints Up 1",
          "It doesn't; Up 2 prints first",
        ],
        answer: "Frames come off the stack in the reverse order they went on",
        explanation: "show(1)'s frame is on top of show(2)'s, so it finishes, and prints Up 1, first.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 3,
        xp: 25,
        title: "Down and back up",
        brief: `
Write a recursive procedure \`show(n)\` that:
- if \`n\` is 0, prints \`Base case\` and stops;
- otherwise prints \`Down n\`, calls \`show(n - 1)\`, and then prints \`Up n\`.

Input a whole number and call \`show\` with it. For example, 2 prints:
\`\`\`
Down 2
Down 1
Base case
Up 1
Up 2
\`\`\``,
        starter: "def show(n):\n    pass\n",
        hints: [
          "The print(\"Up\", n) line goes after the recursive call, so it runs on the way back up.",
          "Use print(\"Down\", n) to get a space between the word and the number.",
        ],
        solution: `def show(n):
    if n == 0:
        print("Base case")
        return
    print("Down", n)
    show(n - 1)
    print("Up", n)

show(int(input()))`,
        inputs: ["2", "0", "4"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Sum a list recursively",
        brief: `
Write a recursive function \`sum_list(items)\` that returns the total of a list of numbers, without using \`sum\` or a loop.

- Base case: an empty list adds up to 0.
- General case: the first item plus the sum of the rest of the list.

Input a line of whole numbers separated by spaces (it may be empty) and print their total.`,
        starter: "def sum_list(items):\n    pass\n",
        hints: [
          "items[0] is the first item and items[1:] is the rest.",
          "if not items: return 0",
        ],
        solution: `def sum_list(items):
    if not items:
        return 0
    return items[0] + sum_list(items[1:])

print(sum_list([int(x) for x in input().split()]))`,
        inputs: ["1 2 3 4", "", "-5 5 10", "42"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "How many calls?",
        brief: `
This is the simplest recursive Fibonacci function. It is short, but it repeats a lot of work.

\`\`\`python
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

Add a global counter, \`calls\`, that goes up by 1 **every time \`fib\` is called** (put it as the first thing \`fib\` does). Input \`n\`, then print \`fib(n)\` and, on the next line, \`Calls: \` followed by the number of calls it took.

For example, 5 prints \`5\` then \`Calls: 15\`. Try 20 to see how fast the number of calls grows.`,
        starter: `calls = 0

def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
`,
        hints: [
          "The first two lines of fib should be global calls and calls = calls + 1.",
          "Store fib(n) in a variable before printing calls, so all the calls have happened first.",
        ],
        solution: `calls = 0

def fib(n):
    global calls
    calls = calls + 1
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

n = int(input())
answer = fib(n)
print(answer)
print("Calls: " + str(calls))`,
        inputs: ["5", "1", "10", "20"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Largest item, recursively",
        brief: `
Write a recursive function \`largest(items)\` that returns the biggest number in a list that has at least one item. Don't use \`max\` or a loop.

- Base case: a list with one item: that item is the largest.
- General case: compare the first item with the largest of the rest of the list, and return whichever is bigger.

Input a line of whole numbers separated by spaces and print the largest.`,
        starter: "def largest(items):\n    pass\n",
        hints: [
          "if len(items) == 1: return items[0]",
          "rest = largest(items[1:]), then return items[0] if it is bigger than rest, otherwise rest.",
        ],
        solution: `def largest(items):
    if len(items) == 1:
        return items[0]
    rest = largest(items[1:])
    return items[0] if items[0] > rest else rest

print(largest([int(x) for x in input().split()]))`,
        inputs: ["3 9 2 7", "5", "-4 -2 -9", "1 1 1"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Towers of Hanoi",
        brief: `
In the Towers of Hanoi puzzle, \`n\` discs sit on peg A, largest at the bottom. Move them all to peg C, one disc at a time, never putting a bigger disc on a smaller one. Peg B is spare.

The recursive solution to move \`n\` discs from a peg \`source\` to a peg \`target\` using a peg \`spare\`:
1. move \`n − 1\` discs from \`source\` to \`spare\`;
2. move disc \`n\` from \`source\` to \`target\`;
3. move \`n − 1\` discs from \`spare\` to \`target\`.

Moving 0 discs does nothing (the base case). Write \`hanoi(n, source, target, spare)\` that prints each move as \`Move disc <d> from <peg> to <peg>\`. Input \`n\` and call \`hanoi(n, "A", "C", "B")\`, then print \`Moves: \` and the number of moves made.`,
        starter: "",
        hints: [
          "Step 1 is hanoi(n - 1, source, spare, target) and step 3 is hanoi(n - 1, spare, target, source).",
          "Count the moves with a global counter, or work it out: it is always 2 to the power n, minus 1.",
        ],
        solution: `moves = 0

def hanoi(n, source, target, spare):
    global moves
    if n == 0:
        return
    hanoi(n - 1, source, spare, target)
    print("Move disc " + str(n) + " from " + source + " to " + target)
    moves = moves + 1
    hanoi(n - 1, spare, target, source)

hanoi(int(input()), "A", "C", "B")
print("Moves: " + str(moves))`,
        inputs: ["1", "2", "3"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Count up on the way back",
        brief: `
Write a recursive procedure \`count_up(n)\` that prints the numbers from 1 up to \`n\`, one per line, **without a loop**, by printing *after* the recursive call.

Base case: \`n == 0\` prints nothing. Input a whole number and call \`count_up\` with it.`,
        starter: "def count_up(n):\n    pass\n",
        hints: [
          "Call count_up(n - 1) first, then print(n).",
          "The prints happen as each frame comes off the stack, smallest first.",
        ],
        solution: `def count_up(n):
    if n == 0:
        return
    count_up(n - 1)
    print(n)

count_up(int(input()))`,
        inputs: ["3", "1", "6"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Binary, recursively",
        brief: `
Write a recursive function \`to_binary(n)\` that returns the binary form of a whole number \`n\` (0 or more) as a string. Don't use \`bin\` or \`format\`.

- Base case: 0 is \`"0"\` and 1 is \`"1"\`.
- General case: the binary of \`n // 2\`, followed by the last bit, \`n % 2\`.

Input a whole number and print its binary. For example, 10 prints \`1010\`.`,
        starter: "def to_binary(n):\n    pass\n",
        hints: [
          "if n < 2: return str(n)",
          "return to_binary(n // 2) + str(n % 2)",
        ],
        solution: `def to_binary(n):
    if n < 2:
        return str(n)
    return to_binary(n // 2) + str(n % 2)

print(to_binary(int(input())))`,
        inputs: ["10", "0", "255", "1"],
      },
    ],
  },
  {
    title: "Recursive algorithms",
    summary: "Binary search, Euclid's algorithm and other problems that split neatly into smaller copies of themselves.",
    notes: `
Some algorithms are naturally recursive because each step leaves a smaller copy of the same problem.

**Binary search**, recursively: look at the middle item of a sorted list. If it's the target, you're done. If not, search only the half the target must be in, which is the same problem on a smaller list.

\`\`\`python
def search(items, target, low, high):
    if low > high:
        return -1                      # base case: nothing left
    mid = (low + high) // 2
    if items[mid] == target:
        return mid                     # base case: found
    if items[mid] < target:
        return search(items, target, mid + 1, high)
    return search(items, target, low, mid - 1)
\`\`\`

Passing \`low\` and \`high\` instead of slicing the list means no copies are made.

---

**Euclid's algorithm** finds the highest common factor (greatest common divisor) of two numbers: the HCF of \`a\` and \`b\` is the same as the HCF of \`b\` and \`a % b\`, and the HCF of \`a\` and 0 is \`a\`.

Recursion is also the natural way to handle data that contains smaller copies of itself, such as a list that contains lists, or a grid where you explore every neighbouring square.
`,
    worked_example: `def hcf(a, b):
    if b == 0:
        return a
    return hcf(b, a % b)

print(hcf(48, 18))`,
    worked_example_note:
      "hcf(48, 18) becomes hcf(18, 12), then hcf(12, 6), then hcf(6, 0), the base case, which returns 6.",
    quiz: [
      {
        question: "In recursive binary search, what is the base case when the target isn't in the list?",
        options: [
          "low becomes greater than high, so there is nothing left to search",
          "The middle item is the target",
          "The list has one item",
          "There isn't one",
        ],
        answer: "low becomes greater than high, so there is nothing left to search",
        explanation: "Each call narrows the range; when it is empty (low > high) the search returns -1.",
      },
      {
        question: "Why does binary search need the list to be sorted?",
        options: [
          "So it knows which half the target must be in",
          "So it runs recursively",
          "Because it starts at the first item",
          "It doesn't need to be sorted",
        ],
        answer: "So it knows which half the target must be in",
        explanation: "Comparing with the middle item only tells you which half to search if everything smaller is on one side.",
      },
      {
        question: "Using Euclid's rule hcf(a, b) = hcf(b, a % b), what is hcf(20, 8)?",
        options: ["4", "8", "2", "20"],
        answer: "4",
        explanation: "hcf(20, 8) = hcf(8, 4) = hcf(4, 0) = 4.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Euclid's algorithm",
        brief: `
Write a recursive function \`hcf(a, b)\` that returns the highest common factor of two whole numbers using Euclid's algorithm:
- if \`b\` is 0, the answer is \`a\`;
- otherwise the answer is \`hcf(b, a % b)\`.

Input two whole numbers (one per line) and print their HCF. For example, 48 and 18 prints \`6\`.`,
        starter: "def hcf(a, b):\n    pass\n",
        hints: [
          "if b == 0: return a",
          "Otherwise return hcf(b, a % b).",
        ],
        solution: `def hcf(a, b):
    if b == 0:
        return a
    return hcf(b, a % b)

print(hcf(int(input()), int(input())))`,
        inputs: ["48\n18", "7\n13", "100\n25", "9\n0"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Recursive binary search",
        brief: `
Write a recursive function \`search(items, target, low, high)\` that uses binary search to find \`target\` in the sorted list \`items\`, looking only between positions \`low\` and \`high\`. It returns the target's position, or -1 if it isn't there. Don't use a loop or \`.index()\`.

Input a line of whole numbers in ascending order, separated by spaces, then a target. Call \`search(items, target, 0, len(items) - 1)\`. Print the position, or \`Not found\` if it returns -1.

For example, \`2 5 8 12 16\` and \`12\` prints \`3\`.`,
        starter: "def search(items, target, low, high):\n    pass\n",
        hints: [
          "Base cases: low > high returns -1; items[mid] == target returns mid.",
          "If items[mid] < target, search the right half: search(items, target, mid + 1, high).",
        ],
        solution: `def search(items, target, low, high):
    if low > high:
        return -1
    mid = (low + high) // 2
    if items[mid] == target:
        return mid
    if items[mid] < target:
        return search(items, target, mid + 1, high)
    return search(items, target, low, mid - 1)

items = [int(x) for x in input().split()]
position = search(items, int(input()), 0, len(items) - 1)
print("Not found" if position == -1 else position)`,
        inputs: ["2 5 8 12 16\n12", "2 5 8 12 16\n2", "2 5 8 12 16\n7", "4\n4", "1 3 5 7 9 11 13\n13"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Flatten a nested list",
        brief: `
A list can contain other lists, which can contain more lists. Write a recursive function \`flatten(items)\` that returns one flat list of all the numbers, in order.

For each item: if it is itself a list (\`isinstance(item, list)\`), flatten it and add all of its numbers; otherwise add the item.

The starter code reads the input as a Python list for you. Print the flattened numbers separated by spaces. For example, \`[1, [2, [3, 4]], 5]\` prints \`1 2 3 4 5\`.`,
        starter: "import ast\n\ndef flatten(items):\n    pass\n\ndata = ast.literal_eval(input())\n",
        hints: [
          "Start with result = [] and use result.extend(flatten(item)) for an item that is a list.",
          "For an item that isn't a list, result.append(item).",
        ],
        solution: `import ast

def flatten(items):
    result = []
    for item in items:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result

data = ast.literal_eval(input())
print(" ".join(str(x) for x in flatten(data)))`,
        inputs: ["[1, [2, [3, 4]], 5]", "[[[7]]]", "[1, 2, 3]", "[[1, 2], [], [3, [4, [5, 6]]]]"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "Every arrangement",
        brief: `
Write a recursive function \`arrangements(letters)\` that returns a list of every way of ordering the letters in a string. For example, \`abc\` has six: abc, acb, bac, bca, cab, cba.

- Base case: a string of one letter has one arrangement: itself.
- General case: for each letter, put it first, followed by every arrangement of the remaining letters.

Input a word whose letters are all different. Print every arrangement in alphabetical order, one per line.`,
        starter: "def arrangements(letters):\n    pass\n",
        hints: [
          "For position i, the remaining letters are letters[:i] + letters[i + 1:].",
          "Collect them all in a list, then print sorted(arrangements(word)) one per line.",
        ],
        solution: `def arrangements(letters):
    if len(letters) <= 1:
        return [letters]
    result = []
    for i in range(len(letters)):
        for rest in arrangements(letters[:i] + letters[i + 1:]):
            result.append(letters[i] + rest)
    return result

for a in sorted(arrangements(input())):
    print(a)`,
        inputs: ["abc", "z", "cat", "dog"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Flood fill",
        brief: `
A paint program's fill tool colours every connected empty square. A grid is made of \`.\` (empty) and \`#\` (wall).

Write a recursive function \`fill(grid, r, c)\` that fills square (r, c) and every empty square connected to it by going up, down, left or right. It changes each filled square to \`*\` and returns how many squares it filled. If (r, c) is outside the grid, a wall, or already filled, it fills nothing and returns 0.

Input the number of rows, then each row as a line of \`.\` and \`#\`, then a starting row and column (counted from 0), each on its own line. Print the number of squares filled, then the grid after filling.`,
        starter: "",
        hints: [
          "Store the grid as a list of lists of characters, so squares can be changed: [list(row) for row in rows].",
          "After marking grid[r][c] = \"*\", return 1 + fill for each of the four neighbours.",
        ],
        solution: `def fill(grid, r, c):
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
        return 0
    if grid[r][c] != ".":
        return 0
    grid[r][c] = "*"
    return 1 + fill(grid, r + 1, c) + fill(grid, r - 1, c) + fill(grid, r, c + 1) + fill(grid, r, c - 1)

rows = int(input())
grid = [list(input()) for i in range(rows)]
r = int(input())
c = int(input())
print(fill(grid, r, c))
for row in grid:
    print("".join(row))`,
        inputs: ["3\n..#\n.##\n#..\n0\n0", "2\n##\n#.\n0\n0", "4\n....\n.##.\n.#..\n....\n2\n2"],
      },
    ],
    homework: [
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Paths through a grid",
        brief: `
A robot starts at the top-left corner of a grid and can only move right or down. Write a recursive function \`paths(rows, cols)\` that returns how many different routes there are to the bottom-right corner of a grid with that many rows and columns.

- Base case: if there is only 1 row or only 1 column, there is exactly 1 route.
- General case: the routes after moving down plus the routes after moving right: \`paths(rows - 1, cols) + paths(rows, cols - 1)\`.

Input the rows and columns (one per line) and print the number of routes. Keep both numbers 10 or under.`,
        starter: "def paths(rows, cols):\n    pass\n",
        hints: [
          "if rows == 1 or cols == 1: return 1",
          "A 2 by 2 grid has 2 routes; a 3 by 3 grid has 6.",
        ],
        solution: `def paths(rows, cols):
    if rows == 1 or cols == 1:
        return 1
    return paths(rows - 1, cols) + paths(rows, cols - 1)

print(paths(int(input()), int(input())))`,
        inputs: ["2\n2", "3\n3", "1\n9", "5\n4"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Total of a nested list",
        brief: `
Write a recursive function \`total(items)\` that adds up every number in a list that may contain lists inside lists, at any depth.

The starter code reads the input as a Python list for you. Print the total. For example, \`[1, [2, 3], [[4]]]\` prints \`10\`.`,
        starter: "import ast\n\ndef total(items):\n    pass\n\ndata = ast.literal_eval(input())\n",
        hints: [
          "For each item: if isinstance(item, list), add total(item); otherwise add the item itself.",
          "An empty list has a total of 0, which a for loop starting from 0 gives you automatically.",
        ],
        solution: `import ast

def total(items):
    result = 0
    for item in items:
        if isinstance(item, list):
            result = result + total(item)
        else:
            result = result + item
    return result

data = ast.literal_eval(input())
print(total(data))`,
        inputs: ["[1, [2, 3], [[4]]]", "[]", "[[[]], 5, [-5, [10]]]"],
      },
    ],
  },
];
