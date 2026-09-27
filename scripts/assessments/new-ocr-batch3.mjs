// Batch 3: closes the gap to a full triple for every OCR topic (18 for the
// original 6-question topics, 24 for selection/iteration/functions).
export const questions = [
  // files: +4 (need 18)
  {
    id: "ocr-files-15", board: "ocr", topic: "files", concept: "file-delimited-fields",
    ability: 1, marks: 2, format: "text",
    question: "A line in a file reads: `Ada,10,Turing`\n\n(a) State the character used to separate each piece of data on this line. [1]\n\n(b) State the Python string method that could split this line into a list of three separate pieces of data. [1]",
    markScheme: [
      { text: "(a) Comma", marks: 1, guidance: "" },
      { text: "(b) `.split()`", marks: 1, guidance: "Accept: split(\",\")." },
    ],
  },
  {
    id: "ocr-files-16", board: "ocr", topic: "files", concept: "file-delimited-fields",
    ability: 2, marks: 4, format: "code",
    question: "A file called \"students.txt\" has one student per line, in the form `name,year`, for example `Ada,10`. Write a program that opens the file, and for each line, outputs just the name. [4]",
    markScheme: [
      { text: "Opens \"students.txt\" for reading", marks: 1, guidance: "" },
      { text: "Uses a loop to read each line", marks: 1, guidance: "" },
      { text: "Splits each line at the comma into its two parts", marks: 1, guidance: "" },
      { text: "Outputs just the name part (with any trailing newline stripped) for every line", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-files-17", board: "ocr", topic: "files", concept: "file-overwrite-protection",
    ability: 2, marks: 3, format: "text",
    question: "A program is about to open a file called \"data.txt\" using mode \"w\" (write) to save some new data.\n\nExplain the risk of doing this without checking anything first, and suggest one way the program could reduce this risk. [3]",
    markScheme: [
      { text: "Opening a file in \"w\" mode immediately erases its existing contents, even if it hasn't been read yet", marks: 1, guidance: "" },
      { text: "If \"data.txt\" already contained important data, that data would be permanently lost", marks: 1, guidance: "" },
      { text: "A way to reduce the risk: check if the file already exists first (e.g. with `os.path.exists()`) and warn the user, or read and back up its contents before overwriting", marks: 1, guidance: "Accept any reasonable safeguard." },
    ],
  },
  {
    id: "ocr-files-18", board: "ocr", topic: "files", concept: "file-overwrite-protection",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that checks whether a file called \"save.txt\" already exists (using `os.path.exists(\"save.txt\")`). If it does, the program should ask the user \"File exists. Overwrite? (yes/no)\" and only save new data (the text \"Save data\") to the file if the answer is \"yes\". If the file does not already exist, the program should save the data straight away. [5]",
    markScheme: [
      { text: "Checks whether the file exists using the given function", marks: 1, guidance: "" },
      { text: "If it exists, asks the user the given question", marks: 1, guidance: "" },
      { text: "Only writes to the file (in this case) if the answer is \"yes\"", marks: 1, guidance: "" },
      { text: "Writes to the file straight away if it did not already exist", marks: 1, guidance: "" },
      { text: "The data actually written is the text \"Save data\"", marks: 1, guidance: "" },
    ],
  },

  // functions: +6 (need 24)
  {
    id: "ocr-functions-19", board: "ocr", topic: "functions", concept: "recursive-function-basic",
    ability: 2, marks: 3, format: "text",
    question: "```\ndef countdown(n):\n    if n == 0:\n        print(\"Go!\")\n    else:\n        print(n)\n        countdown(n - 1)\n\ncountdown(3)\n```\n\nState the complete output of this program, in order. [3]",
    markScheme: [
      { text: "3, 2, 1 (in that order, each on its own line)", marks: 2, guidance: "1 mark for the correct three numbers, 1 mark for the correct descending order." },
      { text: "Go!", marks: 1, guidance: "As the final line of output." },
    ],
  },
  {
    id: "ocr-functions-20", board: "ocr", topic: "functions", concept: "recursive-function-basic",
    ability: 3, marks: 5, format: "text",
    question: "```\ndef countdown(n):\n    if n == 0:\n        print(\"Go!\")\n    else:\n        print(n)\n        countdown(n - 1)\n```\n\n(a) State the name given to a function, like `countdown`, that calls itself. [1]\n\n(b) State the name given to the condition (here, `n == 0`) that stops the calls from continuing forever. [1]\n\n(c) Explain what would happen if this condition were removed from the function. [3]",
    markScheme: [
      { text: "(a) Recursive / recursion", marks: 1, guidance: "" },
      { text: "(b) Base case", marks: 1, guidance: "" },
      { text: "(c) The function would keep calling itself, with `n` decreasing by 1 each time, and never stop on its own", marks: 1, guidance: "" },
      { text: "(c) `n` would carry on past 0 into negative numbers indefinitely", marks: 1, guidance: "" },
      { text: "(c) Eventually the program would crash (a stack overflow / maximum recursion depth error), since each call uses more memory", marks: 1, guidance: "Accept: the program would run out of memory / crash eventually." },
    ],
  },
  {
    id: "ocr-functions-21", board: "ocr", topic: "functions", concept: "function-calling-function",
    ability: 1, marks: 2, format: "text",
    question: "```\ndef isEven(n):\n    return n % 2 == 0\n\nprint(isEven(4))\nprint(isEven(7))\n```\n\nState the output of both lines, in order. [2]",
    markScheme: [
      { text: "True", marks: 1, guidance: "" },
      { text: "False", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-22", board: "ocr", topic: "functions", concept: "function-calling-function",
    ability: 2, marks: 4, format: "code",
    question: "Write a function `isEven(n)` that returns True if `n` is even and False otherwise. Then write a second function `countEvens(numbers)` that takes a list of numbers and returns how many of them are even, using your `isEven` function to check each one. [4]",
    markScheme: [
      { text: "`isEven` correctly returns True for even numbers and False for odd numbers", marks: 1, guidance: "" },
      { text: "`countEvens` loops through every item in the `numbers` list", marks: 1, guidance: "" },
      { text: "`countEvens` calls `isEven` for each item to decide whether to count it", marks: 1, guidance: "" },
      { text: "`countEvens` correctly returns the final count", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-23", board: "ocr", topic: "functions", concept: "function-validation",
    ability: 2, marks: 3, format: "code",
    question: "Write a function `isValidAge(age)` that returns True if `age` is between 0 and 120 (inclusive), and False otherwise. [3]",
    markScheme: [
      { text: "Defines a function with the correct name and one parameter", marks: 1, guidance: "" },
      { text: "Correctly checks both boundaries (0 and 120 count as valid)", marks: 1, guidance: "" },
      { text: "Returns True or False correctly based on the check", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-functions-24", board: "ocr", topic: "functions", concept: "function-validation",
    ability: 3, marks: 5, format: "code",
    question: "Write a function `isValidAge(age)` that returns True if `age` is between 0 and 120 (inclusive), and False otherwise. Then write a program that keeps asking the user to enter an age, using your function to check it, until a valid age is entered, then outputs `Thank you`. [5]",
    markScheme: [
      { text: "`isValidAge` correctly checks both boundaries (0 and 120 count as valid) and returns True or False", marks: 1, guidance: "" },
      { text: "Inputs an age and casts it to an integer", marks: 1, guidance: "" },
      { text: "Uses a condition-controlled loop, calling `isValidAge` to decide whether to keep looping", marks: 1, guidance: "" },
      { text: "Asks for a new age again inside the loop when the current one is invalid", marks: 1, guidance: "" },
      { text: "Outputs \"Thank you\" once `isValidAge` returns True", marks: 1, guidance: "" },
    ],
  },

  // iteration: +6 (need 24)
  {
    id: "ocr-iteration-19", board: "ocr", topic: "iteration", concept: "loop-break-early",
    ability: 2, marks: 3, format: "text",
    question: "```\nfor number in [4, 9, 15, 7, 20]:\n    if number > 10:\n        print(number)\n        break\n```\n\n(a) State the output of this program. [1]\n\n(b) Explain the effect of the `break` statement here. [2]",
    markScheme: [
      { text: "(a) 15", marks: 1, guidance: "" },
      { text: "(b) `break` immediately ends (exits) the loop, without checking the remaining items", marks: 1, guidance: "" },
      { text: "(b) So once 15 is found and printed, the loop stops - 7 and 20 are never checked", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-20", board: "ocr", topic: "iteration", concept: "loop-break-early",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs whole numbers one at a time, stopping as soon as either a negative number is entered or 10 numbers have been entered, whichever happens first. It should then output how many numbers were entered in total (not counting the negative one, if that is what stopped it). [5]",
    markScheme: [
      { text: "Uses a loop capable of running up to 10 times, with a counter tracking how many numbers have been entered", marks: 1, guidance: "" },
      { text: "Inputs a number and casts it to an integer inside the loop", marks: 1, guidance: "" },
      { text: "Correctly stops the loop as soon as a negative number is entered, without counting it", marks: 1, guidance: "e.g. using `break` before incrementing the counter." },
      { text: "Correctly stops the loop once 10 valid numbers have been entered, if no negative number appeared first", marks: 1, guidance: "" },
      { text: "Outputs the correct final count after the loop ends, for either stopping reason", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-21", board: "ocr", topic: "iteration", concept: "loop-running-total",
    ability: 1, marks: 2, format: "text",
    question: "```\ntotal = 0\nfor n in [3, 6, 1, 8]:\n    total = total + n\nprint(total)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "18", marks: 2, guidance: "1 mark for correctly adding all four values, 1 mark for the correct final total." },
    ],
  },
  {
    id: "ocr-iteration-22", board: "ocr", topic: "iteration", concept: "loop-running-total",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that inputs 5 prices (which may include pence) and outputs the total cost of all 5. [4]",
    markScheme: [
      { text: "Sets a running total to 0 before the loop", marks: 1, guidance: "" },
      { text: "Uses a loop that runs exactly 5 times", marks: 1, guidance: "" },
      { text: "Inputs a price each time, casting it to a real number, and adds it to the running total", marks: 1, guidance: "" },
      { text: "Outputs the total after the loop has finished", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-23", board: "ocr", topic: "iteration", concept: "loop-average",
    ability: 2, marks: 3, format: "text",
    question: "```\ntotal = 0\ncount = 0\nfor mark in [70, 85, 60, 90]:\n    total = total + mark\n    count = count + 1\nprint(total / count)\n```\n\n(a) State the output of this program. [1]\n\n(b) State what this calculation finds. [1]\n\n(c) State why the variable `count` is needed, rather than just dividing by 4 directly. [1]",
    markScheme: [
      { text: "(a) 76.25", marks: 1, guidance: "" },
      { text: "(b) The mean/average of the marks", marks: 1, guidance: "" },
      { text: "(c) It works correctly for a list of any size, not just one with exactly 4 items", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-iteration-24", board: "ocr", topic: "iteration", concept: "loop-average",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that inputs whole numbers one at a time, stopping when the user enters -1 (the -1 itself should not be included). It should then output the mean (average) of the numbers entered, rounded to 2 decimal places. You may assume at least one number is entered before -1. [5]",
    markScheme: [
      { text: "Sets a running total and a count to 0 before the loop", marks: 1, guidance: "" },
      { text: "Uses a condition-controlled loop that keeps reading numbers until -1 is entered", marks: 1, guidance: "" },
      { text: "Adds each number (other than -1) to the total and increases the count", marks: 1, guidance: "" },
      { text: "Correctly calculates the mean (total divided by count) once the loop ends", marks: 1, guidance: "" },
      { text: "Outputs the mean rounded to 2 decimal places", marks: 1, guidance: "" },
    ],
  },

  // lists: +2 (need 18)
  {
    id: "ocr-lists-17", board: "ocr", topic: "lists", concept: "list-remove-item",
    ability: 1, marks: 2, format: "text",
    question: "```\nfruits = [\"apple\", \"banana\", \"cherry\"]\nfruits.remove(\"banana\")\nprint(fruits)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "[\"apple\", \"cherry\"]", marks: 2, guidance: "1 mark for both remaining items, 1 mark for banana correctly removed and the order kept." },
    ],
  },
  {
    id: "ocr-lists-18", board: "ocr", topic: "lists", concept: "list-remove-item",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that stores a list of 5 names. It should input a name from the user and remove it from the list if it is present, then output the updated list. If the name is not in the list, the program should output `Name not found` instead. [4]",
    markScheme: [
      { text: "Creates a list of 5 names", marks: 1, guidance: "" },
      { text: "Inputs a name to remove", marks: 1, guidance: "" },
      { text: "Checks whether the name is in the list before trying to remove it (e.g. with `in`)", marks: 1, guidance: "" },
      { text: "Removes the name and outputs the updated list if found, or outputs \"Name not found\" if not", marks: 1, guidance: "" },
    ],
  },

  // robust-programs: +4 (need 18)
  {
    id: "ocr-robust-programs-15", board: "ocr", topic: "robust-programs", concept: "check-digit",
    ability: 1, marks: 1, format: "text",
    question: "State the purpose of a check digit added to the end of a barcode or ID number. [1]",
    markScheme: [
      { text: "To detect (some) errors made when the number is entered or read (e.g. mistyped or misread digits)", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-robust-programs-16", board: "ocr", topic: "robust-programs", concept: "check-digit",
    ability: 2, marks: 3, format: "text",
    question: "A 6-digit product code has a 7th digit added as a check digit, calculated from the first 6 digits by a fixed rule.\n\n(a) Explain how a check digit could reveal that a product code has been mistyped. [2]\n\n(b) State whether this method can guarantee that every possible typing error will be detected. [1]",
    markScheme: [
      { text: "(a) When a code is entered, the same rule is used to recalculate what the check digit should be from the first 6 digits", marks: 1, guidance: "" },
      { text: "(a) If the recalculated check digit does not match the one entered, an error has occurred somewhere in the code", marks: 1, guidance: "" },
      { text: "(b) No - it can catch many, but not all, possible errors", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-robust-programs-17", board: "ocr", topic: "robust-programs", concept: "readability-comments",
    ability: 1, marks: 2, format: "text",
    question: "State **two** things a programmer can do to make their program's code easier for another programmer to read and understand. [2]",
    markScheme: [
      { text: "Any two of: use meaningful (sensible) variable/function names / add comments to explain what code does / use consistent indentation / break the program into functions/procedures", marks: 2, guidance: "1 mark per valid technique, up to 2." },
    ],
  },
  {
    id: "ocr-robust-programs-18", board: "ocr", topic: "robust-programs", concept: "readability-comments",
    ability: 2, marks: 4, format: "text",
    question: "```\ndef f(x, y):\n    # z is the result\n    z = x * y * 0.2\n    return z\n```\n\nExplain **two** ways this code could be rewritten to be more maintainable, without changing what it calculates. [4]",
    markScheme: [
      { text: "Rename `f` to a meaningful function name, e.g. `calculateVAT`", marks: 1, guidance: "" },
      { text: "This makes it clear what the function is for, just from its name", marks: 1, guidance: "" },
      { text: "Rename `x`, `y` and `z` to meaningful names, e.g. `price`, `quantity`, `vatAmount`", marks: 1, guidance: "" },
      { text: "This makes the calculation easier to follow, and the existing comment (\"z is the result\") becomes unnecessary", marks: 1, guidance: "" },
    ],
  },

  // searching-sorting: +4 (need 18)
  {
    id: "ocr-searching-sorting-15", board: "ocr", topic: "searching-sorting", concept: "insertion-sort-trace",
    ability: 2, marks: 4, format: "text",
    question: "An insertion sort is used to sort the list `[5, 2, 4, 1]` into ascending order, one item at a time (starting from the second item).\n\nShow the state of the list after each item has been inserted into its correct position. [4]",
    markScheme: [
      { text: "After inserting 2: [2, 5, 4, 1]", marks: 1, guidance: "" },
      { text: "After inserting 4: [2, 4, 5, 1]", marks: 1, guidance: "" },
      { text: "After inserting 1: [1, 2, 4, 5]", marks: 1, guidance: "" },
      { text: "The list is now fully sorted", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-searching-sorting-16", board: "ocr", topic: "searching-sorting", concept: "insertion-sort-trace",
    ability: 3, marks: 5, format: "text",
    question: "State **three** differences between how an insertion sort and a merge sort approach sorting a list. [3]\n\nState **one** advantage of a merge sort over an insertion sort for very large lists. [2]",
    markScheme: [
      { text: "Any three of: insertion sort builds a sorted section one item at a time / merge sort repeatedly splits the list in half; insertion sort works on the original list in place / merge sort creates new sub-lists as it splits; insertion sort compares each new item against the already-sorted section / merge sort merges two already-sorted halves back together", marks: 3, guidance: "1 mark per correct, distinct difference, up to 3." },
      { text: "Merge sort is generally much faster for very large lists", marks: 1, guidance: "" },
      { text: "...because its performance scales better as the list grows (insertion sort's worst case gets disproportionately slower for large lists)", marks: 1, guidance: "Accept an explanation in terms of Big O / number of comparisons growing more slowly for merge sort." },
    ],
  },
  {
    id: "ocr-searching-sorting-17", board: "ocr", topic: "searching-sorting", concept: "linear-search-unsorted",
    ability: 1, marks: 1, format: "text",
    question: "State why a linear search (unlike a binary search) can be used on a list that has not been sorted. [1]",
    markScheme: [
      { text: "It checks every item one at a time from the start, so it does not rely on the items being in any particular order", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-searching-sorting-18", board: "ocr", topic: "searching-sorting", concept: "linear-search-unsorted",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that uses a linear search to count how many times a number, entered by the user, appears in the (unsorted) list `[4, 7, 4, 2, 4, 9]`. [4]",
    markScheme: [
      { text: "Inputs the number to search for and casts it to an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that checks every item in the list, without needing it to be sorted", marks: 1, guidance: "" },
      { text: "Correctly counts every match, not just the first one found", marks: 1, guidance: "" },
      { text: "Outputs the final count after the loop", marks: 1, guidance: "" },
    ],
  },

  // selection: +6 (need 24)
  {
    id: "ocr-selection-19", board: "ocr", topic: "selection", concept: "equality-vs-assignment",
    ability: 1, marks: 2, format: "text",
    question: "(a) State the operator used to check if two values are equal in an `if` statement. [1]\n\n(b) State the operator used to assign (store) a value in a variable. [1]",
    markScheme: [
      { text: "(a) ==", marks: 1, guidance: "" },
      { text: "(b) =", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-20", board: "ocr", topic: "selection", concept: "equality-vs-assignment",
    ability: 2, marks: 3, format: "text",
    question: "A student writes the following line of code, intending to check whether `score` is equal to 10:\n\n```\nif score = 10:\n```\n\n(a) Explain why this line of code causes an error. [1]\n\n(b) Rewrite the line correctly. [2]",
    markScheme: [
      { text: "(a) `=` is the assignment operator, not the equality (comparison) operator, so it cannot be used inside a condition like this", marks: 1, guidance: "" },
      { text: "(b) `if score == 10:`", marks: 2, guidance: "1 mark for using ==, 1 mark for the rest of the line (score, 10 and the colon) staying correct." },
    ],
  },
  {
    id: "ocr-selection-21", board: "ocr", topic: "selection", concept: "comparison-strings",
    ability: 2, marks: 3, format: "text",
    question: "```\nanswer = input(\"Enter yes or no\")\nif answer == \"Yes\":\n    print(\"Confirmed\")\nelse:\n    print(\"Not confirmed\")\n```\n\n(a) State the output if the user enters `Yes`. [1]\n\n(b) State the output if the user enters `yes`. [1]\n\n(c) Explain why. [1]",
    markScheme: [
      { text: "(a) Confirmed", marks: 1, guidance: "" },
      { text: "(b) Not confirmed", marks: 1, guidance: "" },
      { text: "(c) String comparison in Python is case-sensitive, so \"yes\" and \"Yes\" are not considered equal", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-22", board: "ocr", topic: "selection", concept: "comparison-strings",
    ability: 3, marks: 5, format: "code",
    question: "Write a program that asks the user to confirm an action by entering \"yes\" or \"no\", accepting the answer regardless of the upper or lower case it is typed in (so \"YES\", \"Yes\" and \"yes\" should all be treated the same). It should output `Confirmed`, `Cancelled`, or `Invalid response` for anything else. [5]",
    markScheme: [
      { text: "Takes the response as input", marks: 1, guidance: "" },
      { text: "Converts the response to a single, consistent case before comparing", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Confirmed\" for any case-variant of \"yes\"", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Cancelled\" for any case-variant of \"no\"", marks: 1, guidance: "" },
      { text: "Correctly outputs \"Invalid response\" for anything else", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-23", board: "ocr", topic: "selection", concept: "ternary-like-selection",
    ability: 2, marks: 3, format: "text",
    question: "```\nn = 7\nresult = \"Even\" if n % 2 == 0 else \"Odd\"\nprint(result)\n```\n\n(a) State the output of this program. [1]\n\n(b) Rewrite these three lines using a standard `if` / `else` statement instead, so the program behaves identically. [2]",
    markScheme: [
      { text: "(a) Odd", marks: 1, guidance: "" },
      { text: "(b) A correct `if n % 2 == 0:` / `else:` structure", marks: 1, guidance: "" },
      { text: "(b) ...that assigns \"Even\" to `result` in the `if` branch and \"Odd\" in the `else` branch, then prints `result`", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-selection-24", board: "ocr", topic: "selection", concept: "ternary-like-selection",
    ability: 1, marks: 1, format: "text",
    question: "```\nage = 20\nstatus = \"Adult\" if age >= 18 else \"Minor\"\nprint(status)\n```\n\nState the output of this program. [1]",
    markScheme: [
      { text: "Adult", marks: 1, guidance: "" },
    ],
  },

  // sequencing: +2 (need 18)
  {
    id: "ocr-sequencing-17", board: "ocr", topic: "sequencing", concept: "compound-assignment",
    ability: 1, marks: 2, format: "text",
    question: "```\ntotal = 10\ntotal += 5\nprint(total)\n```\n\nState the output of this program. [2]",
    markScheme: [
      { text: "15", marks: 2, guidance: "1 mark for understanding `+=` adds to the existing value, 1 mark for the correct final value." },
    ],
  },
  {
    id: "ocr-sequencing-18", board: "ocr", topic: "sequencing", concept: "compound-assignment",
    ability: 2, marks: 3, format: "text",
    question: "```\nscore = 100\nscore -= 15\nscore *= 2\nprint(score)\n```\n\n(a) State the output of this program. [1]\n\n(b) Rewrite the second line, `score -= 15`, without using the `-=` operator, so it has the same effect. [2]",
    markScheme: [
      { text: "(a) 170", marks: 1, guidance: "" },
      { text: "(b) `score = score - 15`", marks: 2, guidance: "1 mark for correct structure (assignment using the existing value), 1 mark for the exact correct calculation." },
    ],
  },

  // strings: +2 (need 18)
  {
    id: "ocr-strings-17", board: "ocr", topic: "strings", concept: "string-membership",
    ability: 1, marks: 2, format: "text",
    question: "```\nword = \"pineapple\"\nprint(\"apple\" in word)\nprint(\"banana\" in word)\n```\n\nState the output of both lines, in order. [2]",
    markScheme: [
      { text: "True", marks: 1, guidance: "" },
      { text: "False", marks: 1, guidance: "" },
    ],
  },
  {
    id: "ocr-strings-18", board: "ocr", topic: "strings", concept: "string-membership",
    ability: 2, marks: 4, format: "code",
    question: "Write a program that inputs a whole number N, then inputs N words one at a time, and outputs how many of them contain the letter \"e\" (in either upper or lower case). [4]",
    markScheme: [
      { text: "Inputs N and casts it to an integer", marks: 1, guidance: "" },
      { text: "Uses a loop that runs N times, taking one word as input each time", marks: 1, guidance: "" },
      { text: "Correctly checks each word for the letter \"e\" in either case", marks: 1, guidance: "e.g. checking both 'e' and 'E', or converting the word to one case first." },
      { text: "Outputs the correct final count", marks: 1, guidance: "" },
    ],
  },
];
