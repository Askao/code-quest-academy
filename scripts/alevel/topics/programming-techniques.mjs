// A level: Programming techniques. OCR H446 2.2.1 (local and global
// variables, parameter passing by value and by reference); AQA 7517 4.1.1
// (local and global variables, exception handling).
export const topic = "programming-techniques";

export const lessons = [
  {
    title: "Local and global variables",
    summary: "Where a variable can be used, the global keyword, and why parameters are usually better.",
    notes: `
At GCSE you saw that a variable made inside a function only exists while that function runs. At A level you need the proper words for this, and to know when each kind is the right choice.

- A **local variable** is created inside a subroutine. Its **scope** is that subroutine: nothing outside can see it, and it disappears when the subroutine ends.
- A **global variable** is created outside every subroutine. Its scope is the whole program.

\`\`\`python
total = 0          # global

def show():
    message = "hi"  # local to show()
    print(message, total)
\`\`\`

A function can **read** a global without doing anything special. To **change** one, Python needs the \`global\` keyword, otherwise the assignment quietly creates a new local variable with the same name:

\`\`\`python
count = 0

def add_one():
    global count
    count = count + 1
\`\`\`

---

**Why avoid globals?** Any part of the program can change a global, so when its value is wrong it is hard to find out which line did it. Functions that use globals also can't be reused or tested on their own. The cleaner habit is to pass values in as **parameters** and send results back with \`return\`:

\`\`\`python
def add_one(count):
    return count + 1

count = add_one(count)
\`\`\`

Globals are still reasonable for values that never change while the program runs, such as a VAT rate. These are often written in capitals (\`VAT_RATE = 0.2\`) to show they are constants.
`,
    worked_example: `score = 0

def add_points(points):
    global score
    score = score + points

add_points(5)
add_points(3)
print(score)`,
    worked_example_note:
      "Without `global score`, the line inside add_points would try to make a new local score from a local score that doesn't exist yet, and Python would stop with an UnboundLocalError.",
    quiz: [
      {
        question: "A variable is created inside a function. Which statement is true?",
        options: [
          "It can only be used inside that function",
          "It can be used anywhere in the program",
          "It keeps its value between calls to the function",
          "It must be declared with the global keyword",
        ],
        answer: "It can only be used inside that function",
        explanation: "A variable made inside a subroutine is local: its scope is that subroutine, and it is gone once the subroutine ends.",
      },
      {
        question: "Why do programmers usually avoid global variables?",
        options: [
          "Any part of the program can change them, which makes errors hard to trace",
          "Python does not allow them",
          "They use more memory than local variables",
          "They cannot hold numbers",
        ],
        answer: "Any part of the program can change them, which makes errors hard to trace",
        explanation: "Because every subroutine can change a global, a wrong value could have come from anywhere. Parameters and return values keep each subroutine self-contained.",
      },
      {
        question: "count = 0, and a function runs count = count + 1 without the global keyword. What happens?",
        options: [
          "An error: Python treats count as a new local variable that has no value yet",
          "The global count becomes 1",
          "Nothing happens",
          "A new global called count is made",
        ],
        answer: "An error: Python treats count as a new local variable that has no value yet",
        explanation: "Assigning to count inside the function makes it local, so the count on the right-hand side refers to a local that doesn't exist yet: an UnboundLocalError.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Count with a global",
        brief: `
The program starts with a global variable \`count\` set to 0.

Write the function \`add_one()\` so that each call adds 1 to the global \`count\`. Use the \`global\` keyword.

Then input a whole number. Call \`add_one()\` that many times, and print \`count\`.

For example, an input of 3 prints \`3\`.`,
        starter: "count = 0\n\ndef add_one():\n    pass\n",
        hints: [
          "Inside the function, the first line should be `global count`.",
          "Use a for loop with range() to call add_one() the right number of times, then print count after the loop.",
        ],
        solution: `count = 0

def add_one():
    global count
    count = count + 1

n = int(input())
for i in range(n):
    add_one()
print(count)`,
        inputs: ["3", "0", "7"],
      },
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Fix the score that never changes",
        brief: `
This program should input a new score, store it in the global variable \`score\`, and print it. Instead it always prints 0.

Find the bug and fix it, keeping the function \`set_score\`.`,
        starter: `score = 0

def set_score(new_score):
    score = new_score

value = int(input())
set_score(value)
print(score)
`,
        hints: [
          "Inside set_score, the line score = new_score creates a brand new local variable. The global score is never touched.",
          "Add `global score` as the first line of set_score.",
        ],
        solution: `score = 0

def set_score(new_score):
    global score
    score = new_score

value = int(input())
set_score(value)
print(score)`,
        inputs: ["5", "12", "0"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Running total without a global",
        brief: `
Write a function \`add_to_total(total, amount)\` that returns \`total + amount\`. It must not use any global variables.

Then input a whole number \`n\`, followed by \`n\` more whole numbers, one per line. Starting from a total of 0, use your function to add each number to the total. Print the final total.

For example, the input 3, 10, 20, 5 prints \`35\`.`,
        starter: "def add_to_total(total, amount):\n    pass\n",
        hints: [
          "The function only needs one line: return total + amount.",
          "Keep the total in your own variable outside the function: total = add_to_total(total, value).",
        ],
        solution: `def add_to_total(total, amount):
    return total + amount

n = int(input())
total = 0
for i in range(n):
    value = int(input())
    total = add_to_total(total, value)
print(total)`,
        inputs: ["3\n10\n20\n5", "1\n-4", "0"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "A simple bank account",
        brief: `
A bank account's balance is kept in a global variable \`balance\`, starting at 0.

Write two functions:
- \`deposit(amount)\` adds \`amount\` to the balance.
- \`withdraw(amount)\` takes \`amount\` away from the balance, but only if there is enough money. If there isn't, it leaves the balance alone and prints \`Insufficient funds\`.

The program then reads commands, one per line, until it reads \`end\`. Each command is a word and a whole number, such as \`deposit 50\` or \`withdraw 20\`. Carry out each command, then print the final balance.

For example, deposit 50, withdraw 80, withdraw 20, end prints \`Insufficient funds\` and then \`30\`.`,
        starter: "balance = 0\n\ndef deposit(amount):\n    pass\n\ndef withdraw(amount):\n    pass\n",
        hints: [
          "Both functions change balance, so both need `global balance`.",
          "Split each command with .split() to get the word and the number, and loop until the line is end.",
        ],
        solution: `balance = 0

def deposit(amount):
    global balance
    balance = balance + amount

def withdraw(amount):
    global balance
    if amount > balance:
        print("Insufficient funds")
    else:
        balance = balance - amount

line = input()
while line != "end":
    word, number = line.split()
    if word == "deposit":
        deposit(int(number))
    else:
        withdraw(int(number))
    line = input()
print(balance)`,
        inputs: ["deposit 50\nwithdraw 80\nwithdraw 20\nend", "deposit 10\ndeposit 15\nend", "withdraw 5\nend"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        stretch: true,
        title: "Score keeper",
        brief: `
A games console keeps two global variables: \`high_score\` (starting at 0) and \`games_played\` (starting at 0).

Write a procedure \`record(score)\` that adds 1 to \`games_played\`, and updates \`high_score\` if this score beats it.

Input the number of games, then each game's score (whole numbers, one per line). Call \`record\` for each one. Then print two lines:
- \`High score: \` followed by the high score
- \`Games played: \` followed by the number of games

For example, games scoring 40, 75 and 60 print \`High score: 75\` then \`Games played: 3\`.`,
        starter: "",
        hints: [
          "record changes both globals, so it needs `global high_score, games_played`.",
          "Only replace high_score when score > high_score.",
        ],
        solution: `high_score = 0
games_played = 0

def record(score):
    global high_score, games_played
    games_played = games_played + 1
    if score > high_score:
        high_score = score

n = int(input())
for i in range(n):
    record(int(input()))
print("High score: " + str(high_score))
print("Games played: " + str(games_played))`,
        inputs: ["3\n40\n75\n60", "1\n0", "4\n10\n9\n30\n30"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Visitor counter",
        brief: `
A museum counts visitors with a global variable \`visitors\`, starting at 0.

Write a function \`arrive(group_size)\` that adds \`group_size\` to \`visitors\`.

Input how many groups arrive, then the size of each group (whole numbers, one per line). Call \`arrive\` for each group and print the total number of visitors.`,
        starter: "visitors = 0\n\ndef arrive(group_size):\n    pass\n",
        hints: [
          "arrive changes the global, so start it with `global visitors`.",
          "Loop once per group, reading each size with int(input()).",
        ],
        solution: `visitors = 0

def arrive(group_size):
    global visitors
    visitors = visitors + group_size

for i in range(int(input())):
    arrive(int(input()))
print(visitors)`,
        inputs: ["2\n4\n6", "3\n1\n1\n1", "0"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 25,
        title: "Return it, don't make it global",
        brief: `
Write a function \`apply_discount(price)\` that **returns** the price after a 25% discount. Don't use any global variables.

The main program is already written underneath: it inputs a price (a decimal number) and prints what your function returns, rounded to 2 decimal places. For example, \`100\` prints \`75.0\`.`,
        starter: `def apply_discount(price):
    pass

price = float(input())
print(round(apply_discount(price), 2))
`,
        hints: [
          "25% off leaves 75% of the price: price * 0.75.",
          "End the function with return price * 0.75, so the main program gets the answer back.",
        ],
        solution: `def apply_discount(price):
    return price * 0.75

price = float(input())
print(round(apply_discount(price), 2))`,
        inputs: ["100", "19.99", "8"],
      },
    ],
  },
  {
    title: "Passing by value and by reference",
    summary: "What happens to a variable when it is passed to a subroutine, and why lists behave differently.",
    notes: `
When you call a subroutine, the values you pass in are called **arguments**. There are two ways a language can pass them:

- **By value**: the subroutine gets a *copy*. Changing it inside the subroutine does not change the caller's variable.
- **By reference**: the subroutine gets the *original* (its address in memory). Changing it inside the subroutine changes the caller's variable too.

OCR's exam pseudocode lets you choose with \`byVal\` and \`byRef\`:

\`\`\`
procedure addBonus(byRef score:int, byVal bonus:int)
    score = score + bonus
endprocedure
\`\`\`

---

Python has no \`byVal\` or \`byRef\` keywords. It always passes a reference to the object, and what you see depends on whether the object can be changed:

- **Numbers, strings and tuples can't be changed** (they are *immutable*). Assigning a new value inside a function only changes the local name, so they behave **like passing by value**.
- **Lists and dictionaries can be changed in place** (they are *mutable*). \`.append()\`, \`.pop()\` or \`items[0] = ...\` inside a function change the caller's list, so they behave **like passing by reference**.

\`\`\`python
def change(n, items):
    n = n + 1          # only the local n changes
    items.append(99)   # the caller's list changes

x = 5
nums = [1, 2]
change(x, nums)
print(x, nums)         # 5 [1, 2, 99]
\`\`\`

If a function must not change the caller's list, work on a copy: \`items = list(items)\` or \`items[:]\`.
`,
    worked_example: `def double_all(values):
    for i in range(len(values)):
        values[i] = values[i] * 2

marks = [3, 5, 8]
double_all(marks)
print(marks)`,
    worked_example_note:
      "double_all returns nothing, yet marks has changed: values and marks are two names for the same list, so changing values[i] changes marks. A whole number passed the same way could not have been changed.",
    quiz: [
      {
        question: "A parameter is passed by value. What does the subroutine receive?",
        options: ["A copy of the value", "The original variable", "The variable's name", "Nothing until it is returned"],
        answer: "A copy of the value",
        explanation: "By value means a copy is passed, so changes inside the subroutine don't affect the caller's variable.",
      },
      {
        question: "def f(a): a.append(4)  —  nums = [1, 2, 3]; f(nums); print(nums). What is printed?",
        options: ["[1, 2, 3, 4]", "[1, 2, 3]", "[4]", "An error"],
        answer: "[1, 2, 3, 4]",
        explanation: "Lists can be changed in place, and a and nums are the same list, so append changes nums too.",
      },
      {
        question: "def f(n): n = n * 10  —  x = 3; f(x); print(x). What is printed?",
        options: ["3", "30", "None", "An error"],
        answer: "3",
        explanation: "Whole numbers can't be changed in place. n = n * 10 only makes the local name n point at a new number; x is still 3.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Add to the shopping list",
        brief: `
Write a procedure \`add_item(shopping, item)\` that adds \`item\` to the end of the list \`shopping\`. It should not return anything: the change to the list is enough.

Then input three items, one per line. Starting with an empty list, call \`add_item\` for each one, and print the list's items separated by \`, \`.

For example, bread, milk, eggs prints \`bread, milk, eggs\`.`,
        starter: "def add_item(shopping, item):\n    pass\n",
        hints: [
          "shopping.append(item) changes the caller's list, because lists are passed like references.",
          "Print with \", \".join(shopping).",
        ],
        solution: `def add_item(shopping, item):
    shopping.append(item)

shopping = []
for i in range(3):
    add_item(shopping, input())
print(", ".join(shopping))`,
        inputs: ["bread\nmilk\neggs", "apples\napples\npears", "tea\njam\nbutter"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Don't change the original",
        brief: `
This program should print the original numbers and then a doubled copy. But the function changes the original list as well, so both lines come out doubled.

Fix \`doubled\` so it returns a **new** list and leaves \`values\` alone. The rest of the program should stay the same.

For example, an input of \`1 2 3\` should print \`[1, 2, 3]\` and then \`[2, 4, 6]\`.`,
        starter: `def doubled(values):
    for i in range(len(values)):
        values[i] = values[i] * 2
    return values

nums = [int(x) for x in input().split()]
result = doubled(nums)
print(nums)
print(result)
`,
        hints: [
          "values and nums are the same list, so writing to values[i] changes nums.",
          "Build a new list instead: new = [] then new.append(v * 2) for each v, and return new.",
        ],
        solution: `def doubled(values):
    new = []
    for v in values:
        new.append(v * 2)
    return new

nums = [int(x) for x in input().split()]
result = doubled(nums)
print(nums)
print(result)`,
        inputs: ["1 2 3", "5", "0 -4 10"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Swap in place",
        brief: `
A function can't swap two of the caller's string variables, because strings can't be changed in place. It *can* swap the two items inside a list.

Write a procedure \`swap(pair)\` that swaps the first and second items of the list \`pair\`. It should not return anything.

Input two words, one per line. Put them in a list in that order, call \`swap\` on the list, and print the list's two items separated by a space.

For example, left then right prints \`right left\`.`,
        starter: "def swap(pair):\n    pass\n",
        hints: [
          "Python can swap two places in one line: pair[0], pair[1] = pair[1], pair[0].",
          "Make the list with pair = [first, second] before calling swap(pair).",
        ],
        solution: `def swap(pair):
    pair[0], pair[1] = pair[1], pair[0]

pair = [input(), input()]
swap(pair)
print(pair[0], pair[1])`,
        inputs: ["left\nright", "cat\ndog", "same\nsame"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Translate byRef from pseudocode",
        brief: `
An exam paper gives this pseudocode:

\`\`\`
procedure addBonus(byRef scores, name, bonus)
    scores[name] = scores[name] + bonus
endprocedure
\`\`\`

Write it in Python as \`add_bonus(scores, name, bonus)\`, where \`scores\` is a dictionary. Because dictionaries can be changed in place, the change will be seen by the caller without returning anything.

Input:
- a whole number \`n\`;
- then \`n\` lines, each a name and a score separated by a space;
- then one line with a name and a bonus separated by a space.

Store the scores in a dictionary, call \`add_bonus\` once with the last line's name and bonus, then print every student as \`name: score\`, one per line, in the order they were input.

For example:
\`\`\`
2
Ada 60
Sam 45
Sam 10
\`\`\`
prints \`Ada: 60\` then \`Sam: 55\`.`,
        starter: "def add_bonus(scores, name, bonus):\n    pass\n",
        hints: [
          "The body is one line: scores[name] = scores[name] + bonus.",
          "Python dictionaries keep the order keys were added, so a for loop over scores prints them in input order.",
        ],
        solution: `def add_bonus(scores, name, bonus):
    scores[name] = scores[name] + bonus

n = int(input())
scores = {}
for i in range(n):
    name, score = input().split()
    scores[name] = int(score)
name, bonus = input().split()
add_bonus(scores, name, int(bonus))
for name in scores:
    print(name + ": " + str(scores[name]))`,
        inputs: ["2\nAda 60\nSam 45\nSam 10", "3\nLi 70\nMo 70\nJo 20\nLi 5", "1\nZed 0\nZed 0"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "The grid that changes every row",
        brief: `
This program should make an n by n grid of zeros, set one cell to 1, and print the grid. But setting one cell changes a whole column, because every row is the same list.

Fix how the grid is made so each row is its own separate list.

Input: the size \`n\`, then a row number and a column number (each counted from 0) on separate lines. Print each row of the grid on its own line, with the numbers separated by spaces.

For example, size 3, row 0, column 2 prints:
\`\`\`
0 0 1
0 0 0
0 0 0
\`\`\``,
        starter: `n = int(input())
row = int(input())
col = int(input())
grid = [[0] * n] * n
grid[row][col] = 1
for r in grid:
    print(" ".join(str(x) for x in r))
`,
        hints: [
          "[[0] * n] * n makes one row list and then n references to that same list, so changing grid[0] also changes every other row.",
          "Build each row separately: grid = [[0] * n for i in range(n)].",
        ],
        solution: `n = int(input())
row = int(input())
col = int(input())
grid = [[0] * n for i in range(n)]
grid[row][col] = 1
for r in grid:
    print(" ".join(str(x) for x in r))`,
        inputs: ["3\n0\n2", "2\n1\n1", "4\n2\n0"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Remove the failures",
        brief: `
Write a procedure \`remove_below(marks, pass_mark)\` that removes every mark below \`pass_mark\` from the list \`marks\`, changing the caller's list in place. It should not return anything.

Input a line of whole-number marks separated by spaces, then the pass mark. Call the procedure, then print the remaining marks separated by spaces, or \`None passed\` if the list is empty.`,
        starter: "def remove_below(marks, pass_mark):\n    pass\n",
        hints: [
          "Removing items while looping over the same list skips some. Loop over a copy instead: for m in marks[:].",
          "Another way: marks[:] = [m for m in marks if m >= pass_mark] replaces the list's contents in place.",
        ],
        solution: `def remove_below(marks, pass_mark):
    marks[:] = [m for m in marks if m >= pass_mark]

marks = [int(x) for x in input().split()]
pass_mark = int(input())
remove_below(marks, pass_mark)
if marks:
    print(" ".join(str(m) for m in marks))
else:
    print("None passed")`,
        inputs: ["40 12 55 39 70\n40", "10 20\n50", "50 50\n50"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 25,
        title: "By value or by reference?",
        brief: `
Write a function \`tidy(name, tags)\` that:
- makes \`name\` upper case and returns it;
- adds the tag \`checked\` to the end of the list \`tags\`.

The main program inputs a name and a line of tags separated by spaces. It calls \`new_name = tidy(name, tags)\` and then prints three lines: \`name\` (unchanged, because strings behave like passing by value), \`new_name\`, and the tags separated by spaces (changed, because lists behave like passing by reference).

For example, ada and maths cs prints \`ada\`, \`ADA\`, then \`maths cs checked\`.`,
        starter: "def tidy(name, tags):\n    pass\n",
        hints: [
          "name.upper() makes a new string; return it.",
          "tags.append(\"checked\") changes the caller's list.",
        ],
        solution: `def tidy(name, tags):
    tags.append("checked")
    return name.upper()

name = input()
tags = input().split()
new_name = tidy(name, tags)
print(name)
print(new_name)
print(" ".join(tags))`,
        inputs: ["ada\nmaths cs", "sam\nart", "Li\nmusic drama pe"],
      },
    ],
  },
  {
    title: "Handling exceptions",
    summary: "Catching errors with try and except, and raising your own when data is wrong.",
    notes: `
An **exception** is an error that happens while a program runs: converting \`"abc"\` to a number, dividing by zero, opening a file that isn't there. Unless it is handled, the program stops with an error message.

**Exception handling** lets the program catch the error and carry on:

\`\`\`python
try:
    age = int(input())
    print("Next year you will be", age + 1)
except ValueError:
    print("That wasn't a whole number")
\`\`\`

- The \`try\` block holds the code that might fail.
- If an exception happens, Python jumps straight to the matching \`except\` block. The rest of the \`try\` block is skipped.
- Name the exception you expect (\`ValueError\`, \`ZeroDivisionError\`, \`IndexError\`, \`KeyError\`, \`FileNotFoundError\`). A bare \`except:\` catches everything, including mistakes you'd rather see.

You can have several \`except\` blocks, an \`else\` block that runs only if nothing went wrong, and a \`finally\` block that **always** runs, which is useful for closing files.

---

Your own code can **raise** an exception when it is given data it can't work with:

\`\`\`python
def set_mark(mark):
    if mark < 0 or mark > 100:
        raise ValueError("Mark must be between 0 and 100")
    return mark
\`\`\`

The caller decides what to do about it. \`except ValueError as e:\` gives you the exception, and \`print(e)\` prints its message.
`,
    worked_example: `def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

print(safe_divide(10, 4))
print(safe_divide(10, 0))`,
    worked_example_note:
      "Dividing by zero raises ZeroDivisionError inside the try, so Python jumps to the except block and the function returns None instead of crashing.",
    quiz: [
      {
        question: "int(\"seven\") is run inside a try block. What happens next?",
        options: [
          "Python jumps to the matching except ValueError block",
          "The program stops with an error",
          "int returns 0",
          "The rest of the try block still runs",
        ],
        answer: "Python jumps to the matching except ValueError block",
        explanation: "int(\"seven\") raises ValueError. Inside try, that sends the program straight to the except block that handles ValueError.",
      },
      {
        question: "When does a finally block run?",
        options: [
          "Always, whether or not an exception happened",
          "Only when an exception happened",
          "Only when no exception happened",
          "Only if there is no except block",
        ],
        answer: "Always, whether or not an exception happened",
        explanation: "finally always runs, which makes it the right place for tidying up, such as closing a file.",
      },
      {
        question: "What does raise ValueError(\"Too big\") do?",
        options: [
          "Creates an exception that the caller can catch",
          "Prints Too big and carries on",
          "Ends the function and returns Too big",
          "Checks whether a ValueError has happened",
        ],
        answer: "Creates an exception that the caller can catch",
        explanation: "raise starts an exception. If nothing catches it, the program stops; a caller with try/except ValueError can handle it instead.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Catch a bad number",
        brief: `
Input a line of text. Try to convert it to a whole number with \`int()\`.

- If it works, print the number doubled.
- If it raises a \`ValueError\`, print \`Not a whole number\` instead.

For example, \`21\` prints \`42\`, and \`hello\` prints \`Not a whole number\`.`,
        starter: "",
        hints: [
          "Put the int() conversion and the print inside try:.",
          "Follow it with except ValueError: print(\"Not a whole number\").",
        ],
        solution: `try:
    n = int(input())
    print(n * 2)
except ValueError:
    print("Not a whole number")`,
        inputs: ["21", "hello", "-5", "3.5"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Safe division",
        brief: `
Input two numbers, one per line. Print the first divided by the second, rounded to 2 decimal places.

Handle two things that can go wrong:
- If either line isn't a number, print \`Please enter numbers\`.
- If the second number is 0, print \`Cannot divide by zero\`.

Use \`float()\` to convert, so decimals are allowed. For example, 7 then 2 prints \`3.5\`.`,
        starter: "",
        hints: [
          "Use one try block with two except blocks: except ValueError and except ZeroDivisionError.",
          "float(\"abc\") raises ValueError; 5 / 0 raises ZeroDivisionError.",
        ],
        solution: `try:
    a = float(input())
    b = float(input())
    print(round(a / b, 2))
except ValueError:
    print("Please enter numbers")
except ZeroDivisionError:
    print("Cannot divide by zero")`,
        inputs: ["7\n2", "10\n0", "ten\n2", "1\n3"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Keep asking until it's valid",
        brief: `
A menu asks for a choice from 1 to 10. Keep reading lines until one is a whole number from 1 to 10 inclusive.

For every line that isn't (either not a whole number, or out of range), print \`Invalid\`. When a valid one arrives, print \`You chose \` followed by the number, and stop.

For example, the lines \`abc\`, \`15\`, \`4\` print \`Invalid\`, \`Invalid\`, \`You chose 4\`.`,
        starter: "",
        hints: [
          "Use while True: and break once you have a valid number.",
          "Inside the loop, try int(input()). In the except block print Invalid and continue; after the try, check the range.",
        ],
        solution: `while True:
    try:
        choice = int(input())
    except ValueError:
        print("Invalid")
        continue
    if 1 <= choice <= 10:
        print("You chose " + str(choice))
        break
    print("Invalid")`,
        inputs: ["abc\n15\n4", "1", "0\n11\n-3\n10", "seven\n7"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Raise your own exception",
        brief: `
Write a function \`check_age(age)\` that:
- raises a \`ValueError\` with the message \`Age must be between 0 and 120\` if \`age\` is below 0 or above 120;
- otherwise returns \`age\`.

The main program inputs a whole number and calls \`check_age\` inside a \`try\` block. If it works, print \`Age set to \` followed by the age. If a \`ValueError\` is raised, print its message.

For example, \`17\` prints \`Age set to 17\`, and \`130\` prints \`Age must be between 0 and 120\`.`,
        starter: "def check_age(age):\n    pass\n",
        hints: [
          "raise ValueError(\"Age must be between 0 and 120\") inside an if.",
          "Catch it with except ValueError as e: and print(e) to show the message.",
        ],
        solution: `def check_age(age):
    if age < 0 or age > 120:
        raise ValueError("Age must be between 0 and 120")
    return age

try:
    age = check_age(int(input()))
    print("Age set to " + str(age))
except ValueError as e:
    print(e)`,
        inputs: ["17", "130", "-1", "0", "120"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Skip the bad readings",
        brief: `
A sensor sends one line of readings separated by commas. Some readings are corrupted and aren't numbers at all.

Input the line. Convert each reading with \`float()\`, skipping any that raise a \`ValueError\`. Then print two lines:
- \`Average: \` followed by the average of the valid readings, rounded to 2 decimal places, or \`Average: none\` if there were no valid readings;
- \`Skipped: \` followed by how many readings were skipped.

For example, \`20.5,err,19.5,21\` prints \`Average: 20.33\` then \`Skipped: 1\`.`,
        starter: "",
        hints: [
          "Loop over input().split(\",\"), with a try/except ValueError around each float().",
          "Keep a list of valid readings and a skipped counter. Only divide if the list isn't empty.",
        ],
        solution: `valid = []
skipped = 0
for part in input().split(","):
    try:
        valid.append(float(part))
    except ValueError:
        skipped = skipped + 1
if valid:
    print("Average: " + str(round(sum(valid) / len(valid), 2)))
else:
    print("Average: none")
print("Skipped: " + str(skipped))`,
        inputs: ["20.5,err,19.5,21", "x,y", "4,6", "1.5"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Look up a price",
        brief: `
A shop's prices are in this dictionary:

\`\`\`python
prices = {"pen": 1.2, "pad": 2.5, "ruler": 0.8}
\`\`\`

Input an item name and print its price. Looking up a name that isn't in a dictionary raises a \`KeyError\`: catch it and print \`Not sold here\` instead.`,
        starter: 'prices = {"pen": 1.2, "pad": 2.5, "ruler": 0.8}\n',
        hints: [
          "Put print(prices[item]) inside try.",
          "Catch it with except KeyError: print(\"Not sold here\").",
        ],
        solution: `prices = {"pen": 1.2, "pad": 2.5, "ruler": 0.8}
item = input()
try:
    print(prices[item])
except KeyError:
    print("Not sold here")`,
        inputs: ["pen", "ruler", "glue"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Pick from the list",
        brief: `
This list of teams is already in the program:

\`\`\`python
teams = ["Red", "Blue", "Green", "Gold"]
\`\`\`

Input a position (counting from 1). Print the team at that position.

- If the input isn't a whole number, print \`Enter a number\`.
- If there's no team at that position, print \`No team there\`. Positions below 1 count as no team too: don't let Python's negative indexes count from the end.`,
        starter: 'teams = ["Red", "Blue", "Green", "Gold"]\n',
        hints: [
          "teams[position - 1] raises IndexError for a position past the end. Catch it with except IndexError.",
          "A position of 0 or less would quietly pick from the end, so check for it yourself: if position < 1, raise IndexError.",
        ],
        solution: `teams = ["Red", "Blue", "Green", "Gold"]
try:
    position = int(input())
    if position < 1:
        raise IndexError
    print(teams[position - 1])
except ValueError:
    print("Enter a number")
except IndexError:
    print("No team there")`,
        inputs: ["1", "4", "5", "0", "two"],
      },
    ],
  },
];
