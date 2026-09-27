// Batch 2 toward tripling the OCR question bank: 4 more fresh concepts per
// topic (8 more questions each), continuing from batch 1.
export const questions = [
  // ---------------------------------------------------------------- fundamentals
  {
    id: "ocr-fundamentals-11", board: "ocr", topic: "fundamentals", concept: "constant-usage",
    ability: 1, marks: 1, format: "text",
    question: "State **one** reason a programmer would use a constant instead of a variable for a value such as VAT_RATE. [1]",
    markScheme: [
      { text: "Any correct reason, e.g. the value should never change while the program runs / it makes it clear (to anyone reading the code) that the value is fixed / it prevents the value being accidentally changed", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-12", board: "ocr", topic: "fundamentals", concept: "constant-usage",
    ability: 2, marks: 3, format: "text",
    question: "```\nVAT_RATE = 0.2\nprice = 50\ntotal = price + (price * VAT_RATE)\nprint(total)\n```\n\n(a) State the output of this program. [1]\n\n(b) A programmer later needs to change the VAT rate to 0.25 everywhere it is used in a large program. Explain why using a constant like `VAT_RATE` makes this easier than if the value 0.2 had been typed directly wherever it was needed. [2]",
    markScheme: [
      { text: "(a) 60.0", marks: 1, guidance: "Accept: 60." },
      { text: "(b) Only the one line where the constant is defined needs to be changed", marks: 1, guidance: "" },
      { text: "(b) Whereas typing 0.2 directly in many places would mean finding and changing every occurrence, risking some being missed", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-13", board: "ocr", topic: "fundamentals", concept: "casting-errors",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the built-in function used to convert a piece of text into a whole number. [1]\n\n(b) State what happens if this function is used on the text \"hello\". [1]",
    markScheme: [
      { text: "(a) `int()`", marks: 1, guidance: "" },
      { text: "(b) An error occurs (the program crashes)", marks: 1, guidance: "Accept: a ValueError is raised." },
    ],
  },
  {
    id: "ocr-fundamentals-14", board: "ocr", topic: "fundamentals", concept: "casting-errors",
    ability: 2, marks: 3, format: "text",
    question: "```\nage = input(\"Enter your age\")\nage = int(age)\nprint(age + 1)\n```\n\n(a) Explain why the second line is necessary for the third line to work correctly. [2]\n\n(b) State what would happen if the user entered \"twelve\" instead of a number. [1]",
    markScheme: [
      { text: "(a) `input()` always returns a string (text), even if the user types digits", marks: 1, guidance: "" },
      { text: "(a) A string cannot be added to an integer with `+`, so it must be cast to an integer first", marks: 1, guidance: "" },
      { text: "(b) An error occurs, since \"twelve\" cannot be converted to a whole number", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-15", board: "ocr", topic: "fundamentals", concept: "arithmetic-operators-basic",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the operator used to find the remainder after division in Python. [1]\n\n(b) State the value of `17 % 5`. [1]",
    markScheme: [
      { text: "(a) %", marks: 1, guidance: "" },
      { text: "(b) 2", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-16", board: "ocr", topic: "fundamentals", concept: "arithmetic-operators-basic",
    ability: 2, marks: 3, format: "text",
    question: "```\na = 20\nb = 6\nprint(a // b)\nprint(a % b)\n```\n\n(a) State the output of the first `print` statement. [1]\n\n(b) State the output of the second `print` statement. [1]\n\n(c) Explain how these two values relate to the calculation 20 = (6 x 3) + 2. [1]",
    markScheme: [
      { text: "(a) 3", marks: 1, guidance: "" },
      { text: "(b) 2", marks: 1, guidance: "" },
      { text: "(c) 3 is how many times 6 divides into 20 whole times, and 2 is what is left over (the remainder)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-17", board: "ocr", topic: "fundamentals", concept: "real-vs-integer",
    ability: 1, marks: 1, format: "text",
    question: "State the most appropriate data type for a variable that stores a person's height in metres (e.g. 1.75). [1]",
    markScheme: [
      { text: "Real / float", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-18", board: "ocr", topic: "fundamentals", concept: "real-vs-integer",
    ability: 2, marks: 3, format: "text",
    question: "A programmer is deciding whether to store the number of students in a class as an integer or a real number, and whether to store each student's average test score as an integer or a real number.\n\nState, with a reason, which data type is more appropriate for **each** of these two values. [3]",
    markScheme: [
      { text: "Number of students: integer", marks: 1, guidance: "" },
      { text: "...because it is always a whole number (you cannot have part of a student)", marks: 1, guidance: "" },
      { text: "Average score: real, because dividing a total by a count can produce a decimal value", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- sequencing
  {
    id: "ocr-sequencing-11", board: "ocr", topic: "sequencing", concept: "operator-precedence",
    ability: 1, marks: 1, format: "text",
    question: "State the value of `2 + 3 * 4`. [1]",
    markScheme: [
      { text: "14", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-sequencing-12", board: "ocr", topic: "sequencing", concept: "operator-precedence",
    ability: 2, marks: 3, format: "text",
    question: "```\na = 2 + 3 * 4\nb = (2 + 3) * 4\nc = 2 * 3 + 4 * 5\nprint(a, b, c)\n```\n\nState the output of this program. [3]",
    markScheme: [
      { text: "14", marks: 1, guidance: "value of a" },
      { text: "20", marks: 1, guidance: "value of b" },
      { text: "26", marks: 1, guidance: "value of c" },
    ],
  },
  {
    id: "ocr-sequencing-13", board: "ocr", topic: "sequencing", concept: "swap-values",
    ability: 2, marks: 3, format: "code",
    question: "Write a program that stores the values 5 and 9 in two variables, `a` and `b`, then swaps their values so that `a` holds 9 and `b` holds 5, and outputs both. A third, temporary variable may be used. [3]",
    markScheme: [
      { text: "Sets up `a` and `b` with the initial values 5 and 9", marks: 1, guidance: "" },
      { text: "Uses a third variable to hold one of the values while swapping, so neither original value is lost", marks: 1, guidance: "" },
      { text: "Correctly outputs `a` as 9 and `b` as 5 after the swap", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-sequencing-14", board: "ocr", topic: "sequencing", concept: "swap-values",
    ability: 3, marks: 5, format: "text",
    question: "```\na = 5\nb = 9\na = b\nb = a\nprint(a, b)\n```\n\n(a) State the output of this program. [2]\n\n(b) Explain why this code does not correctly swap the values of `a` and `b`. [3]",
    markScheme: [
      { text: "(a) 9 9", marks: 2, guidance: "1 mark for each correct value, in the correct position." },
      { text: "(b) The line `a = b` overwrites `a`'s original value (5) with `b`'s value (9), and that original value of `a` is now lost", marks: 2, guidance: "1 mark for identifying the value is lost, 1 mark for correctly explaining why (it was never saved anywhere)." },
      { text: "(b) So the next line, `b = a`, just sets `b` to 9 again (a's new value), rather than to a's original value", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-sequencing-15", board: "ocr", topic: "sequencing", concept: "unit-conversion",
    ability: 1, marks: 2, format: "code",
    question: "Write a program that inputs a temperature in Celsius and outputs it converted to Fahrenheit, using the formula F = (C x 9 / 5) + 32. [2]",
    markScheme: [
      { text: "Inputs the Celsius temperature and casts it to a number", marks: 1, guidance: "" },
      { text: "Correctly applies the formula and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-sequencing-16", board: "ocr", topic: "sequencing", concept: "unit-conversion",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs a distance in miles and outputs it converted to both kilometres (miles x 1.609) and metres (kilometres x 1000), each rounded to 1 decimal place, in the form `<value> km` and `<value> m`. [5]",
    markScheme: [
      { text: "Inputs the distance in miles and casts it to a real number", marks: 1, guidance: "" },
      { text: "Correctly calculates the distance in kilometres", marks: 1, guidance: "" },
      { text: "Correctly calculates the distance in metres, using the kilometre value", marks: 1, guidance: "" },
      { text: "Both values are rounded to 1 decimal place", marks: 1, guidance: "" },
      { text: "Both values are output in the given form", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- selection
  {
    id: "ocr-selection-13", board: "ocr", topic: "selection", concept: "not-operator",
    ability: 1, marks: 1, format: "text",
    question: "State the value of `not True`. [1]",
    markScheme: [
      { text: "False", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-14", board: "ocr", topic: "selection", concept: "not-operator",
    ability: 2, marks: 3, format: "text",
    question: "```\nloggedIn = False\nif not loggedIn:\n    print(\"Please log in\")\nelse:\n    print(\"Welcome back\")\n```\n\n(a) State the output of this program. [1]\n\n(b) Rewrite the condition on line 2 without using `not`, so the program behaves identically. [2]",
    markScheme: [
      { text: "(a) Please log in", marks: 1, guidance: "" },
      { text: "(b) A condition testing `loggedIn` directly against False, e.g. `if loggedIn == False:`", marks: 1, guidance: "" },
      { text: "(b) ...with the branches kept in the same order (or swapped correctly if the condition itself is reversed instead)", marks: 1, guidance: "Award for any logically equivalent rewrite." },
    ],
  },
  {
    id: "ocr-selection-15", board: "ocr", topic: "selection", concept: "range-checking",
    ability: 1, marks: 2, format: "text",
    question: "```\nnumber = 7\nif number >= 1 and number <= 10:\n    print(\"In range\")\nelse:\n    print(\"Out of range\")\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "In range", marks: 2, guidance: "1 mark for identifying both conditions must be checked, 1 mark for the correct final output." },
    ],
  },
  {
    id: "ocr-selection-16", board: "ocr", topic: "selection", concept: "range-checking",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs a percentage exam score and outputs the grade using this table: 90 or above is \"A*\", 80 to 89 is \"A\", 70 to 79 is \"B\", and anything below 70 is \"C or below\". [5]",
    markScheme: [
      { text: "Inputs the score and casts it to an integer", marks: 1, guidance: "" },
      { text: "Correctly identifies 90 or above as \"A*\"", marks: 1, guidance: "" },
      { text: "Correctly identifies 80 to 89 as \"A\"", marks: 1, guidance: "" },
      { text: "Correctly identifies 70 to 79 as \"B\"", marks: 1, guidance: "" },
      { text: "Correctly identifies anything below 70 as \"C or below\", using a structure where only one message is ever output", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-17", board: "ocr", topic: "selection", concept: "nested-selection-trace",
    ability: 2, marks: 3, format: "text",
    question: "```\nage = 20\nhasTicket = True\nif age >= 18:\n    if hasTicket:\n        print(\"Enter\")\n    else:\n        print(\"Buy a ticket\")\nelse:\n    print(\"Too young\")\n```\n\n(a) State the output of this program. [1]\n\n(b) State the output if `hasTicket` is changed to `False`. [1]\n\n(c) State the output if `age` is changed to `16` (with `hasTicket` as `True`). [1]",
    markScheme: [
      { text: "(a) Enter", marks: 1, guidance: "" },
      { text: "(b) Buy a ticket", marks: 1, guidance: "" },
      { text: "(c) Too young", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-18", board: "ocr", topic: "selection", concept: "nested-selection-trace",
    ability: 3, marks: 6, format: "code",
    question: "A theme park ride requires riders to be at least 120cm tall. Riders under 140cm tall must also be accompanied by an adult. Write a program that inputs a rider's height (in cm) and whether they are accompanied by an adult (as \"yes\" or \"no\"), then outputs `Allowed` or `Not allowed` accordingly. [6]",
    markScheme: [
      { text: "Inputs the height and casts it to a number", marks: 1, guidance: "" },
      { text: "Inputs whether the rider is accompanied", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Not allowed\" for anyone under 120cm, regardless of being accompanied", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Allowed\" for anyone 140cm or over", marks: 1, guidance: "" },
      { text: "Correctly handles the 120-139cm range: \"Allowed\" only if accompanied, \"Not allowed\" if not", marks: 1, guidance: "" },
      { text: "Uses nested or combined (AND) selection so exactly one message is output for every case", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- iteration
  {
    id: "ocr-iteration-13", board: "ocr", topic: "iteration", concept: "while-loop-basic",
    ability: 1, marks: 2, format: "text",
    question: "```\nn = 1\nwhile n < 5:\n    print(n)\n    n = n + 1\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "1, 2, 3, 4 (each on its own line, or comma separated)", marks: 2, guidance: "1 mark for the correct four values, 1 mark for stopping before 5 is printed." },
    ],
  },
  {
    id: "ocr-iteration-14", board: "ocr", topic: "iteration", concept: "while-loop-basic",
    ability: 2, marks: 3, format: "text",
    question: "```\nn = 1\nwhile n < 5:\n    print(n)\n    n = n + 1\n```\n\n(a) State how many times the loop body runs. [1]\n\n(b) Explain what would happen if the line `n = n + 1` were removed. [2]",
    markScheme: [
      { text: "(a) 4", marks: 1, guidance: "" },
      { text: "(b) `n` would never change, so the condition `n < 5` would always stay True", marks: 1, guidance: "" },
      { text: "(b) The loop would never end (an infinite loop)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-15", board: "ocr", topic: "iteration", concept: "loop-counter",
    ability: 1, marks: 2, format: "code",
    question: "Write a program that inputs 5 whole numbers, one at a time, and outputs how many of them were negative. [2]",
    markScheme: [
      { text: "Uses a loop that runs exactly 5 times, taking one input per iteration and casting it to a number", marks: 1, guidance: "" },
      { text: "Keeps a counter that increases when a number is negative, and outputs it after the loop", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-16", board: "ocr", topic: "iteration", concept: "loop-counter",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs whole numbers, one at a time, stopping as soon as the user enters 0. It should then output how many positive numbers and how many negative numbers were entered before the 0 (the 0 itself should not be counted as either). [5]",
    markScheme: [
      { text: "Uses a condition-controlled loop that keeps reading numbers until 0 is entered", marks: 1, guidance: "" },
      { text: "Keeps a separate counter for positive numbers and for negative numbers", marks: 1, guidance: "" },
      { text: "Correctly increases the positive counter only for numbers greater than 0", marks: 1, guidance: "" },
      { text: "Correctly increases the negative counter only for numbers less than 0", marks: 1, guidance: "" },
      { text: "Outputs both counts after the loop ends, with the 0 itself never counted", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-17", board: "ocr", topic: "iteration", concept: "loop-vs-loop-choice",
    ability: 2, marks: 4, format: "text",
    question: "A programmer needs to write two separate pieces of code:\n\n1. Print the 12 times table, from 1 x 12 up to 12 x 12.\n2. Keep asking a user to enter a password until they enter the correct one.\n\nFor **each** task, state which type of loop (count-controlled or condition-controlled) is more suitable, and explain why. [4]",
    markScheme: [
      { text: "Task 1: count-controlled", marks: 1, guidance: "" },
      { text: "...because the number of times the loop must run (12) is known in advance, before the loop starts", marks: 1, guidance: "" },
      { text: "Task 2: condition-controlled", marks: 1, guidance: "" },
      { text: "...because it is not known in advance how many attempts the user will need; the loop must keep going until a specific condition (correct password) is met", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-18", board: "ocr", topic: "iteration", concept: "loop-vs-loop-choice",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the type of loop that repeats a fixed, known number of times. [1]\n\n(b) State the type of loop that repeats until a condition becomes True (or False). [1]",
    markScheme: [
      { text: "(a) Count-controlled", marks: 1, guidance: "" },
      { text: "(b) Condition-controlled", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- lists
  {
    id: "ocr-lists-11", board: "ocr", topic: "lists", concept: "list-length",
    ability: 1, marks: 1, format: "text",
    question: "```\nfruits = [\"apple\", \"banana\", \"cherry\", \"date\"]\nprint(len(fruits))\n```\n\nState the output of this program. [1]",
    markScheme: [
      { text: "4", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-lists-12", board: "ocr", topic: "lists", concept: "list-length",
    ability: 2, marks: 3, format: "code",
    question: "Write a program that inputs a whole number, N, and then inputs N more whole numbers, adding each to a list. The program should then output the number of items in the list, using `len()`. [3]",
    markScheme: [
      { text: "Inputs N and casts it to an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that runs N times, adding each input number to a list", marks: 1, guidance: "" },
      { text: "Outputs `len()` of the list after the loop", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-lists-13", board: "ocr", topic: "lists", concept: "list-index-error",
    ability: 2, marks: 3, format: "text",
    question: "```\nscores = [10, 20, 30]\nprint(scores[3])\n```\n\n(a) State what happens when this program runs. [1]\n\n(b) Explain why this happens. [2]",
    markScheme: [
      { text: "(a) An error occurs (the program crashes)", marks: 1, guidance: "Accept: an IndexError is raised." },
      { text: "(b) The list `scores` only has 3 items, at indices 0, 1 and 2", marks: 1, guidance: "" },
      { text: "(b) Index 3 does not exist in the list, since indexing starts at 0", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-lists-14", board: "ocr", topic: "lists", concept: "list-index-error",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that stores a list of 5 names. It should input a position (index) from the user and output the name at that position, or `Invalid position` if the number entered does not correspond to a valid index in the list. [5]",
    markScheme: [
      { text: "Creates a list of 5 names", marks: 1, guidance: "" },
      { text: "Inputs a position and casts it to an integer", marks: 1, guidance: "" },
      { text: "Correctly checks whether the position is a valid index for the list (0 to 4)", marks: 1, guidance: "" },
      { text: "Outputs the name at that position when it is valid", marks: 1, guidance: "" },
      { text: "Outputs \"Invalid position\" for any position outside 0 to 4, without the program crashing", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-lists-15", board: "ocr", topic: "lists", concept: "list-count-matches",
    ability: 1, marks: 2, format: "code",
    question: "A list contains the exam results `[\"Pass\", \"Fail\", \"Pass\", \"Pass\", \"Fail\"]`. Write a program that counts and outputs how many of the results are \"Pass\". [2]",
    markScheme: [
      { text: "Uses a loop to go through every item in the list", marks: 1, guidance: "" },
      { text: "Correctly counts and outputs how many items equal \"Pass\"", marks: 1, guidance: "Accept the use of `.count()`." },
    ],
  },
  {
    id: "ocr-lists-16", board: "ocr", topic: "lists", concept: "list-count-matches",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that inputs 8 whole numbers into a list, then outputs how many of them are even numbers. [4]",
    markScheme: [
      { text: "Creates an empty list and uses a loop to input exactly 8 numbers into it", marks: 1, guidance: "" },
      { text: "Uses a second loop (or the same one) to check each number in the list", marks: 1, guidance: "" },
      { text: "Correctly identifies an even number (e.g. using `% 2 == 0`)", marks: 1, guidance: "" },
      { text: "Outputs the correct count of even numbers", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- strings
  {
    id: "ocr-strings-11", board: "ocr", topic: "strings", concept: "case-conversion",
    ability: 1, marks: 2, format: "text",
    question: "```\nword = \"Hello\"\nprint(word.upper())\nprint(word.lower())\n```\n\nState the output of both lines, in order. [2]",
    markScheme: [
      { text: "HELLO", marks: 1, guidance: "" },
      { text: "hello", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-strings-12", board: "ocr", topic: "strings", concept: "case-conversion",
    ability: 2, marks: 3, format: "code",
    question: "Write a program that inputs a username and outputs whether it is exactly \"admin\" (matching regardless of the upper/lower case the user typed it in). [3]",
    markScheme: [
      { text: "Takes the username as input", marks: 1, guidance: "" },
      { text: "Converts the input to a single, consistent case (upper or lower) before comparing", marks: 1, guidance: "" },
      { text: "Correctly compares it to \"admin\" (in that same case) and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-strings-13", board: "ocr", topic: "strings", concept: "string-concatenation-loop",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that inputs a word and outputs it with every character repeated twice, for example `cat` becomes `ccaatt`. [4]",
    markScheme: [
      { text: "Takes the word as input", marks: 1, guidance: "" },
      { text: "Starts with an empty string to build the result", marks: 1, guidance: "" },
      { text: "Loops through each character of the word, adding it to the result twice", marks: 1, guidance: "" },
      { text: "Outputs the completed result after the loop", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-strings-14", board: "ocr", topic: "strings", concept: "string-concatenation-loop",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs a word and outputs it with the letters in reverse order, without using a built-in reverse function (build the reversed word yourself, one character at a time). [5]",
    markScheme: [
      { text: "Takes the word as input", marks: 1, guidance: "" },
      { text: "Starts with an empty string to build the result", marks: 1, guidance: "" },
      { text: "Loops through the characters of the word (in either direction)", marks: 1, guidance: "" },
      { text: "Correctly adds each character so the final string ends up reversed (e.g. adding each new character to the front of the result)", marks: 1, guidance: "" },
      { text: "Outputs the completed reversed word after the loop", marks: 1, guidance: "No credit if a built-in reverse function or slicing shortcut such as `[::-1]` is used." },
    ],
  },
  {
    id: "ocr-strings-15", board: "ocr", topic: "strings", concept: "type-of-string",
    ability: 1, marks: 1, format: "text",
    question: "State the data type of the value `\"123\"` (with the quote marks). [1]",
    markScheme: [
      { text: "String", marks: 1, guidance: "Do not accept: integer, number." },
    ],
  },
  {
    id: "ocr-strings-16", board: "ocr", topic: "strings", concept: "type-of-string",
    ability: 2, marks: 3, format: "text",
    question: "```\na = \"123\"\nb = \"456\"\nprint(a + b)\n```\n\n(a) State the output of this program. [1]\n\n(b) Explain why the output is not the number 579. [2]",
    markScheme: [
      { text: "(a) 123456", marks: 1, guidance: "" },
      { text: "(b) `a` and `b` are strings (text), not integers, even though they contain only digits", marks: 1, guidance: "" },
      { text: "(b) `+` on two strings joins (concatenates) them rather than adding them numerically", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- functions
  {
    id: "ocr-functions-13", board: "ocr", topic: "functions", concept: "procedure-vs-function-usage",
    ability: 1, marks: 2, format: "text",
    question: "(a) State whether a subprogram that displays a welcome message but sends back no value is a function or a procedure. [1]\n\n(b) State whether a subprogram that works out and sends back a total is a function or a procedure. [1]",
    markScheme: [
      { text: "(a) Procedure", marks: 1, guidance: "" },
      { text: "(b) Function", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-14", board: "ocr", topic: "functions", concept: "procedure-vs-function-usage",
    ability: 2, marks: 3, format: "text",
    question: "```\ndef showMenu():\n    print(\"1. Start\")\n    print(\"2. Quit\")\n\ndef getTotal(a, b):\n    return a + b\n\nshowMenu()\nresult = getTotal(3, 4)\nprint(result)\n```\n\n(a) State the output of this program, in full. [2]\n\n(b) Explain why `showMenu()` is used as its own line, but `getTotal(3, 4)` is assigned to a variable. [1]",
    markScheme: [
      { text: "(a) 1. Start / 2. Quit / 7, each on its own line", marks: 2, guidance: "1 mark for the menu lines, 1 mark for 7." },
      { text: "(b) `showMenu` is a procedure - it does not return a value, so there is nothing to store; `getTotal` is a function, so its returned value needs to be captured (stored) to be used", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-15", board: "ocr", topic: "functions", concept: "local-scope",
    ability: 2, marks: 3, format: "text",
    question: "```\ndef setName():\n    name = \"Ada\"\n    print(name)\n\nsetName()\nprint(name)\n```\n\n(a) State the output of the first `print` statement (inside the function). [1]\n\n(b) State what happens on the last line. [1]\n\n(c) Explain why. [1]",
    markScheme: [
      { text: "(a) Ada", marks: 1, guidance: "" },
      { text: "(b) An error occurs (the program crashes)", marks: 1, guidance: "" },
      { text: "(c) `name` is a local variable - it only exists inside the function it was created in, and is not accessible outside it", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-16", board: "ocr", topic: "functions", concept: "local-scope",
    ability: 3, marks: 5, format: "code",
    question: "Write a function `applyDiscount(price, percent)` that returns `price` reduced by `percent`% (for example, a price of 100 with a percent of 20 returns 80). The function must not use any variable other than its own two parameters and any it defines and uses itself. Then, input a price and a discount percentage, and output the result of calling your function. [5]",
    markScheme: [
      { text: "Defines a function with the correct name and both parameters", marks: 1, guidance: "" },
      { text: "Correctly calculates the discount amount from `price` and `percent`", marks: 1, guidance: "" },
      { text: "Correctly returns `price` minus the discount amount", marks: 1, guidance: "" },
      { text: "Inputs a price and a percentage, casting both to numbers", marks: 1, guidance: "" },
      { text: "Calls the function with the two inputs and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-17", board: "ocr", topic: "functions", concept: "multiple-parameters",
    ability: 1, marks: 2, format: "text",
    question: "```\ndef addThree(a, b, c):\n    return a + b + c\n\nprint(addThree(2, 5, 8))\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "15", marks: 2, guidance: "1 mark for correctly matching the arguments to the parameters, 1 mark for the correct final value." },
    ],
  },
  {
    id: "ocr-functions-18", board: "ocr", topic: "functions", concept: "multiple-parameters",
    ability: 2, marks: 4, format: "code",
    question: "Write a function `boxVolume(length, width, height)` that returns the volume of a box (length x width x height). Then input three numbers and use your function to output the volume. [4]",
    markScheme: [
      { text: "Defines a function with the correct name and three parameters", marks: 1, guidance: "" },
      { text: "Correctly returns the product of all three parameters", marks: 1, guidance: "" },
      { text: "Inputs three numbers, casting them appropriately", marks: 1, guidance: "" },
      { text: "Calls the function with the three inputs, in the correct order, and outputs the result", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- files
  {
    id: "ocr-files-11", board: "ocr", topic: "files", concept: "file-exists-check",
    ability: 1, marks: 2, format: "text",
    question: "State **two** problems that could occur if a program tries to open a file for reading that does not exist. [2]",
    markScheme: [
      { text: "Any two of: the program crashes / an error occurs / the program is unable to continue running / data intended to be read is simply not there", marks: 2, guidance: "1 mark per valid problem, up to 2." },
    ],
  },
  {
    id: "ocr-files-12", board: "ocr", topic: "files", concept: "file-exists-check",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that checks whether a file called \"settings.txt\" exists (using `os.path.exists(\"settings.txt\")`, which returns True or False). If it exists, the program should open and print its contents. If it does not exist, the program should print `File not found` instead. [4]",
    markScheme: [
      { text: "Checks whether the file exists using the given function, before trying to open it", marks: 1, guidance: "" },
      { text: "Opens the file for reading when it exists", marks: 1, guidance: "" },
      { text: "Prints the file's contents", marks: 1, guidance: "" },
      { text: "Prints \"File not found\" when the file does not exist, instead of trying to open it", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-files-13", board: "ocr", topic: "files", concept: "file-write-list",
    ability: 2, marks: 3, format: "code",
    question: "A list called `names` contains 4 names. Write a program that opens a file called \"names.txt\" for writing and writes each name in the list on its own line, then closes the file. [3]",
    markScheme: [
      { text: "Opens \"names.txt\" for writing", marks: 1, guidance: "" },
      { text: "Uses a loop to write each name in the list, each followed by a newline character", marks: 1, guidance: "" },
      { text: "Closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-files-14", board: "ocr", topic: "files", concept: "file-write-list",
    ability: 3, marks: 5, format: "code",
    question: "A list called `scores` contains 6 whole numbers. Write a program that writes each score to a file called \"scores.txt\", one per line, then reopens the file and outputs how many of the scores stored in the file are above 50. [5]",
    markScheme: [
      { text: "Opens \"scores.txt\" for writing and writes each score followed by a newline, then closes the file", marks: 1, guidance: "" },
      { text: "Reopens \"scores.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop to read each line and cast it back to a number", marks: 1, guidance: "" },
      { text: "Correctly counts how many are above 50", marks: 1, guidance: "" },
      { text: "Outputs the count, and closes the file", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- searching-sorting
  {
    id: "ocr-searching-sorting-11", board: "ocr", topic: "searching-sorting", concept: "binary-search-requirement",
    ability: 1, marks: 1, format: "text",
    question: "State the one condition a list must meet before a binary search can be used on it. [1]",
    markScheme: [
      { text: "It must already be sorted (in order)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-searching-sorting-12", board: "ocr", topic: "searching-sorting", concept: "binary-search-requirement",
    ability: 2, marks: 4, format: "text",
    question: "A binary search is used to look for the value 23 in the sorted list `[2, 5, 9, 14, 23, 31, 40]` (indices 0 to 6).\n\n(a) State the index that is checked first. [1]\n\n(b) State the value found at that index. [1]\n\n(c) State whether the search now looks in the left half or the right half of the list. [1]\n\n(d) State how many comparisons in total are needed to find 23. [1]",
    markScheme: [
      { text: "(a) 3 (the middle index)", marks: 1, guidance: "" },
      { text: "(b) 14", marks: 1, guidance: "" },
      { text: "(c) Right half (since 23 is greater than 14)", marks: 1, guidance: "" },
      { text: "(d) 2", marks: 1, guidance: "The middle of the right half, index 5 (value 31), is greater than 23, then index 4 (value 23) matches." },
    ],
  },
  {
    id: "ocr-searching-sorting-13", board: "ocr", topic: "searching-sorting", concept: "search-time-comparison",
    ability: 2, marks: 3, format: "text",
    question: "A list of 1,000 sorted numbers is searched for a value using both a linear search and a binary search.\n\nExplain why the binary search is likely to need far fewer comparisons than the linear search. [3]",
    markScheme: [
      { text: "A linear search checks items one at a time from the start, so it may need to check close to all 1,000 items in the worst case", marks: 1, guidance: "" },
      { text: "A binary search repeatedly checks the middle item and eliminates half of the remaining items each time", marks: 1, guidance: "" },
      { text: "This means it only needs around 10 comparisons at most to search 1,000 items (halving 1,000 about 10 times), far fewer than a linear search's worst case", marks: 1, guidance: "Accept any correct explanation showing understanding that halving the search space each time is far faster than checking one at a time." },
    ],
  },
  {
    id: "ocr-searching-sorting-14", board: "ocr", topic: "searching-sorting", concept: "search-time-comparison",
    ability: 3, marks: 5, format: "text",
    question: "A school wants to search for a student's record by their surname in a list of all students.\n\nDiscuss whether a linear search or a binary search would be more appropriate, considering both how the list of students is likely to be maintained and how searches will be performed. [5]",
    markScheme: [
      { text: "A binary search would generally be faster once the list is large", marks: 1, guidance: "" },
      { text: "...but it requires the list to be kept sorted by surname at all times", marks: 1, guidance: "" },
      { text: "If students are added or removed often, keeping the list sorted has its own ongoing cost (re-sorting, or inserting in the correct position)", marks: 1, guidance: "" },
      { text: "A linear search needs no sorting and is simple, but is slower, especially as the school (and the list) grows", marks: 1, guidance: "" },
      { text: "A reasoned conclusion, e.g. binary search is worth it if searches happen far more often than the list changes, and vice versa", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- robust-programs
  {
    id: "ocr-robust-programs-11", board: "ocr", topic: "robust-programs", concept: "validation-range-check",
    ability: 1, marks: 2, format: "text",
    question: "A program asks the user to enter their age, and must reject any value that is not between 0 and 120.\n\n(a) State the name of this type of validation check. [1]\n\n(b) State **one** value that this check should reject. [1]",
    markScheme: [
      { text: "(a) Range check", marks: 1, guidance: "" },
      { text: "(b) Any value outside 0-120, e.g. -5 or 200", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-robust-programs-12", board: "ocr", topic: "robust-programs", concept: "validation-range-check",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that asks the user to enter their age. The program must keep asking until a whole number between 0 and 120 (inclusive) is entered, then output `Thank you`. [4]",
    markScheme: [
      { text: "Takes the age as input and casts it to an integer", marks: 1, guidance: "" },
      { text: "Uses a condition-controlled loop to keep asking until the input is valid", marks: 1, guidance: "" },
      { text: "The range check is correct, including both boundaries (0 and 120 are themselves valid)", marks: 1, guidance: "" },
      { text: "Outputs \"Thank you\" once a valid age has been entered", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-robust-programs-13", board: "ocr", topic: "robust-programs", concept: "normal-boundary-erroneous",
    ability: 2, marks: 3, format: "text",
    question: "A program accepts a percentage mark from 0 to 100.\n\nFor this program, give **one** example of test data that would be classed as: (a) normal, (b) boundary, and (c) erroneous. [3]",
    markScheme: [
      { text: "(a) Any value clearly and validly within range, e.g. 65", marks: 1, guidance: "" },
      { text: "(b) A value at (or just past) the very edge of the accepted range, e.g. 0 or 100 (or -1 / 101)", marks: 1, guidance: "" },
      { text: "(c) A value of the wrong type or clearly outside any sensible range, e.g. \"abc\" or -500", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-robust-programs-14", board: "ocr", topic: "robust-programs", concept: "normal-boundary-erroneous",
    ability: 3, marks: 5, format: "text",
    question: "A program accepts a whole number of tickets to buy, from 1 to 8 per order.\n\nDesign a set of test data for this input, giving at least one value for each of normal, boundary and erroneous data, and state the expected result for each. [5]",
    markScheme: [
      { text: "A valid normal value, e.g. 4, with the expected result that it is accepted", marks: 1, guidance: "" },
      { text: "Both boundary values, 1 and 8, with the expected result that both are accepted", marks: 1, guidance: "" },
      { text: "Values just outside the boundaries, e.g. 0 and 9, with the expected result that both are rejected", marks: 1, guidance: "" },
      { text: "An erroneous value of the wrong type, e.g. \"five\", with the expected result that it is rejected (or handled without crashing)", marks: 1, guidance: "" },
      { text: "All expected results are correctly matched to their test values, and clearly explained", marks: 1, guidance: "" },
    ],
  },
];
