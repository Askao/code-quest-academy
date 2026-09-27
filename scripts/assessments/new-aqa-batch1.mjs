// Batch 1 toward tripling the AQA question bank: 4 new questions per existing
// topic (2 fresh concepts x 2 ability levels each) plus databases, on top of
// what's already there. AQA's own pseudo-code (<-, USERINPUT, OUTPUT,
// FOR ... TO ... ENDFOR, 1-indexed arrays, SUBSTRING(start, length, string)
// 0-indexed), "Write an algorithm...", "Allow" / "Do not allow".
export const questions = [
  // ---------------------------------------------------------------- fundamentals
  {
    id: "aqa-fundamentals-07", board: "aqa", topic: "fundamentals", concept: "identifier-rules",
    ability: 1, marks: 2, format: "text",
    question: "A programmer wants to create a variable to store a student's exam score. State **two** rules that the variable's name (identifier) must follow. [2]",
    markScheme: [
      { text: "Any two of: must not start with a number / must not contain spaces / must not be a reserved word / can only contain letters, numbers and underscores", marks: 2, guidance: "1 mark per correct rule, up to 2. Allow any two distinct valid rules." },
    ],
  },
  {
    id: "aqa-fundamentals-08", board: "aqa", topic: "fundamentals", concept: "identifier-rules",
    ability: 2, marks: 3, format: "text",
    question: "A student names three variables: `2ndScore`, `total score`, `IF`.\n\nExplain why each of these is not a valid identifier. [3]",
    markScheme: [
      { text: "`2ndScore` - identifiers cannot start with a number", marks: 1, guidance: "" },
      { text: "`total score` - identifiers cannot contain a space", marks: 1, guidance: "" },
      { text: "`IF` - it is a reserved word (keyword)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-09", board: "aqa", topic: "fundamentals", concept: "boolean-data-type",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the data type that can only ever hold the value `TRUE` or `FALSE`. [1]\n\n(b) State the data type of the result of the expression `5 > 3`. [1]",
    markScheme: [
      { text: "(a) Boolean", marks: 1, guidance: "" },
      { text: "(b) Boolean", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-fundamentals-10", board: "aqa", topic: "fundamentals", concept: "boolean-data-type",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nage ← USERINPUT\nage ← STRING_TO_INT(age)\ncanVote ← age >= 18\nOUTPUT canVote\n```\n\n(a) State the data type of the variable `canVote`. [1]\n\n(b) The user enters 15. State the output. [1]\n\n(c) The user enters 20. State the output. [1]",
    markScheme: [
      { text: "(a) Boolean", marks: 1, guidance: "" },
      { text: "(b) FALSE", marks: 1, guidance: "" },
      { text: "(c) TRUE", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- sequencing
  {
    id: "aqa-sequencing-07", board: "aqa", topic: "sequencing", concept: "string-concatenation",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nfirstName ← \"Ada\"\nlastName ← \"Lovelace\"\nOUTPUT firstName + \" \" + lastName\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "Ada Lovelace", marks: 2, guidance: "1 mark for both names present, 1 mark for exactly one space between them." },
    ],
  },
  {
    id: "aqa-sequencing-08", board: "aqa", topic: "sequencing", concept: "string-concatenation",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nprice ← 4\nquantity ← 3\nOUTPUT \"Total: \" + price * quantity\n```\n\n(a) State what happens when this algorithm is run. [1]\n\n(b) Explain the cause of this, and rewrite the third line so it correctly outputs `Total: 12`. [2]",
    markScheme: [
      { text: "(a) An error occurs", marks: 1, guidance: "" },
      { text: "(b) `+` cannot join (concatenate) a string and a number directly", marks: 1, guidance: "" },
      { text: "(b) A corrected line that converts the numeric result to a string first, e.g. `OUTPUT \"Total: \" + INT_TO_STRING(price * quantity)`", marks: 1, guidance: "Allow any equivalent correct fix." },
    ],
  },
  {
    id: "aqa-sequencing-09", board: "aqa", topic: "sequencing", concept: "multi-step-calculation",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that asks the user for the length and width of a rectangle (as whole numbers) and outputs its area and its perimeter, each on its own line, in the form `Area: <value>` and `Perimeter: <value>`. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the length and converts it to an integer", marks: 1, guidance: "" },
      { text: "Inputs the width and converts it to an integer", marks: 1, guidance: "" },
      { text: "Calculates and outputs the area correctly (length x width) in the given form", marks: 1, guidance: "" },
      { text: "Calculates and outputs the perimeter correctly (2 x (length + width)) in the given form", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-sequencing-10", board: "aqa", topic: "sequencing", concept: "multi-step-calculation",
    ability: 3, marks: 5, format: "code",
    question: "A shop adds 20% VAT to a price, then applies a £2 flat delivery charge to the result. Write an algorithm that asks for a price (which may include pence) and outputs the final amount to pay, rounded to 2 decimal places, in the form `Total: £<amount>`. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the price as a real number", marks: 1, guidance: "" },
      { text: "Calculates the price with VAT added (multiplies by 1.2, or equivalent)", marks: 1, guidance: "" },
      { text: "Adds the £2 delivery charge to the VAT-inclusive price", marks: 1, guidance: "" },
      { text: "Rounds the final amount to 2 decimal places", marks: 1, guidance: "" },
      { text: "Outputs the result in the given form", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- selection
  {
    id: "aqa-selection-09", board: "aqa", topic: "selection", concept: "logical-operators",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the Boolean operator that is TRUE only when both of its conditions are TRUE. [1]\n\n(b) State the Boolean operator that is TRUE when at least one of its conditions is TRUE. [1]",
    markScheme: [
      { text: "(a) AND", marks: 1, guidance: "" },
      { text: "(b) OR", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-10", board: "aqa", topic: "selection", concept: "logical-operators",
    ability: 2, marks: 4, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nIF age >= 12 OR hasAdult == TRUE THEN\n  OUTPUT \"Entry allowed\"\nELSE\n  OUTPUT \"Entry refused\"\nENDIF\n```\n\nState the output for each of these cases:\n\n(a) `age` is 15, `hasAdult` is FALSE. [1]\n\n(b) `age` is 8, `hasAdult` is TRUE. [1]\n\n(c) `age` is 8, `hasAdult` is FALSE. [1]\n\n(d) `age` is 30, `hasAdult` is TRUE. [1]",
    markScheme: [
      { text: "(a) Entry allowed", marks: 1, guidance: "" },
      { text: "(b) Entry allowed", marks: 1, guidance: "" },
      { text: "(c) Entry refused", marks: 1, guidance: "" },
      { text: "(d) Entry allowed", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-11", board: "aqa", topic: "selection", concept: "if-elif-chain",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nmark ← 55\nIF mark >= 80 THEN\n  OUTPUT \"Distinction\"\nELSE IF mark >= 60 THEN\n  OUTPUT \"Merit\"\nELSE IF mark >= 40 THEN\n  OUTPUT \"Pass\"\nELSE\n  OUTPUT \"Fail\"\nENDIF\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) Explain why changing `mark ← 55` to `mark ← 85` does not output both \"Distinction\" and \"Merit\". [2]",
    markScheme: [
      { text: "(a) Pass", marks: 1, guidance: "" },
      { text: "(b) Once one of the conditions is found to be TRUE (here, `mark >= 80`), its branch runs", marks: 1, guidance: "" },
      { text: "(b) ...and the rest of the `ELSE IF`/`ELSE` chain is skipped entirely, no matter what their conditions are", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-selection-12", board: "aqa", topic: "selection", concept: "if-elif-chain",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for a whole number representing a day of the week (1 for Monday, up to 7 for Sunday) and outputs `Weekday` for days 1-5 and `Weekend` for days 6-7. If the number entered is not between 1 and 7, the algorithm should output `Invalid day` instead. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Inputs the number and converts it to an integer", marks: 1, guidance: "" },
      { text: "Checks for an invalid number (below 1 or above 7) and outputs \"Invalid day\"", marks: 1, guidance: "Allow this check in any position in the chain, provided the logic is still correct overall." },
      { text: "Correctly identifies 1 to 5 as \"Weekday\"", marks: 1, guidance: "" },
      { text: "Correctly identifies 6 to 7 as \"Weekend\"", marks: 1, guidance: "" },
      { text: "Structures the selection so only one message is ever output", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- iteration
  {
    id: "aqa-iteration-09", board: "aqa", topic: "iteration", concept: "count-controlled-loop",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nFOR i ← 1 TO 5\n  OUTPUT i * 2\nENDFOR\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "2, 4, 6, 8, 10 (each on its own line, or comma separated)", marks: 2, guidance: "1 mark for the correct five values, 1 mark for stopping at 10 and not including 12." },
    ],
  },
  {
    id: "aqa-iteration-10", board: "aqa", topic: "iteration", concept: "count-controlled-loop",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that outputs every multiple of 3 from 3 up to and including 30, one per line, using count-controlled iteration. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Uses count-controlled iteration (a FOR loop)", marks: 1, guidance: "" },
      { text: "The loop runs the correct number of times to cover 3 up to 30", marks: 1, guidance: "" },
      { text: "Outputs a multiple of 3 on each iteration", marks: 1, guidance: "" },
      { text: "The first value output is 3 and the last is 30 (no off-by-one error)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-11", board: "aqa", topic: "iteration", concept: "nested-loop-trace",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nFOR i ← 1 TO 2\n  FOR j ← 1 TO 2\n    OUTPUT i, j\n  ENDFOR\nENDFOR\n```\n\nState the complete output of this algorithm, in order. [3]",
    markScheme: [
      { text: "1 1", marks: 1, guidance: "" },
      { text: "1 2, then 2 1", marks: 1, guidance: "Award if both of these lines appear in the correct position." },
      { text: "2 2, with all four lines in this exact order", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-iteration-12", board: "aqa", topic: "iteration", concept: "nested-loop-trace",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that outputs a square made of asterisks (`*`), 5 wide and 5 tall, using nested iteration (not by outputting five identical lines of text directly). [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Uses an outer loop that runs 5 times, one for each row", marks: 1, guidance: "" },
      { text: "Uses an inner loop, nested inside the outer loop, that runs 5 times, one for each column", marks: 1, guidance: "" },
      { text: "Outputs (or builds) an asterisk once per iteration of the inner loop", marks: 1, guidance: "" },
      { text: "Moves to a new line once per iteration of the outer loop, after the inner loop finishes", marks: 1, guidance: "" },
      { text: "The final output is exactly 5 rows of 5 asterisks each", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- lists
  {
    id: "aqa-lists-07", board: "aqa", topic: "lists", concept: "list-append",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nscores ← [4, 7, 2]\nAPPEND(scores, 9)\nOUTPUT scores\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "[4, 7, 2, 9]", marks: 2, guidance: "1 mark for the original three values in order, 1 mark for 9 added at the end." },
    ],
  },
  {
    id: "aqa-lists-08", board: "aqa", topic: "lists", concept: "list-append",
    ability: 2, marks: 3, format: "code",
    question: "Write an algorithm that starts with an empty array, asks the user to enter 5 whole numbers (one at a time), adds each one to the array, then outputs the completed array. [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Creates an empty array before the loop", marks: 1, guidance: "" },
      { text: "Uses a loop that runs exactly 5 times, taking one input per iteration and adding it to the array", marks: 1, guidance: "" },
      { text: "Outputs the array once, after the loop has finished", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-lists-09", board: "aqa", topic: "lists", concept: "list-max-min",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code. Arrays are indexed from 1.\n\n```\ntemperatures ← [14, 21, 9, 30, 17]\nhighest ← temperatures[1]\nFOR i ← 1 TO LEN(temperatures)\n  IF temperatures[i] > highest THEN\n    highest ← temperatures[i]\n  ENDIF\nENDFOR\nOUTPUT highest\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) Explain the purpose of the line `highest ← temperatures[1]`. [2]",
    markScheme: [
      { text: "(a) 30", marks: 1, guidance: "" },
      { text: "(b) It sets an initial (starting) value to compare the other items against", marks: 1, guidance: "" },
      { text: "(b) Without it, `highest` would not exist yet when the `IF` condition first runs, causing an error", marks: 1, guidance: "Allow: it needs a value before it can be compared to / updated." },
    ],
  },
  {
    id: "aqa-lists-10", board: "aqa", topic: "lists", concept: "list-max-min",
    ability: 3, marks: 6, format: "code",
    question: "Write an algorithm that asks the user for 6 whole numbers, storing them in an array, then outputs the smallest number in the array and the position at which it was found. [6]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Creates an empty array and uses a loop to input exactly 6 numbers into it", marks: 1, guidance: "" },
      { text: "Sets an initial value for the smallest number found so far (e.g. the first item)", marks: 1, guidance: "" },
      { text: "Sets an initial value for the position of the smallest number found so far", marks: 1, guidance: "" },
      { text: "Loops through the array by position", marks: 1, guidance: "" },
      { text: "Correctly updates both the smallest value and its position together whenever a smaller number is found", marks: 1, guidance: "" },
      { text: "Outputs both the smallest number and its position after the loop has finished", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- strings
  {
    id: "aqa-strings-07", board: "aqa", topic: "strings", concept: "string-slicing",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code. The first character of a string is at position 0.\n\n```\nword ← \"computer\"\nOUTPUT SUBSTRING(0, 4, word)\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "comp", marks: 2, guidance: "1 mark for starting at the correct letter, 1 mark for exactly 4 letters." },
    ],
  },
  {
    id: "aqa-strings-08", board: "aqa", topic: "strings", concept: "string-slicing",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code. The first character of a string is at position 0.\n\n```\nemail ← \"ada@school.org\"\nposition ← FIND(email, \"@\")\nOUTPUT SUBSTRING(0, position, email)\n```\n\n(a) State what the variable `position` will hold. [1]\n\n(b) State the output of the final line. [1]\n\n(c) State what real-world piece of information this algorithm extracts from an email address. [1]",
    markScheme: [
      { text: "(a) 3", marks: 1, guidance: "" },
      { text: "(b) ada", marks: 1, guidance: "" },
      { text: "(c) The username / the part of the email address before the @ symbol", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-09", board: "aqa", topic: "strings", concept: "string-validation",
    ability: 2, marks: 4, format: "code",
    question: "Write an algorithm that asks for a password and outputs `Valid` if it is at least 8 characters long, or `Too short` if it is not. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Takes the password as input", marks: 1, guidance: "" },
      { text: "Uses `LEN` (or equivalent) to find the length of the password", marks: 1, guidance: "" },
      { text: "Correctly compares the length to 8, including the boundary (8 itself counts as valid)", marks: 1, guidance: "" },
      { text: "Outputs the correct one of the two messages", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-strings-10", board: "aqa", topic: "strings", concept: "string-validation",
    ability: 3, marks: 5, format: "code",
    question: "Write an algorithm that asks for a username and outputs `Valid` if it contains no spaces and is no more than 12 characters long, or `Invalid` otherwise. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Takes the username as input", marks: 1, guidance: "" },
      { text: "Correctly checks whether the username contains a space", marks: 1, guidance: "" },
      { text: "Correctly checks the length against 12, including the boundary (12 itself is valid)", marks: 1, guidance: "" },
      { text: "Combines both checks so that failing either one results in \"Invalid\"", marks: 1, guidance: "" },
      { text: "Outputs the correct one of the two messages", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- functions
  {
    id: "aqa-functions-09", board: "aqa", topic: "functions", concept: "return-value-usage",
    ability: 1, marks: 2, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE double(n)\n  RETURN n * 2\nENDSUBROUTINE\n\nresult ← double(5)\nOUTPUT result\n```\n\nState the output of this algorithm. [2]",
    markScheme: [
      { text: "10", marks: 2, guidance: "1 mark for calling the subroutine with the correct argument, 1 mark for the correct final value." },
    ],
  },
  {
    id: "aqa-functions-10", board: "aqa", topic: "functions", concept: "return-value-usage",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE square(n)\n  RETURN n * n\nENDSUBROUTINE\n\nSUBROUTINE sumOfSquares(a, b)\n  RETURN square(a) + square(b)\nENDSUBROUTINE\n\nOUTPUT sumOfSquares(3, 4)\n```\n\n(a) State the output of this algorithm. [1]\n\n(b) Explain how the subroutine `sumOfSquares` makes use of the subroutine `square`. [2]",
    markScheme: [
      { text: "(a) 25", marks: 1, guidance: "" },
      { text: "(b) `sumOfSquares` calls `square` (twice, once for each parameter)", marks: 1, guidance: "" },
      { text: "(b) It uses the value each call to `square` returns, adding the two results together", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-11", board: "aqa", topic: "functions", concept: "parameter-passing",
    ability: 2, marks: 3, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\nSUBROUTINE greet(name, greeting)\n  RETURN greeting + \", \" + name\nENDSUBROUTINE\n\nOUTPUT greet(\"Ada\", \"Hello\")\nOUTPUT greet(\"Sam\", \"Hi\")\n```\n\nState the output of both lines, in order. [3]",
    markScheme: [
      { text: "Hello, Ada", marks: 1, guidance: "" },
      { text: "Hi, Sam", marks: 1, guidance: "" },
      { text: "Both outputs are on separate lines / in this order", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-functions-12", board: "aqa", topic: "functions", concept: "parameter-passing",
    ability: 3, marks: 5, format: "code",
    question: "Write a subroutine `power(base, exponent)` that returns `base` raised to the power of `exponent`. Then, ask the user for a number and use your subroutine to output that number raised to the power of 2. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Defines a subroutine with the correct name and two parameters", marks: 1, guidance: "" },
      { text: "The subroutine correctly returns `base` to the power of `exponent`", marks: 1, guidance: "e.g. using a loop that multiplies `base` by itself `exponent` times." },
      { text: "The subroutine works correctly when called (returns the right value for at least one test case)", marks: 1, guidance: "" },
      { text: "Inputs a number (converted to a number type) from the user", marks: 1, guidance: "" },
      { text: "Calls the subroutine with that number and 2, and outputs the result", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- files
  {
    id: "aqa-files-07", board: "aqa", topic: "files", concept: "file-append",
    ability: 1, marks: 2, format: "text",
    question: "State the file mode used to add new data to the end of an existing file, keeping what is already there. [1]\n\nState what would happen to the file's existing contents if it were opened for writing (overwrite mode) instead. [1]",
    markScheme: [
      { text: "Append (mode)", marks: 1, guidance: "" },
      { text: "They would be deleted / overwritten (the file would be emptied first)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-08", board: "aqa", topic: "files", concept: "file-append",
    ability: 2, marks: 3, format: "code",
    question: "Write an algorithm that opens a file called \"log.txt\" in append mode, writes the text \"Program run\" followed by a new line, and then closes the file. [3]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Opens \"log.txt\" using append mode", marks: 1, guidance: "" },
      { text: "Writes the text \"Program run\" followed by a newline character", marks: 1, guidance: "" },
      { text: "Closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-09", board: "aqa", topic: "files", concept: "file-line-count",
    ability: 2, marks: 4, format: "code",
    question: "A file called \"names.txt\" contains one name per line. Write an algorithm that opens the file, counts how many lines (names) it contains, outputs the count, and closes the file. [4]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Opens \"names.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop that goes through the file counting lines correctly", marks: 1, guidance: "" },
      { text: "Outputs the final count, after the loop", marks: 1, guidance: "" },
      { text: "Closes the file", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-files-10", board: "aqa", topic: "files", concept: "file-line-count",
    ability: 3, marks: 5, format: "code",
    question: "A file called \"scores.txt\" contains one whole number per line. Write an algorithm that opens the file, calculates the mean (average) of the numbers in it, outputs the mean rounded to 2 decimal places, and closes the file. [5]\n\nYou may use pseudo-code or a high-level programming language.",
    markScheme: [
      { text: "Opens \"scores.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop to read each line, converting it to a number", marks: 1, guidance: "" },
      { text: "Keeps a running total and a count of how many numbers have been read", marks: 1, guidance: "" },
      { text: "Correctly calculates the mean (total divided by count) once the loop has finished", marks: 1, guidance: "" },
      { text: "Outputs the mean rounded to 2 decimal places, and closes the file", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- searching-sorting
  {
    id: "aqa-searching-sorting-07", board: "aqa", topic: "searching-sorting", concept: "linear-search-trace",
    ability: 1, marks: 2, format: "text",
    question: "A linear search is used to look for the value 7 in the array `[4, 9, 7, 2, 5]` (indexed from 1).\n\nState how many comparisons the linear search makes before it finds 7. [1]\n\nState the position at which 7 is found. [1]",
    markScheme: [
      { text: "3", marks: 1, guidance: "" },
      { text: "3", marks: 1, guidance: "Position 3, since arrays are indexed from 1 in this pseudo-code." },
    ],
  },
  {
    id: "aqa-searching-sorting-08", board: "aqa", topic: "searching-sorting", concept: "binary-search-steps",
    ability: 2, marks: 4, format: "text",
    question: "A binary search is used to look for the value 23 in the sorted array `[2, 5, 9, 14, 23, 31, 40]` (indexed from 1, 7 items).\n\n(a) State the position that is checked first. [1]\n\n(b) State the value found at that position. [1]\n\n(c) State whether the search now looks in the left half or the right half of the array. [1]\n\n(d) State how many comparisons in total are needed to find 23. [1]",
    markScheme: [
      { text: "(a) 4 (the middle position)", marks: 1, guidance: "" },
      { text: "(b) 14", marks: 1, guidance: "" },
      { text: "(c) Right half (since 23 is greater than 14)", marks: 1, guidance: "" },
      { text: "(d) 2", marks: 1, guidance: "The middle of the right half, position 6 (value 31), is greater than 23, then position 5 (value 23) is checked next and matches." },
    ],
  },
  {
    id: "aqa-searching-sorting-09", board: "aqa", topic: "searching-sorting", concept: "sort-comparison",
    ability: 2, marks: 3, format: "text",
    question: "State **one** similarity and **one** difference between a bubble sort and an insertion sort. [3]",
    markScheme: [
      { text: "Similarity: any correct point, e.g. both compare items / both can sort into ascending or descending order / both are comparison-based sorts", marks: 1, guidance: "" },
      { text: "Difference: any correct point, e.g. bubble sort repeatedly swaps adjacent items, insertion sort builds up a sorted section by inserting one item at a time", marks: 2, guidance: "1 mark for a valid but vague difference, 2 marks for a difference that correctly describes how each algorithm actually works." },
    ],
  },
  {
    id: "aqa-searching-sorting-10", board: "aqa", topic: "searching-sorting", concept: "sort-comparison",
    ability: 3, marks: 5, format: "text",
    question: "A bubble sort is used to sort the array `[5, 1, 4, 2]` into ascending order.\n\nShow the state of the array after each full pass of the algorithm, until the array is fully sorted. [5]",
    markScheme: [
      { text: "After pass 1: [1, 4, 2, 5]", marks: 1, guidance: "" },
      { text: "After pass 2: [1, 2, 4, 5]", marks: 1, guidance: "" },
      { text: "After pass 3 (array already sorted, no further swaps needed): [1, 2, 4, 5]", marks: 1, guidance: "Allow the answer stopping after pass 2 if the student correctly states no more passes are needed." },
      { text: "Comparisons made adjacent pairs at a time, swapping when the left is bigger than the right", marks: 1, guidance: "" },
      { text: "The largest unsorted value correctly \"bubbles\" to its final position by the end of each pass", marks: 1, guidance: "" },
    ],
  },

  // ---------------------------------------------------------------- robust-programs
  {
    id: "aqa-robust-programs-07", board: "aqa", topic: "robust-programs", concept: "trace-tables",
    ability: 1, marks: 2, format: "text",
    question: "State **two** reasons a programmer would use a trace table when testing an algorithm. [2]",
    markScheme: [
      { text: "Any two of: to check the values of variables at each step / to find where an algorithm's logic goes wrong / to test an algorithm by hand before running it / to understand how a piece of code works", marks: 2, guidance: "1 mark per correct reason, up to 2." },
    ],
  },
  {
    id: "aqa-robust-programs-08", board: "aqa", topic: "robust-programs", concept: "trace-tables",
    ability: 2, marks: 4, format: "text",
    question: "The following algorithm is written in pseudo-code.\n\n```\ntotal ← 0\nFOR i ← 1 TO 3\n  total ← total + i\nENDFOR\nOUTPUT total\n```\n\nComplete a trace table for this algorithm, showing the value of `i` and `total` at the end of each pass through the loop. [4]",
    markScheme: [
      { text: "Pass 1: i = 1, total = 1", marks: 1, guidance: "" },
      { text: "Pass 2: i = 2, total = 3", marks: 1, guidance: "" },
      { text: "Pass 3: i = 3, total = 6", marks: 1, guidance: "" },
      { text: "Correctly identifies the final output as 6", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-robust-programs-09", board: "aqa", topic: "robust-programs", concept: "iterative-testing",
    ability: 2, marks: 3, format: "text",
    question: "Explain what is meant by **iterative testing**, and why it is useful during program development. [3]",
    markScheme: [
      { text: "Testing that happens throughout development, not just once at the end", marks: 1, guidance: "" },
      { text: "Each new piece of code is tested as soon as it is added", marks: 1, guidance: "" },
      { text: "This makes it easier to find and fix an error, since it is likely to be in the code just added", marks: 1, guidance: "Allow: bugs are caught earlier / are cheaper or easier to fix." },
    ],
  },
  {
    id: "aqa-robust-programs-10", board: "aqa", topic: "robust-programs", concept: "iterative-testing",
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

  // ---------------------------------------------------------------- databases (AQA only)
  {
    id: "aqa-databases-07", board: "aqa", topic: "databases", concept: "data-types-db",
    ability: 1, marks: 2, format: "text",
    question: "A `Books` table has a field called `Price`.\n\n(a) State the most appropriate data type for this field. [1]\n\n(b) A field called `InStock` records whether the book is currently available. State the most appropriate data type for this field. [1]",
    markScheme: [
      { text: "(a) Real / decimal / currency", marks: 1, guidance: "" },
      { text: "(b) Boolean", marks: 1, guidance: "" },
    ],
  },
  {
    id: "aqa-databases-08", board: "aqa", topic: "databases", concept: "data-types-db",
    ability: 2, marks: 4, format: "text",
    question: "A table stores the following fields for a `Books` table: `ISBN`, `Title`, `YearPublished`, `Price`.\n\nFor each of `YearPublished` and `Price`, state the most appropriate data type and give a reason for your choice. [3]\n\nSuggest a suitable data type for `ISBN`, giving a reason. [1]",
    markScheme: [
      { text: "`YearPublished`: integer, because it is always a whole number", marks: 1, guidance: "" },
      { text: "`Price`: real, because it needs to store decimal values (pence)", marks: 1, guidance: "" },
      { text: "Both reasons correctly justify the choice, not just name the data type", marks: 1, guidance: "" },
      { text: "`ISBN`: text/string, because it is not used in calculations (and may include leading zeros or hyphens)", marks: 1, guidance: "Allow integer with a valid justification." },
    ],
  },
  {
    id: "aqa-databases-09", board: "aqa", topic: "databases", concept: "sql-and-or",
    ability: 2, marks: 4, format: "text",
    question: "A table called `Books` is shown.\n\n| BookID | Title | Genre | Price |\n|---|---|---|---|\n| 1 | The Hobbit | Fantasy | 8 |\n| 2 | Holes | Fiction | 6 |\n| 3 | Wonder | Fiction | 9 |\n| 4 | The Giver | Fantasy | 4 |\n\n(a) State the data output by this SQL statement. [2]\n\n```\nSELECT Title FROM Books WHERE Genre = 'Fantasy' AND Price < 5\n```\n\n(b) State the data output by this SQL statement. [2]\n\n```\nSELECT Title FROM Books WHERE Genre = 'Fantasy' OR Price < 5\n```",
    markScheme: [
      { text: "(a) The Giver", marks: 1, guidance: "" },
      { text: "(a) ...and no other titles are output", marks: 1, guidance: "" },
      { text: "(b) The Hobbit, The Giver", marks: 1, guidance: "Accept in either order." },
      { text: "(b) ...and Holes is also output, as it is under £5", marks: 1, guidance: "Full marks requires all three titles (The Hobbit, Holes, The Giver) and no others." },
    ],
  },
  {
    id: "aqa-databases-10", board: "aqa", topic: "databases", concept: "sql-and-or",
    ability: 3, marks: 5, format: "text",
    question: "Use the `Books` table below to answer this question.\n\n| BookID | Title | Genre | Price |\n|---|---|---|---|\n| 1 | The Hobbit | Fantasy | 8 |\n| 2 | Holes | Fiction | 6 |\n| 3 | Wonder | Fiction | 9 |\n| 4 | The Giver | Fantasy | 4 |\n\n(a) Write an SQL statement to display the titles of every Fiction book costing more than £7, ordered from most expensive to least expensive. [3]\n\n(b) Write an SQL statement to display every field for books that are either Fantasy or cost £5 or less. [2]",
    markScheme: [
      { text: "(a) Selects `Title`, from `Books`", marks: 1, guidance: "" },
      { text: "(a) Correct `WHERE` clause combining `Genre = 'Fiction'` AND `Price > 7`", marks: 1, guidance: "" },
      { text: "(a) Correct `ORDER BY Price DESC`", marks: 1, guidance: "" },
      { text: "(b) Selects all fields (`*`), from `Books`", marks: 1, guidance: "" },
      { text: "(b) Correct `WHERE` clause combining `Genre = 'Fantasy'` OR `Price <= 5`", marks: 1, guidance: "" },
    ],
  },
];
