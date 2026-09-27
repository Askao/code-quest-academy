// Batch 1 toward tripling the OCR question bank: 4 new questions per existing
// topic (2 fresh concepts x 2 ability levels each), on top of what's already
// there. Written in OCR's own style (OCR Exam Reference Language / Python-like
// pseudocode, "Award 1 mark for...", "Accept" / "Do not accept").
export const questions = [
  // ---------------------------------------------------------------- fundamentals
  {
    id: "ocr-fundamentals-07", board: "ocr", topic: "fundamentals", concept: "identifier-rules",
    ability: 1, marks: 2, format: "text",
    question: "A programmer wants to create a variable to store a student's exam score. State **two** rules that the variable's name (identifier) must follow. [2]",
    markScheme: [
      { text: "Any two of: must not start with a number / must not contain spaces / must not be a reserved word (keyword) / can only contain letters, numbers and underscores", marks: 2, guidance: "1 mark per correct rule, up to 2. Accept any two distinct valid rules." },
    ],
  },
  {
    id: "ocr-fundamentals-08", board: "ocr", topic: "fundamentals", concept: "identifier-rules",
    ability: 2, marks: 3, format: "text",
    question: "A student names three variables: `2ndScore`, `total score`, `for`.\n\nExplain why each of these is not a valid identifier. [3]",
    markScheme: [
      { text: "`2ndScore` - identifiers cannot start with a number", marks: 1, guidance: "" },
      { text: "`total score` - identifiers cannot contain a space", marks: 1, guidance: "" },
      { text: "`for` - it is a reserved word (keyword)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-fundamentals-09", board: "ocr", topic: "fundamentals", concept: "boolean-data-type",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the data type that can only ever hold the value `True` or `False`. [1]\n\n(b) State the data type of the result of the expression `5 > 3`. [1]",
    markScheme: [
      { text: "(a) Boolean", marks: 1, guidance: "" },
      { text: "(b) Boolean", marks: 1, guidance: "Accept: bool." },
    ],
  },
  {
    id: "ocr-fundamentals-10", board: "ocr", topic: "fundamentals", concept: "boolean-data-type",
    ability: 2, marks: 3, format: "text",
    question: "```\nage = int(input(\"Enter your age\"))\ncanVote = age >= 18\nprint(canVote)\n```\n\n(a) State the data type of the variable `canVote`. [1]\n\n(b) The user enters 15. State the output of the program. [1]\n\n(c) The user enters 20. State the output of the program. [1]",
    markScheme: [
      { text: "(a) Boolean", marks: 1, guidance: "" },
      { text: "(b) False", marks: 1, guidance: "" },
      { text: "(c) True", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- sequencing
  {
    id: "ocr-sequencing-07", board: "ocr", topic: "sequencing", concept: "string-concatenation",
    ability: 1, marks: 2, format: "text",
    question: "```\nfirstName = \"Ada\"\nlastName = \"Lovelace\"\nprint(firstName + \" \" + lastName)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "Ada Lovelace", marks: 2, guidance: "1 mark for both names present, 1 mark for exactly one space between them. Accept minor case differences." },
    ],
  },
  {
    id: "ocr-sequencing-08", board: "ocr", topic: "sequencing", concept: "string-concatenation",
    ability: 2, marks: 3, format: "text",
    question: "```\nprice = 4\nquantity = 3\nprint(\"Total: \" + price * quantity)\n```\n\n(a) State what happens when this program is run. [1]\n\n(b) Explain the cause of this, and rewrite the third line so it correctly prints `Total: 12`. [2]",
    markScheme: [
      { text: "(a) An error occurs / the program crashes", marks: 1, guidance: "Accept: a TypeError is raised." },
      { text: "(b) `+` cannot join (concatenate) a string and an integer directly", marks: 1, guidance: "" },
      { text: "(b) A corrected line that casts the numeric result to a string, e.g. `print(\"Total: \" + str(price * quantity))`", marks: 1, guidance: "Accept any equivalent correct fix, including building the string from separate print arguments." },
    ],
  },
  {
    id: "ocr-sequencing-09", board: "ocr", topic: "sequencing", concept: "multi-step-calculation",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that inputs the length and width of a rectangle (as whole numbers) and outputs its area and its perimeter, each on its own line, in the form `Area: <value>` and `Perimeter: <value>`. [4]",
    markScheme: [
      { text: "Inputs the length and casts it to an integer", marks: 1, guidance: "" },
      { text: "Inputs the width and casts it to an integer", marks: 1, guidance: "" },
      { text: "Calculates and outputs the area correctly (length x width) in the given form", marks: 1, guidance: "" },
      { text: "Calculates and outputs the perimeter correctly (2 x (length + width)) in the given form", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-sequencing-10", board: "ocr", topic: "sequencing", concept: "multi-step-calculation",
    ability: 3, marks: 5, format: "code",
    question: "A shop adds 20% VAT to a price, then applies a £2 flat delivery charge to the result. Write a program that inputs a price (which may include pence) and outputs the final amount to pay, rounded to 2 decimal places, in the form `Total: £<amount>`. [5]",
    markScheme: [
      { text: "Inputs the price and casts it to a real/float", marks: 1, guidance: "" },
      { text: "Calculates the price with VAT added (multiplies by 1.2, or equivalent)", marks: 1, guidance: "" },
      { text: "Adds the £2 delivery charge to the VAT-inclusive price", marks: 1, guidance: "" },
      { text: "Rounds the final amount to 2 decimal places", marks: 1, guidance: "" },
      { text: "Outputs the result in the given form", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- selection
  {
    id: "ocr-selection-09", board: "ocr", topic: "selection", concept: "logical-operators",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the Boolean operator that is True only when both of its conditions are True. [1]\n\n(b) State the Boolean operator that is True when at least one of its conditions is True. [1]",
    markScheme: [
      { text: "(a) AND", marks: 1, guidance: "" },
      { text: "(b) OR", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-10", board: "ocr", topic: "selection", concept: "logical-operators",
    ability: 2, marks: 4, format: "text",
    question: "A cinema allows entry to a 12A film if a customer is 12 or over, OR if they are under 12 but accompanied by an adult (`hasAdult` is True).\n\n```\nif age >= 12 or hasAdult == True:\n    print(\"Entry allowed\")\nelse:\n    print(\"Entry refused\")\n```\n\nState the output for each of these cases:\n\n(a) `age` is 15, `hasAdult` is False. [1]\n\n(b) `age` is 8, `hasAdult` is True. [1]\n\n(c) `age` is 8, `hasAdult` is False. [1]\n\n(d) `age` is 30, `hasAdult` is True. [1]",
    markScheme: [
      { text: "(a) Entry allowed", marks: 1, guidance: "" },
      { text: "(b) Entry allowed", marks: 1, guidance: "" },
      { text: "(c) Entry refused", marks: 1, guidance: "" },
      { text: "(d) Entry allowed", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-11", board: "ocr", topic: "selection", concept: "if-elif-chain",
    ability: 2, marks: 3, format: "text",
    question: "```\nmark = 55\nif mark >= 80:\n    print(\"Distinction\")\nelif mark >= 60:\n    print(\"Merit\")\nelif mark >= 40:\n    print(\"Pass\")\nelse:\n    print(\"Fail\")\n```\n\n(a) State the output of this program. [1]\n\n(b) Explain why changing `mark = 55` to `mark = 85` does not print both \"Distinction\" and \"Merit\". [2]",
    markScheme: [
      { text: "(a) Pass", marks: 1, guidance: "" },
      { text: "(b) Once one of the conditions is found to be True (here, `mark >= 80`), its branch runs", marks: 1, guidance: "" },
      { text: "(b) ...and the rest of the `elif`/`else` chain is skipped entirely, no matter what their conditions are", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-12", board: "ocr", topic: "selection", concept: "if-elif-chain",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs a whole number representing a day of the week (1 for Monday, up to 7 for Sunday) and outputs `Weekday` for days 1-5 and `Weekend` for days 6-7. If the number entered is not between 1 and 7, the program should output `Invalid day` instead. [5]",
    markScheme: [
      { text: "Inputs the number and casts it to an integer", marks: 1, guidance: "" },
      { text: "Checks for an invalid number (below 1 or above 7) and outputs \"Invalid day\"", marks: 1, guidance: "Accept this check in any position in the chain, provided the logic is still correct overall." },
      { text: "Correctly identifies 1 to 5 as \"Weekday\"", marks: 1, guidance: "" },
      { text: "Correctly identifies 6 to 7 as \"Weekend\"", marks: 1, guidance: "" },
      { text: "Uses `elif` (or equivalent nested `if`/`else`) so only one message is ever printed", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- iteration
  {
    id: "ocr-iteration-09", board: "ocr", topic: "iteration", concept: "count-controlled-loop",
    ability: 1, marks: 2, format: "text",
    question: "```\nfor i in range(1, 6):\n    print(i * 2)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "2, 4, 6, 8, 10 (each on its own line, or comma separated)", marks: 2, guidance: "1 mark for the correct five values, 1 mark for stopping at 10 and not including 12." },
    ],
  },
  {
    id: "ocr-iteration-10", board: "ocr", topic: "iteration", concept: "count-controlled-loop",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that outputs every multiple of 3 from 3 up to and including 30, one per line, using a count-controlled loop. [4]",
    markScheme: [
      { text: "Uses a count-controlled (`for`) loop", marks: 1, guidance: "" },
      { text: "The loop runs the correct number of times to cover 3 up to 30", marks: 1, guidance: "Accept counting 1 to 10 and multiplying, or counting 3 to 30 in steps of 3." },
      { text: "Outputs a multiple of 3 on each iteration", marks: 1, guidance: "" },
      { text: "The first value output is 3 and the last is 30 (no off-by-one error)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-11", board: "ocr", topic: "iteration", concept: "nested-loop-trace",
    ability: 2, marks: 3, format: "text",
    question: "```\nfor i in range(1, 3):\n    for j in range(1, 3):\n        print(i, j)\n```\n\nState the complete output of this program, in order. [3]",
    markScheme: [
      { text: "1 1", marks: 1, guidance: "" },
      { text: "1 2, then 2 1", marks: 1, guidance: "Award if both of these lines appear in the correct position." },
      { text: "2 2, with all four lines in this exact order", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-12", board: "ocr", topic: "iteration", concept: "nested-loop-trace",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that prints a square made of asterisks (`*`), 5 wide and 5 tall, using nested loops (not by printing five identical lines of text directly). [5]",
    markScheme: [
      { text: "Uses an outer loop that runs 5 times, one for each row", marks: 1, guidance: "" },
      { text: "Uses an inner loop, nested inside the outer loop, that runs 5 times, one for each column", marks: 1, guidance: "" },
      { text: "Prints (or builds) an asterisk once per iteration of the inner loop", marks: 1, guidance: "" },
      { text: "Moves to a new line once per iteration of the outer loop, after the inner loop finishes", marks: 1, guidance: "" },
      { text: "The final output is exactly 5 rows of 5 asterisks each", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- lists
  {
    id: "ocr-lists-07", board: "ocr", topic: "lists", concept: "list-append",
    ability: 1, marks: 2, format: "text",
    question: "```\nscores = [4, 7, 2]\nscores.append(9)\nprint(scores)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "[4, 7, 2, 9]", marks: 2, guidance: "1 mark for the original three values in order, 1 mark for 9 added at the end." },
    ],
  },
  {
    id: "ocr-lists-08", board: "ocr", topic: "lists", concept: "list-append",
    ability: 2, marks: 3, format: "code",
    question: "Write a program that starts with an empty list, asks the user to enter 5 whole numbers (one at a time), adds each one to the list, then outputs the completed list. [3]",
    markScheme: [
      { text: "Creates an empty list before the loop", marks: 1, guidance: "" },
      { text: "Uses a loop that runs exactly 5 times, taking one input per iteration and adding it (e.g. with `.append()`) to the list", marks: 1, guidance: "" },
      { text: "Outputs the list once, after the loop has finished", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-lists-09", board: "ocr", topic: "lists", concept: "list-max-min",
    ability: 2, marks: 3, format: "text",
    question: "```\ntemperatures = [14, 21, 9, 30, 17]\nhighest = temperatures[0]\nfor t in temperatures:\n    if t > highest:\n        highest = t\nprint(highest)\n```\n\n(a) State the output of this program. [1]\n\n(b) Explain the purpose of the line `highest = temperatures[0]`. [2]",
    markScheme: [
      { text: "(a) 30", marks: 1, guidance: "" },
      { text: "(b) It sets an initial (starting) value to compare the other items against", marks: 1, guidance: "" },
      { text: "(b) Without it, `highest` would not exist yet when the `if` condition first runs, causing an error", marks: 1, guidance: "Accept: it needs a value before it can be compared to / updated." },
    ],
  },
  {
    id: "ocr-lists-10", board: "ocr", topic: "lists", concept: "list-max-min",
    ability: 3, marks: 6, format: "code",
    question: "Write a program that inputs 6 whole numbers into a list, then outputs the smallest number in the list and the position (index, counting from 0) at which it was found. [6]",
    markScheme: [
      { text: "Creates an empty list and uses a loop to input exactly 6 numbers into it", marks: 1, guidance: "" },
      { text: "Sets an initial value for the smallest number found so far (e.g. the first item)", marks: 1, guidance: "" },
      { text: "Sets an initial value for the position of the smallest number found so far", marks: 1, guidance: "" },
      { text: "Loops through the list by index (e.g. `for i in range(len(list)):`)", marks: 1, guidance: "" },
      { text: "Correctly updates both the smallest value and its position together whenever a smaller number is found", marks: 1, guidance: "" },
      { text: "Outputs both the smallest number and its position after the loop has finished", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- strings
  {
    id: "ocr-strings-07", board: "ocr", topic: "strings", concept: "string-slicing",
    ability: 1, marks: 2, format: "text",
    question: "```\nword = \"computer\"\nprint(word[0:4])\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "comp", marks: 2, guidance: "1 mark for starting at the correct letter, 1 mark for stopping after exactly 4 letters (not including the character at index 4)." },
    ],
  },
  {
    id: "ocr-strings-08", board: "ocr", topic: "strings", concept: "string-slicing",
    ability: 2, marks: 3, format: "text",
    question: "```\nemail = \"ada@school.org\"\nposition = email.find(\"@\")\nprint(email[0:position])\n```\n\n(a) State what the variable `position` will hold. [1]\n\n(b) State the output of the final line. [1]\n\n(c) State what real-world piece of information this program extracts from an email address. [1]",
    markScheme: [
      { text: "(a) 3", marks: 1, guidance: "" },
      { text: "(b) ada", marks: 1, guidance: "" },
      { text: "(c) The username / the part of the email address before the @ symbol", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-strings-09", board: "ocr", topic: "strings", concept: "string-validation",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that inputs a password and outputs `Valid` if it is at least 8 characters long, or `Too short` if it is not. [4]",
    markScheme: [
      { text: "Takes the password as input", marks: 1, guidance: "" },
      { text: "Uses `len()` (or equivalent) to find the length of the password", marks: 1, guidance: "" },
      { text: "Correctly compares the length to 8, including the boundary (8 itself counts as valid)", marks: 1, guidance: "" },
      { text: "Outputs the correct one of the two messages", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-strings-10", board: "ocr", topic: "strings", concept: "string-validation",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs a username and outputs `Valid` if it contains no spaces and is no more than 12 characters long, or `Invalid` otherwise. [5]",
    markScheme: [
      { text: "Takes the username as input", marks: 1, guidance: "" },
      { text: "Correctly checks whether the username contains a space", marks: 1, guidance: "e.g. using `in` or a loop checking each character." },
      { text: "Correctly checks the length against 12, including the boundary (12 itself is valid)", marks: 1, guidance: "" },
      { text: "Combines both checks so that failing either one results in \"Invalid\"", marks: 1, guidance: "" },
      { text: "Outputs the correct one of the two messages", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- functions
  {
    id: "ocr-functions-09", board: "ocr", topic: "functions", concept: "return-value-usage",
    ability: 1, marks: 2, format: "text",
    question: "```\ndef double(n):\n    return n * 2\n\nresult = double(5)\nprint(result)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "10", marks: 2, guidance: "1 mark for calling the function with the correct argument, 1 mark for the correct final value." },
    ],
  },
  {
    id: "ocr-functions-10", board: "ocr", topic: "functions", concept: "return-value-usage",
    ability: 2, marks: 3, format: "text",
    question: "```\ndef square(n):\n    return n * n\n\ndef sumOfSquares(a, b):\n    return square(a) + square(b)\n\nprint(sumOfSquares(3, 4))\n```\n\n(a) State the output of this program. [1]\n\n(b) Explain how the function `sumOfSquares` makes use of the function `square`. [2]",
    markScheme: [
      { text: "(a) 25", marks: 1, guidance: "" },
      { text: "(b) `sumOfSquares` calls `square` (twice, once for each parameter)", marks: 1, guidance: "" },
      { text: "(b) It uses the value each call to `square` returns, adding the two results together", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-11", board: "ocr", topic: "functions", concept: "default-parameters",
    ability: 2, marks: 3, format: "text",
    question: "```\ndef greet(name, greeting=\"Hello\"):\n    return greeting + \", \" + name\n\nprint(greet(\"Ada\"))\nprint(greet(\"Sam\", \"Hi\"))\n```\n\nState the output of both lines, in order. [3]",
    markScheme: [
      { text: "Hello, Ada", marks: 1, guidance: "" },
      { text: "Hi, Sam", marks: 1, guidance: "" },
      { text: "Both outputs are on separate lines / in this order", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-12", board: "ocr", topic: "functions", concept: "default-parameters",
    ability: 3, marks: 5, format: "code",
    question: "Write a function `power(base, exponent)` that returns `base` raised to the power of `exponent`, where `exponent` defaults to 2 if it is not given. Then, input a number and use your function (without giving an exponent) to output its square. [5]",
    markScheme: [
      { text: "Defines a function with the correct name and a parameter for `base`", marks: 1, guidance: "" },
      { text: "The `exponent` parameter has a default value of 2", marks: 1, guidance: "" },
      { text: "The function correctly returns `base` to the power of `exponent`", marks: 1, guidance: "e.g. using `**` or repeated multiplication." },
      { text: "Inputs a number (cast to a number type) from the user", marks: 1, guidance: "" },
      { text: "Calls the function with just that number and outputs the result", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- files
  {
    id: "ocr-files-07", board: "ocr", topic: "files", concept: "file-append",
    ability: 1, marks: 2, format: "text",
    question: "State the file mode used to add new data to the end of an existing file, keeping what is already there. [1]\n\nState what would happen to the file's existing contents if it were opened in \"w\" (write) mode instead. [1]",
    markScheme: [
      { text: "\"a\" (append)", marks: 1, guidance: "" },
      { text: "They would be deleted / overwritten (the file would be emptied first)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-files-08", board: "ocr", topic: "files", concept: "file-append",
    ability: 2, marks: 3, format: "code",
    question: "Write a program that opens a file called \"log.txt\" in append mode, writes the text \"Program run\" followed by a new line, and then closes the file. [3]",
    markScheme: [
      { text: "Opens \"log.txt\" using append mode", marks: 1, guidance: "" },
      { text: "Writes the text \"Program run\" followed by a newline character", marks: 1, guidance: "" },
      { text: "Closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-files-09", board: "ocr", topic: "files", concept: "file-line-count",
    ability: 2, marks: 4, format: "code",
    question: "A file called \"names.txt\" contains one name per line. Write a program that opens the file, counts how many lines (names) it contains, outputs the count, and closes the file. [4]",
    markScheme: [
      { text: "Opens \"names.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop that goes through the file counting lines correctly", marks: 1, guidance: "e.g. `for line in file:` with a counter." },
      { text: "Outputs the final count, after the loop", marks: 1, guidance: "" },
      { text: "Closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-files-10", board: "ocr", topic: "files", concept: "file-line-count",
    ability: 3, marks: 5, format: "code",
    question: "A file called \"scores.txt\" contains one whole number per line. Write a program that opens the file, calculates the mean (average) of the numbers in it, outputs the mean rounded to 2 decimal places, and closes the file. [5]",
    markScheme: [
      { text: "Opens \"scores.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop to read each line, casting it to a number", marks: 1, guidance: "" },
      { text: "Keeps a running total and a count of how many numbers have been read", marks: 1, guidance: "" },
      { text: "Correctly calculates the mean (total divided by count) once the loop has finished", marks: 1, guidance: "" },
      { text: "Outputs the mean rounded to 2 decimal places, and closes the file", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- searching-sorting
  {
    id: "ocr-searching-sorting-07", board: "ocr", topic: "searching-sorting", concept: "linear-search-trace",
    ability: 1, marks: 2, format: "text",
    question: "A linear search is used to look for the value 7 in the list `[4, 9, 7, 2, 5]`.\n\nState how many comparisons the linear search makes before it finds 7. [1]\n\nState the position (index, counting from 0) at which 7 is found. [1]",
    markScheme: [
      { text: "3", marks: 1, guidance: "" },
      { text: "2", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-searching-sorting-08", board: "ocr", topic: "searching-sorting", concept: "linear-search-trace",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that uses a linear search to look for a number, entered by the user, in the list `[12, 45, 3, 67, 21, 9]`. It should output the position (index) where the number was found, or `-1` if it is not in the list. [4]",
    markScheme: [
      { text: "Inputs the number to search for and casts it to an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that checks each item of the list in turn, by index", marks: 1, guidance: "" },
      { text: "Outputs the correct index as soon as a match is found", marks: 1, guidance: "" },
      { text: "Outputs -1 if the loop finishes without finding the number", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-searching-sorting-09", board: "ocr", topic: "searching-sorting", concept: "sort-comparison",
    ability: 2, marks: 3, format: "text",
    question: "State **one** similarity and **one** difference between a bubble sort and an insertion sort. [3]",
    markScheme: [
      { text: "Similarity: any correct point, e.g. both compare pairs of items / both can sort a list into ascending or descending order / both are comparison-based sorts", marks: 1, guidance: "" },
      { text: "Difference: any correct point, e.g. bubble sort repeatedly swaps adjacent items, insertion sort builds up a sorted section by inserting one item at a time", marks: 2, guidance: "1 mark for a valid but vague difference, 2 marks for a difference that correctly describes how each algorithm actually works." },
    ],
  },
  {
    id: "ocr-searching-sorting-10", board: "ocr", topic: "searching-sorting", concept: "sort-comparison",
    ability: 3, marks: 5, format: "text",
    question: "A bubble sort is used to sort the list `[5, 1, 4, 2]` into ascending order.\n\nShow the state of the list after each full pass of the algorithm, until the list is fully sorted. [5]",
    markScheme: [
      { text: "After pass 1: [1, 4, 2, 5]", marks: 1, guidance: "" },
      { text: "After pass 2: [1, 2, 4, 5]", marks: 1, guidance: "" },
      { text: "After pass 3 (list already sorted, no further swaps needed): [1, 2, 4, 5]", marks: 1, guidance: "Accept the answer stopping after pass 2 if the student correctly states no more passes are needed." },
      { text: "Comparisons made adjacent pairs at a time, swapping when the left is bigger than the right", marks: 1, guidance: "" },
      { text: "The largest unsorted value correctly \"bubbles\" to its final position by the end of each pass", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- robust-programs
  {
    id: "ocr-robust-programs-07", board: "ocr", topic: "robust-programs", concept: "trace-tables",
    ability: 1, marks: 2, format: "text",
    question: "State **two** reasons a programmer would use a trace table when testing a program. [2]",
    markScheme: [
      { text: "Any two of: to check the values of variables at each step / to find where a program's logic goes wrong / to test an algorithm by hand before running it / to understand how a piece of code works", marks: 2, guidance: "1 mark per correct reason, up to 2." },
    ],
  },
  {
    id: "ocr-robust-programs-08", board: "ocr", topic: "robust-programs", concept: "trace-tables",
    ability: 2, marks: 4, format: "text",
    question: "```\ntotal = 0\nfor i in range(1, 4):\n    total = total + i\nprint(total)\n```\n\nComplete a trace table for this program, showing the value of `i` and `total` at the end of each pass through the loop. [4]",
    markScheme: [
      { text: "Pass 1: i = 1, total = 1", marks: 1, guidance: "" },
      { text: "Pass 2: i = 2, total = 3", marks: 1, guidance: "" },
      { text: "Pass 3: i = 3, total = 6", marks: 1, guidance: "" },
      { text: "Correctly identifies the final output as 6", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-robust-programs-09", board: "ocr", topic: "robust-programs", concept: "iterative-testing",
    ability: 2, marks: 3, format: "text",
    question: "Explain what is meant by **iterative testing**, and why it is useful during program development. [3]",
    markScheme: [
      { text: "Testing that happens throughout development, not just once at the end", marks: 1, guidance: "" },
      { text: "Each new piece of code is tested as soon as it is added", marks: 1, guidance: "" },
      { text: "This makes it easier to find and fix an error, since it is likely to be in the code just added", marks: 1, guidance: "Accept: bugs are caught earlier / are cheaper or easier to fix." },
    ],
  },
  {
    id: "ocr-robust-programs-10", board: "ocr", topic: "robust-programs", concept: "iterative-testing",
    ability: 3, marks: 5, format: "text",
    question: "A programmer writes a whole 200-line program before running or testing any of it for the first time.\n\nDiscuss why this approach makes finding and fixing errors more difficult than testing iteratively, and suggest a better approach. [5]",
    markScheme: [
      { text: "If an error occurs, it could be caused by any part of the 200 lines, not just recently written code", marks: 1, guidance: "" },
      { text: "This makes errors much harder and slower to locate", marks: 1, guidance: "" },
      { text: "Multiple errors may be present at once, and can interact with or mask each other", marks: 1, guidance: "" },
      { text: "A better approach: write and test in small sections/increments", marks: 1, guidance: "" },
      { text: "...testing each section works correctly before moving on to the next, so any new error is very likely to be in the code just added", marks: 1, guidance: "" },
    ],
  },
];
