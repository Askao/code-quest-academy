// Batch 2: brings every AQA topic up to the same full-triple target as OCR
// (18 for the six-base topics and databases, 24 for selection/iteration/
// functions), porting the same concepts batch 1 skipped, in AQA's own style.
export const questions = [
  // ---------------------------------------------------------------- fundamentals (+8, target 18)
  {
    id: "aqa-fundamentals-11", board: "aqa", topic: "fundamentals", concept: "constant-usage",
    ability: 1, marks: 1, format: "text",
    question: "State **one** reason a programmer would use a constant instead of a variable for a value such as VAT_RATE. [1]",
    markScheme: [
      { text: "Any correct reason, e.g. the value should never change while the algorithm runs / it makes it clear the value is fixed / it prevents the value being accidentally changed", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-12", board: "aqa", topic: "fundamentals", concept: "constant-usage",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nCONSTANT VAT_RATE ← 0.2\nprice ← 50\ntotal ← price + (price * VAT_RATE)\nOUTPUT total\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) A programmer later needs to change the VAT rate to 0.25 everywhere it is used in a large program. Explain why using a constant like `VAT_RATE` makes this easier than if the value 0.2 had been typed directly wherever it was needed. [2]",
    markScheme: [
      { text: "(a) 60", marks: 1, guidance: "" },
      { text: "(b) Only the one line where the constant is defined needs to be changed", marks: 1, guidance: "" },
      { text: "(b) Whereas typing 0.2 directly in many places would mean finding and changing every occurrence, risking some being missed", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-13", board: "aqa", topic: "fundamentals", concept: "casting-errors",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the function used to convert a string into an integer in AQA pseudo-code. [1]\n\n(b) State what happens if this function is used on the string \"hello\". [1]",
    markScheme: [
      { text: "(a) `STRING_TO_INT`", marks: 1, guidance: "" },
      { text: "(b) An error occurs (the algorithm cannot continue)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-14", board: "aqa", topic: "fundamentals", concept: "casting-errors",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nage ← USERINPUT\nage ← STRING_TO_INT(age)\nOUTPUT age + 1\n```\n\n(a) Explain why the second line is necessary for the third line to work correctly. [2]\n\n(b) State what would happen if the user entered \"twelve\" instead of a number. [1]",
    markScheme: [
      { text: "(a) `USERINPUT` always returns a string, even if the user types digits", marks: 1, guidance: "" },
      { text: "(a) A string cannot be added to an integer with `+`, so it must be converted to an integer first", marks: 1, guidance: "" },
      { text: "(b) An error occurs, since \"twelve\" cannot be converted to a whole number", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-15", board: "aqa", topic: "fundamentals", concept: "arithmetic-operators-basic",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the AQA pseudo-code operator used to find the remainder after division. [1]\n\n(b) State the value of `17 MOD 5`. [1]",
    markScheme: [
      { text: "(a) MOD", marks: 1, guidance: "" },
      { text: "(b) 2", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-16", board: "aqa", topic: "fundamentals", concept: "arithmetic-operators-basic",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\na ← 20\nb ← 6\nOUTPUT a DIV b\nOUTPUT a MOD b\n```\n\n(a) State the output of the first `OUTPUT` statement. [1]\n\n(b) State the output of the second `OUTPUT` statement. [1]\n\n(c) Explain how these two values relate to the calculation 20 = (6 x 3) + 2. [1]",
    markScheme: [
      { text: "(a) 3", marks: 1, guidance: "" },
      { text: "(b) 2", marks: 1, guidance: "" },
      { text: "(c) 3 is how many times 6 divides into 20 whole times, and 2 is what is left over (the remainder)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-17", board: "aqa", topic: "fundamentals", concept: "real-vs-integer",
    ability: 1, marks: 1, format: "text",
    question: "State the most appropriate data type for a variable that stores a person's height in metres (e.g. 1.75). [1]",
    markScheme: [
      { text: "Real", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-18", board: "aqa", topic: "fundamentals", concept: "real-vs-integer",
    ability: 2, marks: 3, format: "text",
    question: "A programmer is deciding whether to store the number of students in a class as an integer or a real number, and whether to store each student's average test score as an integer or a real number.\n\nState, with a reason, which data type is more appropriate for **each** of these two values. [3]",
    markScheme: [
      { text: "Number of students: integer", marks: 1, guidance: "" },
      { text: "...because it is always a whole number (you cannot have part of a student)", marks: 1, guidance: "" },
      { text: "Average score: real, because dividing a total by a count can produce a decimal value", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- sequencing (+8, target 18)
  {
    id: "aqa-sequencing-11", board: "aqa", topic: "sequencing", concept: "operator-precedence",
    ability: 1, marks: 1, format: "text",
    question: "State the value of `2 + 3 * 4`. [1]",
    markScheme: [
      { text: "14", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-sequencing-12", board: "aqa", topic: "sequencing", concept: "operator-precedence",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\na ← 2 + 3 * 4\nb ← (2 + 3) * 4\nc ← 2 * 3 + 4 * 5\nOUTPUT a, b, c\n```\n\nState the output of this algorithm. [3]",
    markScheme: [
      { text: "14", marks: 1, guidance: "value of a" },
      { text: "20", marks: 1, guidance: "value of b" },
      { text: "26", marks: 1, guidance: "value of c" },
    ],
  },
  {
    id: "aqa-sequencing-13", board: "aqa", topic: "sequencing", concept: "swap-values",
    ability: 2, marks: 3, format: "code",
    question: "Write an algorithm that stores the values 5 and 9 in two variables, `a` and `b`, then swaps their values so that `a` holds 9 and `b` holds 5, and outputs both. A third, temporary variable may be used. [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Sets up `a` and `b` with the initial values 5 and 9", marks: 1, guidance: "" },
      { text: "Uses a third variable to hold one of the values while swapping, so neither original value is lost", marks: 1, guidance: "" },
      { text: "Correctly outputs `a` as 9 and `b` as 5 after the swap", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-sequencing-14", board: "aqa", topic: "sequencing", concept: "swap-values",
    ability: 3, marks: 5, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\na ← 5\nb ← 9\na ← b\nb ← a\nOUTPUT a, b\n```\n\n(a) State the output of this algorithm. [2]\n\n(b) Explain why this code does not correctly swap the values of `a` and `b`. [3]",
    markScheme: [
      { text: "(a) 9 9", marks: 2, guidance: "1 mark for each correct value, in the correct position." },
      { text: "(b) The line `a ← b` overwrites `a`'s original value (5) with `b`'s value (9), and that original value of `a` is now lost", marks: 2, guidance: "1 mark for identifying the value is lost, 1 mark for correctly explaining why (it was never saved anywhere)." },
      { text: "(b) So the next line, `b ← a`, just sets `b` to 9 again (a's new value), rather than to a's original value", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-sequencing-15", board: "aqa", topic: "sequencing", concept: "unit-conversion",
    ability: 1, marks: 2, format: "code",
    question: "Write an algorithm that asks for a temperature in Celsius and outputs it converted to Fahrenheit, using the formula F = (C x 9 / 5) + 32. [2]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the Celsius temperature as a number", marks: 1, guidance: "" },
      { text: "Correctly applies the formula and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-sequencing-16", board: "aqa", topic: "sequencing", concept: "unit-conversion",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for a distance in miles and outputs it converted to both kilometres (miles x 1.609) and metres (kilometres x 1000), each rounded to 1 decimal place, in the form `<value> km` and `<value> m`. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the distance in miles as a real number", marks: 1, guidance: "" },
      { text: "Correctly calculates the distance in kilometres", marks: 1, guidance: "" },
      { text: "Correctly calculates the distance in metres, using the kilometre value", marks: 1, guidance: "" },
      { text: "Both values are rounded to 1 decimal place", marks: 1, guidance: "" },
      { text: "Both values are output in the given form", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-sequencing-17", board: "aqa", topic: "sequencing", concept: "compound-expression",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\ntotal ← 10\ntotal ← total + 5\nOUTPUT total\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "15", marks: 2, guidance: "1 mark for understanding the new value depends on the old one, 1 mark for the correct final value." },
    ],
  },
  {
    id: "aqa-sequencing-18", board: "aqa", topic: "sequencing", concept: "compound-expression",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nscore ← 100\nscore ← score - 15\nscore ← score * 2\nOUTPUT score\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) State the value of `score` immediately after the second line has run (before the third line runs). [2]",
    markScheme: [
      { text: "(a) 170", marks: 1, guidance: "" },
      { text: "(b) 85", marks: 2, guidance: "1 mark for correctly subtracting 15 from 100, 1 mark for identifying this is the value at that point (before doubling)." },
    ],
  },

  // ---------------------------------------------------------------- selection (+12, target 24)
  {
    id: "aqa-selection-13", board: "aqa", topic: "selection", concept: "not-operator",
    ability: 1, marks: 1, format: "text",
    question: "State the value of `NOT TRUE`. [1]",
    markScheme: [
      { text: "FALSE", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-14", board: "aqa", topic: "selection", concept: "not-operator",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nloggedIn ← FALSE\nIF NOT loggedIn THEN\n  OUTPUT \"Please log in\"\nELSE\n  OUTPUT \"Welcome back\"\nENDIF\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) Rewrite the condition on line 2 without using `NOT`, so the algorithm behaves identically. [2]",
    markScheme: [
      { text: "(a) Please log in", marks: 1, guidance: "" },
      { text: "(b) A condition testing `loggedIn` directly against FALSE, e.g. `IF loggedIn == FALSE THEN`", marks: 1, guidance: "" },
      { text: "(b) ...with the branches kept in the same order (or swapped correctly if the condition itself is reversed instead)", marks: 1, guidance: "Award for any logically equivalent rewrite." },
    ],
  },
  {
    id: "aqa-selection-15", board: "aqa", topic: "selection", concept: "range-checking",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nnumber ← 7\nIF number >= 1 AND number <= 10 THEN\n  OUTPUT \"In range\"\nELSE\n  OUTPUT \"Out of range\"\nENDIF\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "In range", marks: 2, guidance: "1 mark for identifying both conditions must be checked, 1 mark for the correct final output." },
    ],
  },
  {
    id: "aqa-selection-16", board: "aqa", topic: "selection", concept: "range-checking",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for a percentage exam score and outputs the grade using this table: 90 or above is `A*`, 80 to 89 is `A`, 70 to 79 is `B`, and anything below 70 is `C or below`. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the score and converts it to an integer", marks: 1, guidance: "" },
      { text: "Correctly identifies 90 or above as \"A*\"", marks: 1, guidance: "" },
      { text: "Correctly identifies 80 to 89 as \"A\"", marks: 1, guidance: "" },
      { text: "Correctly identifies 70 to 79 as \"B\"", marks: 1, guidance: "" },
      { text: "Correctly identifies anything below 70 as \"C or below\", using a structure where only one message is ever output", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-17", board: "aqa", topic: "selection", concept: "nested-selection-trace",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nage ← 20\nhasTicket ← TRUE\nIF age >= 18 THEN\n  IF hasTicket THEN\n    OUTPUT \"Enter\"\n  ELSE\n    OUTPUT \"Buy a ticket\"\n  ENDIF\nELSE\n  OUTPUT \"Too young\"\nENDIF\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) State the output if `hasTicket` is changed to `FALSE`. [1]\n\n(c) State the output if `age` is changed to `16` (with `hasTicket` as `TRUE`). [1]",
    markScheme: [
      { text: "(a) Enter", marks: 1, guidance: "" },
      { text: "(b) Buy a ticket", marks: 1, guidance: "" },
      { text: "(c) Too young", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-18", board: "aqa", topic: "selection", concept: "nested-selection-trace",
    ability: 3, marks: 6, format: "code",
    question: "A theme park ride requires riders to be at least 120cm tall. Riders under 140cm tall must also be accompanied by an adult. Write an algorithm that asks for a rider's height (in cm) and whether they are accompanied by an adult, then outputs `Allowed` or `Not allowed` accordingly. [6]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the height as a number", marks: 1, guidance: "" },
      { text: "Inputs whether the rider is accompanied", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Not allowed\" for anyone under 120cm, regardless of being accompanied", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Allowed\" for anyone 140cm or over", marks: 1, guidance: "" },
      { text: "Correctly handles the 120-139cm range: \"Allowed\" only if accompanied, \"Not allowed\" if not", marks: 1, guidance: "" },
      { text: "Uses nested or combined (AND) selection so exactly one message is output for every case", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-19", board: "aqa", topic: "selection", concept: "equality-vs-assignment",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the operator used to check if two values are equal in an `IF` statement in AQA pseudo-code. [1]\n\n(b) State the operator used to assign (store) a value in a variable. [1]",
    markScheme: [
      { text: "(a) ==", marks: 1, guidance: "" },
      { text: "(b) ←", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-20", board: "aqa", topic: "selection", concept: "equality-vs-assignment",
    ability: 2, marks: 3, format: "text",
    question: "A student writes the following line of pseudo-code, intending to check whether `score` is equal to 10:\n\n```\nIF score ← 10 THEN\n```\n\n(a) Explain why this line is incorrect. [1]\n\n(b) Rewrite the line correctly. [2]",
    markScheme: [
      { text: "(a) `←` is the assignment operator, not the equality (comparison) operator, so it cannot be used inside a condition like this", marks: 1, guidance: "" },
      { text: "(b) `IF score == 10 THEN`", marks: 2, guidance: "1 mark for using ==, 1 mark for the rest of the line staying correct." },
    ],
  },
  {
    id: "aqa-selection-21", board: "aqa", topic: "selection", concept: "comparison-strings",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nanswer ← USERINPUT\nIF answer == \"Yes\" THEN\n  OUTPUT \"Confirmed\"\nELSE\n  OUTPUT \"Not confirmed\"\nENDIF\n```\n\n(a) State the output if the user enters `Yes`. [1]\n\n(b) State the output if the user enters `yes`. [1]\n\n(c) Explain why. [1]",
    markScheme: [
      { text: "(a) Confirmed", marks: 1, guidance: "" },
      { text: "(b) Not confirmed", marks: 1, guidance: "" },
      { text: "(c) String comparison is case-sensitive, so \"yes\" and \"Yes\" are not considered equal", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-22", board: "aqa", topic: "selection", concept: "comparison-strings",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks the user to confirm an action by entering \"yes\" or \"no\", accepting the answer regardless of the upper or lower case it is typed in. It should output `Confirmed`, `Cancelled`, or `Invalid response` for anything else. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Takes the response as input", marks: 1, guidance: "" },
      { text: "Converts the response to a single, consistent case before comparing", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Confirmed\" for any case-variant of \"yes\"", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Cancelled\" for any case-variant of \"no\"", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Invalid response\" for anything else", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-23", board: "aqa", topic: "selection", concept: "if-elif-chain-fizzbuzz",
    ability: 2, marks: 4, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nn ← 15\nIF n MOD 15 == 0 THEN\n  OUTPUT \"FizzBuzz\"\nELSE IF n MOD 3 == 0 THEN\n  OUTPUT \"Fizz\"\nELSE IF n MOD 5 == 0 THEN\n  OUTPUT \"Buzz\"\nELSE\n  OUTPUT n\nENDIF\n```\n\nState the output when `n` is: (a) 15 [1] (b) 9 [1] (c) 10 [1] (d) 7 [1]",
    markScheme: [
      { text: "(a) FizzBuzz", marks: 1, guidance: "" },
      { text: "(b) Fizz", marks: 1, guidance: "" },
      { text: "(c) Buzz", marks: 1, guidance: "" },
      { text: "(d) 7", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-24", board: "aqa", topic: "selection", concept: "if-elif-chain-fizzbuzz",
    ability: 1, marks: 1, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nIF 8 MOD 3 == 0 THEN\n  OUTPUT \"Fizz\"\nELSE\n  OUTPUT 8\nENDIF\n```\n\nState the output of this algorithm. [1]",
    markScheme: [
      { text: "8", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- iteration (+12, target 24)
  {
    id: "aqa-iteration-13", board: "aqa", topic: "iteration", concept: "while-loop-basic",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nn ← 1\nWHILE n < 5\n  OUTPUT n\n  n ← n + 1\nENDWHILE\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "1, 2, 3, 4 (each on its own line, or comma separated)", marks: 2, guidance: "1 mark for the correct four values, 1 mark for stopping before 5 is output." },
    ],
  },
  {
    id: "aqa-iteration-14", board: "aqa", topic: "iteration", concept: "while-loop-basic",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nn ← 1\nWHILE n < 5\n  OUTPUT n\n  n ← n + 1\nENDWHILE\n```\n\n(a) State how many times the loop body runs. [1]\n\n(b) Explain what would happen if the line `n ← n + 1` were removed. [2]",
    markScheme: [
      { text: "(a) 4", marks: 1, guidance: "" },
      { text: "(b) `n` would never change, so the condition `n < 5` would always stay TRUE", marks: 1, guidance: "" },
      { text: "(b) The loop would never end (an infinite loop)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-15", board: "aqa", topic: "iteration", concept: "loop-counter",
    ability: 1, marks: 2, format: "code",
    question: "Write an algorithm that asks for 5 whole numbers, one at a time, and outputs how many of them were negative. [2]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Uses a loop that runs exactly 5 times, taking one input per iteration", marks: 1, guidance: "" },
      { text: "Keeps a counter that increases when a number is negative, and outputs it after the loop", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-16", board: "aqa", topic: "iteration", concept: "loop-counter",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for whole numbers, one at a time, stopping as soon as the user enters 0. It should then output how many positive numbers and how many negative numbers were entered before the 0 (the 0 itself should not be counted as either). [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Uses condition-controlled iteration that keeps reading numbers until 0 is entered", marks: 1, guidance: "" },
      { text: "Keeps a separate counter for positive numbers and for negative numbers", marks: 1, guidance: "" },
      { text: "Correctly increases the positive counter only for numbers greater than 0", marks: 1, guidance: "" },
      { text: "Correctly increases the negative counter only for numbers less than 0", marks: 1, guidance: "" },
      { text: "Outputs both counts after the loop ends, with the 0 itself never counted", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-17", board: "aqa", topic: "iteration", concept: "loop-vs-loop-choice",
    ability: 2, marks: 4, format: "text",
    question: "A programmer needs to write two separate algorithms:\n\n1. Output the 12 times table, from 1 x 12 up to 12 x 12.\n2. Keep asking a user to enter a password until they enter the correct one.\n\nFor **each** task, state which type of iteration (count-controlled or condition-controlled) is more suitable, and explain why. [4]",
    markScheme: [
      { text: "Task 1: count-controlled", marks: 1, guidance: "" },
      { text: "...because the number of times the loop must run (12) is known in advance, before the loop starts", marks: 1, guidance: "" },
      { text: "Task 2: condition-controlled", marks: 1, guidance: "" },
      { text: "...because it is not known in advance how many attempts the user will need; the loop must keep going until a specific condition (correct password) is met", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-18", board: "aqa", topic: "iteration", concept: "loop-vs-loop-choice",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the type of iteration that repeats a fixed, known number of times. [1]\n\n(b) State the type of iteration that repeats until a condition becomes TRUE (or FALSE). [1]",
    markScheme: [
      { text: "(a) Count-controlled", marks: 1, guidance: "" },
      { text: "(b) Condition-controlled", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-19", board: "aqa", topic: "iteration", concept: "loop-running-total",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\ntotal ← 0\nFOR n ← 1 TO 4\n  total ← total + n\nENDFOR\nOUTPUT total\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "10", marks: 2, guidance: "1 mark for correctly adding 1+2+3+4, 1 mark for the correct final total." },
    ],
  },
  {
    id: "aqa-iteration-20", board: "aqa", topic: "iteration", concept: "loop-running-total",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that asks for 5 prices (which may include pence) and outputs the total cost of all 5. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Sets a running total to 0 before the loop", marks: 1, guidance: "" },
      { text: "Uses a loop that runs exactly 5 times", marks: 1, guidance: "" },
      { text: "Inputs a price each time, as a real number, and adds it to the running total", marks: 1, guidance: "" },
      { text: "Outputs the total after the loop has finished", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-21", board: "aqa", topic: "iteration", concept: "loop-average",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\ntotal ← 0\ncount ← 0\nFOR EACH mark IN [70, 85, 60, 90]\n  total ← total + mark\n  count ← count + 1\nENDFOR\nOUTPUT total / count\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) State what this calculation finds. [1]\n\n(c) State why the variable `count` is needed, rather than just dividing by 4 directly. [1]",
    markScheme: [
      { text: "(a) 76.25", marks: 1, guidance: "" },
      { text: "(b) The mean/average of the marks", marks: 1, guidance: "" },
      { text: "(c) It works correctly for a list of any size, not just one with exactly 4 items", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-22", board: "aqa", topic: "iteration", concept: "loop-average",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for whole numbers one at a time, stopping when the user enters -1 (the -1 itself should not be included). It should then output the mean (average) of the numbers entered, rounded to 2 decimal places. You may assume at least one number is entered before -1. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Sets a running total and a count to 0 before the loop", marks: 1, guidance: "" },
      { text: "Uses condition-controlled iteration that keeps reading numbers until -1 is entered", marks: 1, guidance: "" },
      { text: "Adds each number (other than -1) to the total and increases the count", marks: 1, guidance: "" },
      { text: "Correctly calculates the mean (total divided by count) once the loop ends", marks: 1, guidance: "" },
      { text: "Outputs the mean rounded to 2 decimal places", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-23", board: "aqa", topic: "iteration", concept: "step-values",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nFOR i ← 10 TO 2 STEP -2\n  OUTPUT i\nENDFOR\n```\n\nState the complete output of this algorithm, in order. [3]",
    markScheme: [
      { text: "10, 8, 6", marks: 1, guidance: "the first three values" },
      { text: "4, 2, in that order", marks: 1, guidance: "" },
      { text: "Exactly five values are output, stopping at 2 (not continuing to 0 or below)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-24", board: "aqa", topic: "iteration", concept: "step-values",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that outputs the numbers from 20 down to 0, going down in steps of 5 (20, 15, 10, 5, 0), using a FOR loop with a STEP of -5. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Uses a FOR loop with a starting value of 20 and an ending value of 0", marks: 1, guidance: "" },
      { text: "Uses a STEP of -5 (a negative step, since the count goes down)", marks: 1, guidance: "" },
      { text: "Outputs the loop variable once per iteration", marks: 1, guidance: "" },
      { text: "The first value output is 20 and the last is 0 (0 is included)", marks: 1, guidance: "" },
      { text: "Exactly five values are output in total: 20, 15, 10, 5, 0", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- lists (+8, target 18)
  {
    id: "aqa-lists-11", board: "aqa", topic: "lists", concept: "list-length",
    ability: 1, marks: 1, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nfruits ← [\"apple\", \"banana\", \"cherry\", \"date\"]\nOUTPUT LEN(fruits)\n```\n\nState the output of this algorithm. [1]",
    markScheme: [
      { text: "4", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-12", board: "aqa", topic: "lists", concept: "list-length",
    ability: 2, marks: 3, format: "code",
    question: "Write an algorithm that asks for a whole number, N, and then asks for N more whole numbers, adding each to an array. The algorithm should then output the number of items in the array, using `LEN`. [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs N as an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that runs N times, adding each input number to an array", marks: 1, guidance: "" },
      { text: "Outputs `LEN` of the array after the loop", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-13", board: "aqa", topic: "lists", concept: "list-index-error",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code. Arrays are indexed from 1.\n\n```\nscores ← [10, 20, 30]\nOUTPUT scores[4]\n```\n\n(a) State what happens when this algorithm runs. [1]\n\n(b) Explain why this happens. [2]",
    markScheme: [
      { text: "(a) An error occurs", marks: 1, guidance: "" },
      { text: "(b) The array `scores` only has 3 items, at positions 1, 2 and 3", marks: 1, guidance: "" },
      { text: "(b) Position 4 does not exist in the array", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-14", board: "aqa", topic: "lists", concept: "list-index-error",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that stores an array of 5 names. It should ask for a position from the user and output the name at that position, or `Invalid position` if the number entered does not correspond to a valid position in the array (positions are 1 to 5). [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Creates an array of 5 names", marks: 1, guidance: "" },
      { text: "Inputs a position as an integer", marks: 1, guidance: "" },
      { text: "Correctly checks whether the position is valid for the array (1 to 5)", marks: 1, guidance: "" },
      { text: "Outputs the name at that position when it is valid", marks: 1, guidance: "" },
      { text: "Outputs \"Invalid position\" for any position outside 1 to 5, without the algorithm crashing", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-15", board: "aqa", topic: "lists", concept: "list-count-matches",
    ability: 1, marks: 2, format: "code",
    question: "An array contains the exam results `[\"Pass\", \"Fail\", \"Pass\", \"Pass\", \"Fail\"]`. Write an algorithm that counts and outputs how many of the results are \"Pass\". [2]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Uses a loop to go through every item in the array", marks: 1, guidance: "" },
      { text: "Correctly counts and outputs how many items equal \"Pass\"", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-16", board: "aqa", topic: "lists", concept: "list-count-matches",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that asks for 8 whole numbers, storing them in an array, then outputs how many of them are even numbers. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Creates an empty array and uses a loop to input exactly 8 numbers into it", marks: 1, guidance: "" },
      { text: "Uses a second loop (or the same one) to check each number in the array", marks: 1, guidance: "" },
      { text: "Correctly identifies an even number (e.g. using MOD 2 == 0)", marks: 1, guidance: "" },
      { text: "Outputs the correct count of even numbers", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-17", board: "aqa", topic: "lists", concept: "list-remove-item",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nfruits ← [\"apple\", \"banana\", \"cherry\"]\nREMOVE(fruits, \"banana\")\nOUTPUT fruits\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "[\"apple\", \"cherry\"]", marks: 2, guidance: "1 mark for both remaining items, 1 mark for banana correctly removed and the order kept." },
    ],
  },
  {
    id: "aqa-lists-18", board: "aqa", topic: "lists", concept: "list-remove-item",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that stores an array of 5 names. It should ask for a name from the user and remove it from the array if it is present, then output the updated array. If the name is not in the array, the algorithm should output `Name not found` instead. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Creates an array of 5 names", marks: 1, guidance: "" },
      { text: "Inputs a name to remove", marks: 1, guidance: "" },
      { text: "Checks whether the name is in the array before trying to remove it", marks: 1, guidance: "" },
      { text: "Removes the name and outputs the updated array if found, or outputs \"Name not found\" if not", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- strings (+8, target 18)
  {
    id: "aqa-strings-11", board: "aqa", topic: "strings", concept: "case-conversion",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nword ← \"Hello\"\nOUTPUT UPPER(word)\nOUTPUT LOWER(word)\n```\n\nState the output of both lines, in order. [2]",
    markScheme: [
      { text: "HELLO", marks: 1, guidance: "" },
      { text: "hello", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-12", board: "aqa", topic: "strings", concept: "case-conversion",
    ability: 2, marks: 3, format: "code",
    question: "Write an algorithm that asks for a username and outputs whether it is exactly \"admin\" (matching regardless of the upper/lower case it was typed in). [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Takes the username as input", marks: 1, guidance: "" },
      { text: "Converts the input to a single, consistent case before comparing", marks: 1, guidance: "" },
      { text: "Correctly compares it to \"admin\" (in that same case) and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-13", board: "aqa", topic: "strings", concept: "string-concatenation-loop",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that asks for a word and outputs it with every character repeated twice, for example `cat` becomes `ccaatt`. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Takes the word as input", marks: 1, guidance: "" },
      { text: "Starts with an empty string to build the result", marks: 1, guidance: "" },
      { text: "Loops through each character of the word, adding it to the result twice", marks: 1, guidance: "" },
      { text: "Outputs the completed result after the loop", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-14", board: "aqa", topic: "strings", concept: "string-concatenation-loop",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for a word and outputs it with the letters in reverse order, without using a built-in reverse function (build the reversed word yourself, one character at a time). [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Takes the word as input", marks: 1, guidance: "" },
      { text: "Starts with an empty string to build the result", marks: 1, guidance: "" },
      { text: "Loops through the characters of the word (in either direction)", marks: 1, guidance: "" },
      { text: "Correctly adds each character so the final string ends up reversed (e.g. adding each new character to the front of the result)", marks: 1, guidance: "" },
      { text: "Outputs the completed reversed word after the loop", marks: 1, guidance: "No credit if a built-in reverse function is used." },
    ],
  },
  {
    id: "aqa-strings-15", board: "aqa", topic: "strings", concept: "type-of-string",
    ability: 1, marks: 1, format: "text",
    question: "State the data type of the value `\"123\"` (with the quote marks). [1]",
    markScheme: [
      { text: "String", marks: 1, guidance: "Do not allow: integer, number." },
    ],
  },
  {
    id: "aqa-strings-16", board: "aqa", topic: "strings", concept: "type-of-string",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\na ← \"123\"\nb ← \"456\"\nOUTPUT a + b\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) Explain why the output is not the number 579. [2]",
    markScheme: [
      { text: "(a) 123456", marks: 1, guidance: "" },
      { text: "(b) `a` and `b` are strings, not integers, even though they contain only digits", marks: 1, guidance: "" },
      { text: "(b) `+` on two strings joins (concatenates) them rather than adding them numerically", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-17", board: "aqa", topic: "strings", concept: "string-membership",
    ability: 1, marks: 2, format: "text",
    question: "The `FIND` function returns the position of a substring within a string, or -1 if it is not present.\n\nThe following algorithm is written in pseudo-code.\n\n```\nword ← \"pineapple\"\nOUTPUT FIND(word, \"apple\")\nOUTPUT FIND(word, \"banana\")\n```\n\nState the output of both lines, in order. [2]",
    markScheme: [
      { text: "4 (or the correct position where \"apple\" begins in \"pineapple\")", marks: 1, guidance: "Allow either 0-indexed or 1-indexed position, as long as it is consistent with the rest of the student's working." },
      { text: "-1", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-18", board: "aqa", topic: "strings", concept: "string-membership",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that asks for a whole number N, then asks for N words one at a time, and outputs how many of them contain the letter \"e\" (in either upper or lower case). [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs N as an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that runs N times, taking one word as input each time", marks: 1, guidance: "" },
      { text: "Correctly checks each word for the letter \"e\" in either case", marks: 1, guidance: "" },
      { text: "Outputs the correct final count", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- functions (+12, target 24)
  {
    id: "aqa-functions-13", board: "aqa", topic: "functions", concept: "recursive-function-basic",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE countdown(n)\n  IF n == 0 THEN\n    OUTPUT \"Go!\"\n  ELSE\n    OUTPUT n\n    countdown(n - 1)\n  ENDIF\nENDSUBROUTINE\n\ncountdown(3)\n```\n\nState the complete output of this algorithm, in order. [3]",
    markScheme: [
      { text: "3, 2, 1 (in that order, each on its own line)", marks: 2, guidance: "1 mark for the correct three numbers, 1 mark for the correct descending order." },
      { text: "Go!", marks: 1, guidance: "As the final line of output." },
    ],
  },
  {
    id: "aqa-functions-14", board: "aqa", topic: "functions", concept: "recursive-function-basic",
    ability: 3, marks: 5, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE countdown(n)\n  IF n == 0 THEN\n    OUTPUT \"Go!\"\n  ELSE\n    OUTPUT n\n    countdown(n - 1)\n  ENDIF\nENDSUBROUTINE\n```\n\n(a) State the name given to a subroutine, like `countdown`, that calls itself. [1]\n\n(b) State the name given to the condition (here, `n == 0`) that stops the calls from continuing forever. [1]\n\n(c) Explain what would happen if this condition were removed from the subroutine. [3]",
    markScheme: [
      { text: "(a) Recursive / recursion", marks: 1, guidance: "" },
      { text: "(b) Base case", marks: 1, guidance: "" },
      { text: "(c) The subroutine would keep calling itself, with `n` decreasing by 1 each time, and never stop on its own", marks: 1, guidance: "" },
      { text: "(c) `n` would carry on past 0 into negative numbers indefinitely", marks: 1, guidance: "" },
      { text: "(c) Eventually the program would crash, since each call uses more memory (a stack overflow)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-15", board: "aqa", topic: "functions", concept: "subroutine-calling-subroutine",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE isEven(n)\n  RETURN n MOD 2 == 0\nENDSUBROUTINE\n\nOUTPUT isEven(4)\nOUTPUT isEven(7)\n```\n\nState the output of both lines, in order. [2]",
    markScheme: [
      { text: "TRUE", marks: 1, guidance: "" },
      { text: "FALSE", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-16", board: "aqa", topic: "functions", concept: "subroutine-calling-subroutine",
    ability: 2, marks: 4, format: "code",
    question: "Write a subroutine `isEven(n)` that returns TRUE if `n` is even and FALSE otherwise. Then write a second subroutine `countEvens(numbers)` that takes an array of numbers and returns how many of them are even, using your `isEven` subroutine to check each one. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "`isEven` correctly returns TRUE for even numbers and FALSE for odd numbers", marks: 1, guidance: "" },
      { text: "`countEvens` loops through every item in the `numbers` array", marks: 1, guidance: "" },
      { text: "`countEvens` calls `isEven` for each item to decide whether to count it", marks: 1, guidance: "" },
      { text: "`countEvens` correctly returns the final count", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-17", board: "aqa", topic: "functions", concept: "subroutine-validation",
    ability: 2, marks: 3, format: "code",
    question: "Write a subroutine `isValidAge(age)` that returns TRUE if `age` is between 0 and 120 (inclusive), and FALSE otherwise. [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Defines a subroutine with the correct name and one parameter", marks: 1, guidance: "" },
      { text: "Correctly checks both boundaries (0 and 120 count as valid)", marks: 1, guidance: "" },
      { text: "Returns TRUE or FALSE correctly based on the check", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-18", board: "aqa", topic: "functions", concept: "subroutine-validation",
    ability: 3, marks: 5, format: "code",
    question: "Write a subroutine `isValidAge(age)` that returns TRUE if `age` is between 0 and 120 (inclusive), and FALSE otherwise. Then write an algorithm that keeps asking for an age, using your subroutine to check it, until a valid age is entered, then outputs `Thank you`. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "`isValidAge` correctly checks both boundaries and returns TRUE or FALSE", marks: 1, guidance: "" },
      { text: "Inputs an age as an integer", marks: 1, guidance: "" },
      { text: "Uses condition-controlled iteration, calling `isValidAge` to decide whether to keep looping", marks: 1, guidance: "" },
      { text: "Asks for a new age again inside the loop when the current one is invalid", marks: 1, guidance: "" },
      { text: "Outputs \"Thank you\" once `isValidAge` returns TRUE", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-19", board: "aqa", topic: "functions", concept: "multiple-parameters",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE addThree(a, b, c)\n  RETURN a + b + c\nENDSUBROUTINE\n\nOUTPUT addThree(2, 5, 8)\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "15", marks: 2, guidance: "1 mark for correctly matching the arguments to the parameters, 1 mark for the correct final value." },
    ],
  },
  {
    id: "aqa-functions-20", board: "aqa", topic: "functions", concept: "multiple-parameters",
    ability: 2, marks: 4, format: "code",
    question: "Write a subroutine `boxVolume(length, width, height)` that returns the volume of a box (length x width x height). Then ask for three numbers and use your subroutine to output the volume. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Defines a subroutine with the correct name and three parameters", marks: 1, guidance: "" },
      { text: "Correctly returns the product of all three parameters", marks: 1, guidance: "" },
      { text: "Inputs three numbers", marks: 1, guidance: "" },
      { text: "Calls the subroutine with the three inputs, in the correct order, and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-21", board: "aqa", topic: "functions", concept: "local-scope",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE setName()\n  name ← \"Ada\"\n  OUTPUT name\nENDSUBROUTINE\n\nsetName()\nOUTPUT name\n```\n\n(a) State the output of the first `OUTPUT` statement (inside the subroutine). [1]\n\n(b) State what happens on the last line. [1]\n\n(c) Explain why. [1]",
    markScheme: [
      { text: "(a) Ada", marks: 1, guidance: "" },
      { text: "(b) An error occurs", marks: 1, guidance: "" },
      { text: "(c) `name` is a local variable - it only exists inside the subroutine it was created in, and is not accessible outside it", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-22", board: "aqa", topic: "functions", concept: "local-scope",
    ability: 3, marks: 5, format: "code",
    question: "Write a subroutine `applyDiscount(price, percent)` that returns `price` reduced by `percent`% (for example, a price of 100 with a percent of 20 returns 80). The subroutine must not use any variable other than its own two parameters and any it defines and uses itself. Then, ask for a price and a discount percentage, and output the result of calling your subroutine. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Defines a subroutine with the correct name and both parameters", marks: 1, guidance: "" },
      { text: "Correctly calculates the discount amount from `price` and `percent`", marks: 1, guidance: "" },
      { text: "Correctly returns `price` minus the discount amount", marks: 1, guidance: "" },
      { text: "Inputs a price and a percentage as numbers", marks: 1, guidance: "" },
      { text: "Calls the subroutine with the two inputs and outputs the result", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-23", board: "aqa", topic: "functions", concept: "procedure-vs-function-usage",
    ability: 1, marks: 2, format: "text",
    question: "(a) State whether a subroutine that displays a welcome message but sends back no value is a function or a procedure. [1]\n\n(b) State whether a subroutine that works out and sends back a total is a function or a procedure. [1]",
    markScheme: [
      { text: "(a) Procedure", marks: 1, guidance: "" },
      { text: "(b) Function", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-24", board: "aqa", topic: "functions", concept: "procedure-vs-function-usage",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE showMenu()\n  OUTPUT \"1. Start\"\n  OUTPUT \"2. Quit\"\nENDSUBROUTINE\n\nSUBROUTINE getTotal(a, b)\n  RETURN a + b\nENDSUBROUTINE\n\nshowMenu()\nresult ← getTotal(3, 4)\nOUTPUT result\n```\n\n(a) State the output of this algorithm, in full. [2]\n\n(b) Explain why `showMenu()` is used as its own line, but `getTotal(3, 4)` is assigned to a variable. [1]",
    markScheme: [
      { text: "(a) 1. Start / 2. Quit / 7, each on its own line", marks: 2, guidance: "1 mark for the menu lines, 1 mark for 7." },
      { text: "(b) `showMenu` is a procedure - it does not return a value, so there is nothing to store; `getTotal` is a function, so its returned value needs to be captured to be used", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- files (+8, target 18)
  {
    id: "aqa-files-11", board: "aqa", topic: "files", concept: "file-exists-check",
    ability: 1, marks: 2, format: "text",
    question: "State **two** problems that could occur if an algorithm tries to open a file for reading that does not exist. [2]",
    markScheme: [
      { text: "Any two of: the program crashes / an error occurs / the program is unable to continue running / data intended to be read is simply not there", marks: 2, guidance: "1 mark per valid problem, up to 2." },
    ],
  },
  {
    id: "aqa-files-12", board: "aqa", topic: "files", concept: "file-exists-check",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that checks whether a file called \"settings.txt\" exists, using a function `FILE_EXISTS(filename)` that returns TRUE or FALSE. If it exists, the algorithm should open and output its contents. If it does not exist, the algorithm should output `File not found` instead. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Checks whether the file exists using the given function, before trying to open it", marks: 1, guidance: "" },
      { text: "Opens the file for reading when it exists", marks: 1, guidance: "" },
      { text: "Outputs the file's contents", marks: 1, guidance: "" },
      { text: "Outputs \"File not found\" when the file does not exist, instead of trying to open it", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-13", board: "aqa", topic: "files", concept: "file-write-list",
    ability: 2, marks: 3, format: "code",
    question: "An array called `names` contains 4 names. Write an algorithm that opens a file called \"names.txt\" for writing and writes each name in the array on its own line, then closes the file. [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Opens \"names.txt\" for writing", marks: 1, guidance: "" },
      { text: "Uses a loop to write each name in the array, each followed by a newline character", marks: 1, guidance: "" },
      { text: "Closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-14", board: "aqa", topic: "files", concept: "file-write-list",
    ability: 3, marks: 5, format: "code",
    question: "An array called `scores` contains 6 whole numbers. Write an algorithm that writes each score to a file called \"scores.txt\", one per line, then reopens the file and outputs how many of the scores stored in the file are above 50. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Opens \"scores.txt\" for writing and writes each score followed by a newline, then closes the file", marks: 1, guidance: "" },
      { text: "Reopens \"scores.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop to read each line and convert it back to a number", marks: 1, guidance: "" },
      { text: "Correctly counts how many are above 50", marks: 1, guidance: "" },
      { text: "Outputs the count, and closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-15", board: "aqa", topic: "files", concept: "file-delimited-fields",
    ability: 1, marks: 2, format: "text",
    question: "A line in a file reads: `Ada,10,Turing`\n\n(a) State the character used to separate each piece of data on this line. [1]\n\n(b) State the name of the technique that splits a line of text into separate pieces of data using this character. [1]",
    markScheme: [
      { text: "(a) Comma", marks: 1, guidance: "" },
      { text: "(b) Splitting (tokenising) the string", marks: 1, guidance: "Allow: SPLIT function." },
    ],
  },
  {
    id: "aqa-files-16", board: "aqa", topic: "files", concept: "file-delimited-fields",
    ability: 2, marks: 4, format: "code",
    question: "A file called \"students.txt\" has one student per line, in the form `name,year`, for example `Ada,10`. Write an algorithm that opens the file, and for each line, outputs just the name. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Opens \"students.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop to read each line", marks: 1, guidance: "" },
      { text: "Splits each line at the comma into its two parts", marks: 1, guidance: "" },
      { text: "Outputs just the name part for every line", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-17", board: "aqa", topic: "files", concept: "file-overwrite-protection",
    ability: 2, marks: 3, format: "text",
    question: "An algorithm is about to open a file called \"data.txt\" in overwrite mode to save some new data.\n\nExplain the risk of doing this without checking anything first, and suggest one way the algorithm could reduce this risk. [3]",
    markScheme: [
      { text: "Opening a file in overwrite mode immediately erases its existing contents, even if it hasn't been read yet", marks: 1, guidance: "" },
      { text: "If \"data.txt\" already contained important data, that data would be permanently lost", marks: 1, guidance: "" },
      { text: "A way to reduce the risk: check if the file already exists first and warn the user, or read and back up its contents before overwriting", marks: 1, guidance: "Allow any reasonable safeguard." },
    ],
  },
  {
    id: "aqa-files-18", board: "aqa", topic: "files", concept: "file-overwrite-protection",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that checks whether a file called \"save.txt\" already exists (using a function `FILE_EXISTS(filename)`). If it does, the algorithm should ask the user \"File exists. Overwrite? (yes/no)\" and only save new data (the text \"Save data\") to the file if the answer is \"yes\". If the file does not already exist, the algorithm should save the data straight away. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Checks whether the file exists using the given function", marks: 1, guidance: "" },
      { text: "If it exists, asks the user the given question", marks: 1, guidance: "" },
      { text: "Only writes to the file (in this case) if the answer is \"yes\"", marks: 1, guidance: "" },
      { text: "Writes to the file straight away if it did not already exist", marks: 1, guidance: "" },
      { text: "The data actually written is the text \"Save data\"", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- searching-sorting (+8, target 18)
  {
    id: "aqa-searching-sorting-11", board: "aqa", topic: "searching-sorting", concept: "binary-search-requirement",
    ability: 1, marks: 1, format: "text",
    question: "State the one condition an array must meet before a binary search can be used on it. [1]",
    markScheme: [
      { text: "It must already be sorted (in order)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-12", board: "aqa", topic: "searching-sorting", concept: "binary-search-requirement",
    ability: 2, marks: 3, format: "text",
    question: "A binary search is attempted on the unsorted array `[9, 2, 14, 5, 40]` (indexed from 1, 5 items), looking for the value 5.\n\n(a) State the middle position that is checked first, and the value found there. [1]\n\n(b) Since 5 is less than 14, the algorithm assumes it must be in the left half of the array and only searches positions 1 and 2. Explain why this assumption is unsafe here. [2]",
    markScheme: [
      { text: "(a) Position 3, value 14", marks: 1, guidance: "" },
      { text: "(b) Binary search relies on the array being sorted, so that everything to the left of the middle is smaller and everything to the right is bigger", marks: 1, guidance: "" },
      { text: "(b) Because this array is not sorted, 5 is actually in the right half (position 4), so the algorithm would wrongly report it as not found", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-13", board: "aqa", topic: "searching-sorting", concept: "search-time-comparison",
    ability: 2, marks: 3, format: "text",
    question: "An array of 1,000 sorted numbers is searched for a value using both a linear search and a binary search.\n\nExplain why the binary search is likely to need far fewer comparisons than the linear search. [3]",
    markScheme: [
      { text: "A linear search checks items one at a time from the start, so it may need to check close to all 1,000 items in the worst case", marks: 1, guidance: "" },
      { text: "A binary search repeatedly checks the middle item and eliminates half of the remaining items each time", marks: 1, guidance: "" },
      { text: "This means it only needs around 10 comparisons at most to search 1,000 items, far fewer than a linear search's worst case", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-14", board: "aqa", topic: "searching-sorting", concept: "search-time-comparison",
    ability: 3, marks: 5, format: "text",
    question: "A school wants to search for a student's record by their surname in an array of all students.\n\nDiscuss whether a linear search or a binary search would be more appropriate, considering both how the array of students is likely to be maintained and how searches will be performed. [5]",
    markScheme: [
      { text: "A binary search would generally be faster once the array is large", marks: 1, guidance: "" },
      { text: "...but it requires the array to be kept sorted by surname at all times", marks: 1, guidance: "" },
      { text: "If students are added or removed often, keeping the array sorted has its own ongoing cost", marks: 1, guidance: "" },
      { text: "A linear search needs no sorting and is simple, but is slower, especially as the school (and the array) grows", marks: 1, guidance: "" },
      { text: "A reasoned conclusion, e.g. binary search is worth it if searches happen far more often than the array changes, and vice versa", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-15", board: "aqa", topic: "searching-sorting", concept: "insertion-sort-trace",
    ability: 2, marks: 4, format: "text",
    question: "An insertion sort is used to sort the array `[5, 2, 4, 1]` into ascending order, one item at a time (starting from the second item).\n\nShow the state of the array after each item has been inserted into its correct position. [4]",
    markScheme: [
      { text: "After inserting 2: [2, 5, 4, 1]", marks: 1, guidance: "" },
      { text: "After inserting 4: [2, 4, 5, 1]", marks: 1, guidance: "" },
      { text: "After inserting 1: [1, 2, 4, 5]", marks: 1, guidance: "" },
      { text: "The array is now fully sorted", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-16", board: "aqa", topic: "searching-sorting", concept: "insertion-sort-trace",
    ability: 3, marks: 5, format: "text",
    question: "State **three** differences between how an insertion sort and a merge sort approach sorting an array. [3]\n\nState **one** advantage of a merge sort over an insertion sort for very large arrays. [2]",
    markScheme: [
      { text: "Any three of: insertion sort builds a sorted section one item at a time / merge sort repeatedly splits the array in half; insertion sort works on the original array in place / merge sort creates new sub-arrays as it splits; insertion sort compares each new item against the already-sorted section / merge sort merges two already-sorted halves back together", marks: 3, guidance: "1 mark per correct, distinct difference, up to 3." },
      { text: "Merge sort is generally much faster for very large arrays", marks: 1, guidance: "" },
      { text: "...because its performance scales better as the array grows", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-17", board: "aqa", topic: "searching-sorting", concept: "linear-search-unsorted",
    ability: 1, marks: 1, format: "text",
    question: "State why a linear search (unlike a binary search) can be used on an array that has not been sorted. [1]",
    markScheme: [
      { text: "It checks every item one at a time from the start, so it does not rely on the items being in any particular order", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-searching-sorting-18", board: "aqa", topic: "searching-sorting", concept: "linear-search-unsorted",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that uses a linear search to count how many times a number, entered by the user, appears in the (unsorted) array `[4, 7, 4, 2, 4, 9]`. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the number to search for as an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that checks every item in the array, without needing it to be sorted", marks: 1, guidance: "" },
      { text: "Correctly counts every match, not just the first one found", marks: 1, guidance: "" },
      { text: "Outputs the final count after the loop", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- robust-programs (+8, target 18)
  {
    id: "aqa-robust-programs-11", board: "aqa", topic: "robust-programs", concept: "check-digit",
    ability: 1, marks: 1, format: "text",
    question: "State the purpose of a check digit added to the end of a barcode or ID number. [1]",
    markScheme: [
      { text: "To detect (some) errors made when the number is entered or read", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-robust-programs-12", board: "aqa", topic: "robust-programs", concept: "check-digit",
    ability: 2, marks: 3, format: "text",
    question: "A 6-digit product code has a 7th digit added as a check digit, calculated from the first 6 digits by a fixed rule.\n\n(a) Explain how a check digit could reveal that a product code has been mistyped. [2]\n\n(b) State whether this method can guarantee that every possible typing error will be detected. [1]",
    markScheme: [
      { text: "(a) When a code is entered, the same rule is used to recalculate what the check digit should be from the first 6 digits", marks: 1, guidance: "" },
      { text: "(a) If the recalculated check digit does not match the one entered, an error has occurred somewhere in the code", marks: 1, guidance: "" },
      { text: "(b) No - it can catch many, but not all, possible errors", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-robust-programs-13", board: "aqa", topic: "robust-programs", concept: "readability-comments",
    ability: 1, marks: 2, format: "text",
    question: "State **two** things a programmer can do to make their algorithm's code easier for another programmer to read and understand. [2]",
    markScheme: [
      { text: "Any two of: use meaningful (sensible) variable/subroutine names / add comments to explain what code does / use consistent indentation / break the algorithm into subroutines", marks: 2, guidance: "1 mark per valid technique, up to 2." },
    ],
  },
  {
    id: "aqa-robust-programs-14", board: "aqa", topic: "robust-programs", concept: "readability-comments",
    ability: 2, marks: 4, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE f(x, y)\n  // z is the result\n  z ← x * y * 0.2\n  RETURN z\nENDSUBROUTINE\n```\n\nExplain **two** ways this code could be rewritten to be more maintainable, without changing what it calculates. [4]",
    markScheme: [
      { text: "Rename `f` to a meaningful subroutine name, e.g. `calculateVAT`", marks: 1, guidance: "" },
      { text: "This makes it clear what the subroutine is for, just from its name", marks: 1, guidance: "" },
      { text: "Rename `x`, `y` and `z` to meaningful names, e.g. `price`, `quantity`, `vatAmount`", marks: 1, guidance: "" },
      { text: "This makes the calculation easier to follow, and the existing comment becomes unnecessary", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-robust-programs-15", board: "aqa", topic: "robust-programs", concept: "decomposition",
    ability: 1, marks: 2, format: "text",
    question: "State **two** benefits of breaking a large program down into smaller subroutines, each handling one clear task. [2]",
    markScheme: [
      { text: "Any two of: easier to test each part separately / easier to understand and maintain / subroutines can be reused elsewhere in the program / different programmers can work on different subroutines at the same time", marks: 2, guidance: "1 mark per correct benefit, up to 2." },
    ],
  },
  {
    id: "aqa-robust-programs-16", board: "aqa", topic: "robust-programs", concept: "decomposition",
    ability: 2, marks: 4, format: "text",
    question: "A programmer is writing a single, very long subroutine that reads student data from a file, validates it, calculates each student's average score, and then writes a report to another file.\n\nExplain how decomposing this into several smaller subroutines would make the program easier to test and maintain. [4]",
    markScheme: [
      { text: "Each stage (reading, validating, calculating, writing) could be its own subroutine, each with one clear job", marks: 1, guidance: "" },
      { text: "Each subroutine could then be tested on its own, with its own test data, independently of the others", marks: 1, guidance: "" },
      { text: "If an error occurs, it is much easier to narrow down which subroutine is responsible", marks: 1, guidance: "" },
      { text: "A change to one stage (e.g. the report format) is less likely to accidentally affect the others", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-robust-programs-17", board: "aqa", topic: "robust-programs", concept: "authentication-2fa",
    ability: 2, marks: 3, format: "text",
    question: "State what is meant by **two-factor authentication**, and give an example of a second factor in addition to a password. [3]",
    markScheme: [
      { text: "A login process that requires two separate pieces of evidence (factors) to prove identity, rather than just one", marks: 1, guidance: "" },
      { text: "The two factors normally come from different categories, e.g. something you know and something you have (or something you are)", marks: 1, guidance: "" },
      { text: "A valid example of a second factor, e.g. a code sent to a phone, a fingerprint, or a physical security key", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-robust-programs-18", board: "aqa", topic: "robust-programs", concept: "authentication-2fa",
    ability: 3, marks: 5, format: "text",
    question: "A school is deciding whether to protect student accounts with a password alone, or with a password plus two-factor authentication.\n\nDiscuss the security benefits of adding two-factor authentication, and one drawback of doing so. [5]",
    markScheme: [
      { text: "A password alone can be guessed, stolen (e.g. by phishing) or reused from another account that has been breached", marks: 1, guidance: "" },
      { text: "With two-factor authentication, knowing the password alone is not enough to log in", marks: 1, guidance: "" },
      { text: "An attacker would also need to have the student's second factor (e.g. their phone), which is much harder to obtain", marks: 1, guidance: "" },
      { text: "This significantly reduces the risk of an account being accessed by someone else, even if the password is compromised", marks: 1, guidance: "" },
      { text: "A valid drawback, e.g. it takes slightly longer to log in / a student without access to their second factor (e.g. a lost phone) could be locked out", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- databases (+8, target 18, AQA only)
  {
    id: "aqa-databases-11", board: "aqa", topic: "databases", concept: "normalisation-basic",
    ability: 1, marks: 2, format: "text",
    question: "A single table stores every order a shop has made, repeating the customer's name and address on every row for that customer.\n\n(a) State **one** problem with storing the data this way. [1]\n\n(b) State the name for the process of organising data to reduce this kind of repetition. [1]",
    markScheme: [
      { text: "(a) Any correct problem, e.g. the same data (name/address) is duplicated many times, wasting storage / if the customer's address changes, every row must be updated / an inconsistency could occur if not every row is updated", marks: 1, guidance: "" },
      { text: "(b) Normalisation", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-12", board: "aqa", topic: "databases", concept: "normalisation-basic",
    ability: 2, marks: 4, format: "text",
    question: "A school stores all its data in one table: `StudentID`, `StudentName`, `TutorName`, `TutorEmail`.\n\nEvery student in the same tutor group has the same `TutorName` and `TutorEmail` repeated on their row.\n\nExplain how splitting this into two linked tables (one for students, one for tutor groups) would improve the design, referring to the repetition in the original table. [4]",
    markScheme: [
      { text: "A `Students` table would hold `StudentID`, `StudentName` and a `TutorGroupID` (or similar) linking to the other table", marks: 1, guidance: "" },
      { text: "A separate `TutorGroups` table would hold `TutorGroupID`, `TutorName` and `TutorEmail`, stored only once per tutor group", marks: 1, guidance: "" },
      { text: "This removes the repeated tutor data from every student's row", marks: 1, guidance: "" },
      { text: "If a tutor's email changes, only one row (in `TutorGroups`) needs updating, instead of every student in that group", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-13", board: "aqa", topic: "databases", concept: "sql-order-multiple",
    ability: 2, marks: 3, format: "text",
    question: "A table called `Students` is shown.\n\n| StudentID | Name | Year | Score |\n|---|---|---|---|\n| 1 | Ada | 10 | 72 |\n| 2 | Ben | 10 | 65 |\n| 3 | Cara | 9 | 88 |\n| 4 | Dev | 9 | 54 |\n\nState the order in which the rows are output by this SQL statement. [3]\n\n```\nSELECT Name FROM Students ORDER BY Year, Score DESC\n```",
    markScheme: [
      { text: "Cara, then Dev (both Year 9, in descending order of Score: 88 before 54)", marks: 1, guidance: "" },
      { text: "Ada, then Ben (both Year 10, in descending order of Score: 72 before 65)", marks: 1, guidance: "" },
      { text: "Full correct order: Cara, Dev, Ada, Ben", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-14", board: "aqa", topic: "databases", concept: "sql-order-multiple",
    ability: 3, marks: 5, format: "text",
    question: "Use the `Students` table below to answer this question.\n\n| StudentID | Name | Year | Score |\n|---|---|---|---|\n| 1 | Ada | 10 | 72 |\n| 2 | Ben | 10 | 65 |\n| 3 | Cara | 9 | 88 |\n| 4 | Dev | 9 | 54 |\n\n(a) Write an SQL statement to display the `Name` and `Score` of every student, sorted first by `Year` (ascending), then by `Score` (descending) within each year. [3]\n\n(b) Write an SQL statement to count how many students are in Year 10. [2]",
    markScheme: [
      { text: "(a) Selects `Name` and `Score`, from `Students`", marks: 1, guidance: "" },
      { text: "(a) Correct `ORDER BY Year, Score DESC`", marks: 1, guidance: "" },
      { text: "(a) Both columns of `ORDER BY` in the correct order (Year first, Score second)", marks: 1, guidance: "" },
      { text: "(b) Uses `COUNT(*)` (or equivalent), from `Students`", marks: 1, guidance: "" },
      { text: "(b) Correct `WHERE Year = 10`", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-15", board: "aqa", topic: "databases", concept: "database-vs-flat-file",
    ability: 1, marks: 2, format: "text",
    question: "State **two** advantages of storing data in a database rather than in a single flat text file. [2]",
    markScheme: [
      { text: "Any two of: data can be searched/queried much faster and more flexibly / relationships between tables reduce data duplication / multiple users can access it safely at once / built-in validation rules can be applied to fields", marks: 2, guidance: "1 mark per valid advantage, up to 2." },
    ],
  },
  {
    id: "aqa-databases-16", board: "aqa", topic: "databases", concept: "database-vs-flat-file",
    ability: 2, marks: 3, format: "text",
    question: "A small shop currently keeps all its stock records in a single text file, with one line per item.\n\nExplain **one** problem this approach is likely to cause as the shop's stock list grows large, and how moving to a database with tables would help. [3]",
    markScheme: [
      { text: "A valid problem, e.g. searching for a specific item becomes slow, since the whole file must be read through line by line", marks: 1, guidance: "" },
      { text: "A database can search using an index / a query, without checking every single record", marks: 1, guidance: "" },
      { text: "This makes finding, updating or filtering stock much faster as the amount of data grows", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-17", board: "aqa", topic: "databases", concept: "data-integrity",
    ability: 1, marks: 1, format: "text",
    question: "State what is meant by **data integrity**. [1]",
    markScheme: [
      { text: "The accuracy and consistency of data (that it is correct and has not been changed or corrupted, whether by accident or on purpose)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-18", board: "aqa", topic: "databases", concept: "data-integrity",
    ability: 2, marks: 3, format: "text",
    question: "A `Students` table has a field called `Year`, which should only ever contain a whole number from 7 to 13.\n\nExplain how a **validation rule** on this field helps maintain data integrity, and give an example of data it should reject. [3]",
    markScheme: [
      { text: "A validation rule checks data as it is entered, before it is accepted into the table", marks: 1, guidance: "" },
      { text: "This stops clearly invalid values (outside 7-13, or not a whole number) from being stored in the first place", marks: 1, guidance: "" },
      { text: "An example it should reject, e.g. 20, -1, or \"seven\"", marks: 1, guidance: "" },
    ],
  },
];
