// Practice tasks: Robust programs. Expected outputs come from independent
// JavaScript versions of each rule; the Python reference solutions and the
// buggy starters are then checked against them in real Pyodide.
const t = (stdin, expect) => ({ stdin, expect });
const lines = (...parts) => parts.flat().join("\n");
const V = "Valid", I = "Invalid";

// --- JS reference rules
const present = (s) => s.trim().length > 0;
const isDigits = (s) => /^[0-9]+$/.test(s);
const productCode = (s) => /^[A-Z]{2}[0-9]{3}$/.test(s);
const email = (s) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(s);
const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const validDate = (d, m, y) => y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= monthDays[m - 1];
const failedCheck = (s) => (s.length === 0 ? "Empty" : s.length < 8 ? "Too short" : !/[0-9]/.test(s) ? "No digit" : "OK");
const strength = (s) => {
  const n = [s.length >= 8, /[A-Z]/.test(s), /[a-z]/.test(s), /[0-9]/.test(s), /[^A-Za-z0-9]/.test(s)].filter(Boolean).length;
  return { n, label: n <= 2 ? "Weak" : n <= 4 ? "OK" : "Strong" };
};
const strong = (s) => s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s);
const cardResult = (s) => (!isDigits(s) ? "Not digits" : s.length !== 16 ? "Wrong length" : [...s].reduce((a, c) => a + Number(c), 0) % 10 !== 0 ? "Failed check" : "Valid");
const classifyAge = (s) => (!isDigits(s) ? "Erroneous" : (() => { const n = Number(s); return n === 13 || n === 19 ? "Boundary" : n > 13 && n < 19 ? "Normal" : "Invalid"; })());

export const tasks = [
  // ================================================================ validation
  {
    slug: "gcse-robust-programs-p-01", tier: 1, difficulty: 1, xp: 10, title: "Is anything there?",
    brief: "A form must not be left blank. A name that is only spaces counts as blank too.\n\nInput some text. Print `Valid` if it contains at least one character that is not a space. Otherwise print `Invalid`.",
    starter: "", hints: ["Text made only of spaces is the same as empty text once the spaces are taken off.", "`text.strip()` removes spaces from both ends. Check whether what is left is empty."],
    tests: ["Sam", "", "   ", " a ", "0"].map((s) => t(s, present(s) ? V : I)),
    solution: `text = input()
if text.strip() != "":
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-02", tier: 1, difficulty: 1, xp: 10, title: "Rating from 1 to 5",
    brief: "A survey asks for a rating from 1 to 5. Both 1 and 5 are allowed.\n\nInput a whole number. Print `Valid` if it is from 1 to 5, otherwise print `Invalid`.",
    starter: "", hints: ["You need two things to be true at once: at least 1 AND at most 5.", "`if rating >= 1 and rating <= 5:`"],
    tests: [3, 1, 5, 0, 6, -2].map((n) => t(String(n), n >= 1 && n <= 5 ? V : I)),
    solution: `rating = int(input())
if rating >= 1 and rating <= 5:
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-03", tier: 2, difficulty: 2, xp: 15, title: "Username length",
    brief: "A username must be from 4 to 12 characters long. Both 4 and 12 are allowed.\n\nInput a username. Print `Valid` if its length is allowed, otherwise print `Invalid`.",
    starter: "", hints: ["`len(name)` gives the number of characters.", "Check the length against both limits: `len(name) >= 4 and len(name) <= 12`."],
    tests: ["abc", "abcd", "abcdefghijkl", "abcdefghijklm", "sam_99", ""].map((s) => t(s, s.length >= 4 && s.length <= 12 ? V : I)),
    solution: `name = input()
if len(name) >= 4 and len(name) <= 12:
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-04", tier: 2, difficulty: 2, xp: 15, title: "A four-digit PIN",
    brief: "A PIN must be exactly 4 digits (0 to 9) and nothing else.\n\nInput some text. Print `Valid` if it is exactly 4 digits, otherwise print `Invalid`.\n\nFor example, `0472` is valid but `472` and `47a2` are not.",
    starter: "", hints: ["There are two checks: the length must be 4, and every character must be a digit.", "`text.isdigit()` is True when every character is a digit. Keep the PIN as text so the leading 0 is not lost."],
    tests: ["0472", "4821", "472", "47a2", "48211", "", "12 4"].map((s) => t(s, s.length === 4 && isDigits(s) ? V : I)),
    solution: `pin = input()
if len(pin) == 4 and pin.isdigit():
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-05", tier: 3, difficulty: 3, xp: 25, title: "Product code format",
    brief: "A product code must be in this format: two capital letters, then three digits. For example `AB123`.\n\nInput a code. Print `Valid` if it matches the format exactly, otherwise print `Invalid`.\n\nLower case letters are not allowed, so `ab123` is invalid.",
    starter: "", hints: ["Check the length is 5 first. Then check the first two characters and the last three separately.", "For the letters use `code[:2].isalpha()` and `code[:2].isupper()`. For the digits use `code[2:].isdigit()`."],
    tests: ["AB123", "ab123", "Ab123", "A1234", "ABC12", "AB12", "AB1234", "AB12x", "ZZ000"].map((s) => t(s, productCode(s) ? V : I)),
    solution: `code = input()
if len(code) == 5 and code[:2].isalpha() and code[:2].isupper() and code[2:].isdigit():
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-06", tier: 4, difficulty: 4, xp: 30, title: "Email format check",
    brief: "A simple email check says an address is valid when **all** of these are true:\n- it has exactly one `@`\n- it has no spaces\n- there is at least one character before the `@`\n- after the `@` there is a `.` with at least one character before it and at least one character after it\n\nInput an address. Print `Valid` or `Invalid`.\n\nFor example, `sam@mail.com` is valid. `sam@mail` and `@mail.com` and `sam@.com` are not.",
    starter: "", hints: ["Count the `@` characters first with `text.count(\"@\")`. If it is not exactly 1 (or there is a space) it is invalid.", "Split into two parts with `name, domain = text.split(\"@\")`. Use `domain.find(\".\")` to find the first dot: it must not be at position 0 and must not be the last character."],
    tests: ["sam@mail.com", "sam@mail", "@mail.com", "sam@.com", "sam@mail.", "sa m@mail.com", "sam@@mail.com", "a@b.c", "sam@mail.co.uk", "sam.mail.com"].map((s) => t(s, email(s) ? V : I)),
    solution: `text = input()
valid = False
if text.count("@") == 1 and " " not in text:
    name, domain = text.split("@")
    dot = domain.find(".")
    if len(name) > 0 and dot > 0 and dot < len(domain) - 1:
        valid = True
if valid:
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-07", tier: 3, difficulty: 3, xp: 25, title: "Menu choice, ask again",
    brief: "A menu has three options: 1, 2 and 3. The user types their choice as text.\n\nRead choices, one per line. Each time the choice is not exactly `1`, `2` or `3`, print `Please choose 1, 2 or 3` and read another choice. When the choice is valid, print `You chose ` followed by the choice, and stop.\n\nFor example, the choices `x`, `7`, `2` print:\n```\nPlease choose 1, 2 or 3\nPlease choose 1, 2 or 3\nYou chose 2\n```",
    starter: "", hints: ["Read the first choice before the loop, then loop `while` the choice is not valid, reading again each time.", "Keep it as text. A choice is valid when `choice == \"1\" or choice == \"2\" or choice == \"3\"` (or `choice in [\"1\", \"2\", \"3\"]`)."],
    tests: [["2"], ["x", "7", "2"], ["", "12", "3"], ["0", "1"], ["a", "b", "c", "3"]].map((c) => { const out = []; for (const x of c) { if (["1", "2", "3"].includes(x)) { out.push("You chose " + x); break; } out.push("Please choose 1, 2 or 3"); } return t(c.join("\n"), out.join("\n")); }),
    solution: `choice = input()
while choice != "1" and choice != "2" and choice != "3":
    print("Please choose 1, 2 or 3")
    choice = input()
print("You chose " + choice)`,
  },
  {
    slug: "gcse-robust-programs-p-08", tier: 3, difficulty: 3, xp: 25, title: "A whole number above zero",
    brief: "A program needs a whole number that is 1 or more. The user types their entry as text.\n\nRead entries, one per line. An entry is valid only if it is made up of digits and its value is more than 0. Each time an entry is not valid, print `Try again` and read another. When it is valid, print `Accepted: ` followed by the number, and stop.\n\nFor example, `abc`, `0`, `12` prints:\n```\nTry again\nTry again\nAccepted: 12\n```",
    starter: "", hints: ["Check that the entry is all digits BEFORE you convert it with `int()`, otherwise the program crashes on `abc`.", "One way: keep a variable `valid = False`. Inside the loop, set it to True only if `entry.isdigit()` and `int(entry) > 0`."],
    tests: [["5"], ["abc", "0", "12"], ["-4", "3.5", "007"], ["", "0", "0", "1"], ["10a", "10"]].map((c) => { const out = []; for (const x of c) { if (isDigits(x) && Number(x) > 0) { out.push("Accepted: " + Number(x)); break; } out.push("Try again"); } return t(c.join("\n"), out.join("\n")); }),
    solution: `entry = input()
valid = False
if entry.isdigit():
    if int(entry) > 0:
        valid = True
while not valid:
    print("Try again")
    entry = input()
    if entry.isdigit():
        if int(entry) > 0:
            valid = True
print("Accepted: " + str(int(entry)))`,
  },
  {
    slug: "gcse-robust-programs-p-09", tier: 3, difficulty: 3, xp: 25, title: "Which password check failed?",
    brief: "A password is checked in this order. The first check that fails decides the message:\n1. If nothing was entered, print `Empty`\n2. If it is shorter than 8 characters, print `Too short`\n3. If it has no digit (0 to 9), print `No digit`\n\nIf all the checks pass, print `OK`.\n\nInput a password and print the message.",
    starter: "", hints: ["Use `if` / `elif` / `elif` / `else` so only the first failing check prints anything.", "To find out whether there is a digit, loop through the characters and use `character.isdigit()`, keeping a variable that becomes True if you find one."],
    tests: ["", "abc1", "abcdefgh", "abcdefg1", "12345678", "passw0rd!", "1"].map((s) => t(s, failedCheck(s))),
    solution: `password = input()
has_digit = False
for character in password:
    if character.isdigit():
        has_digit = True
if len(password) == 0:
    print("Empty")
elif len(password) < 8:
    print("Too short")
elif not has_digit:
    print("No digit")
else:
    print("OK")`,
  },
  {
    slug: "gcse-robust-programs-p-10", tier: 4, difficulty: 4, xp: 30, title: "Is it a real date?",
    brief: "Input a day, then a month, then a year, as whole numbers (one per line). Print `Valid` if it is a real date, otherwise print `Invalid`.\n\nUse these rules:\n- the year must be from 1900 to 2100\n- the month must be from 1 to 12\n- the day must be at least 1 and no more than the number of days in that month\n\nThe months with 30 days are April (4), June (6), September (9) and November (11). February (2) has 28 days (ignore leap years). All the other months have 31 days.",
    starter: "", hints: ["Check the year and the month first. If either is wrong the date is invalid, whatever the day is.", "Work out how many days the month has (28, 30 or 31) and store it in a variable, then check `day >= 1 and day <= days`."],
    tests: [[15, 6, 2024], [31, 4, 2024], [30, 4, 2024], [29, 2, 2023], [28, 2, 2023], [0, 5, 2000], [31, 12, 2100], [1, 13, 2000], [1, 1, 1899], [31, 1, 2101]].map(([d, m, y]) => t(lines(d, m, y), validDate(d, m, y) ? V : I)),
    solution: `day = int(input())
month = int(input())
year = int(input())
valid = False
if year >= 1900 and year <= 2100 and month >= 1 and month <= 12:
    if month == 4 or month == 6 or month == 9 or month == 11:
        days = 30
    elif month == 2:
        days = 28
    else:
        days = 31
    if day >= 1 and day <= days:
        valid = True
if valid:
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-11", tier: 3, difficulty: 3, xp: 25, title: "Age entry: type, then range",
    brief: "A club accepts members aged 13 to 19 (both included). The age is typed as text.\n\nInput the age and check it in this order:\n1. If it is not made up only of digits, print `Not a number`\n2. Otherwise, if it is less than 13 or more than 19, print `Out of range`\n3. Otherwise print `Accepted`",
    starter: "", hints: ["Do the type check first. You cannot safely use `int()` on text that is not a number.", "If `age.isdigit()` is False you are done. If it is True, you can convert it and compare."],
    tests: ["15", "13", "19", "12", "20", "abc", "", "1.5", "-3"].map((s) => t(s, !isDigits(s) ? "Not a number" : Number(s) < 13 || Number(s) > 19 ? "Out of range" : "Accepted")),
    solution: `age = input()
if not age.isdigit():
    print("Not a number")
elif int(age) < 13 or int(age) > 19:
    print("Out of range")
else:
    print("Accepted")`,
  },
  {
    slug: "gcse-robust-programs-p-12", tier: 4, difficulty: 4, xp: 30, title: "Card number check",
    brief: "A card number is checked in this order:\n1. If it contains anything that is not a digit, print `Not digits`\n2. If it is not exactly 16 characters long, print `Wrong length`\n3. If the sum of its digits is not a multiple of 10, print `Failed check`\n\nIf all three checks pass, print `Valid`.\n\nInput a card number and print the result.",
    starter: "", hints: ["Do the checks in the order given and stop at the first one that fails.", "For the sum: `total = 0`, then for each character add `int(character)`. A multiple of 10 has `total % 10 == 0`."],
    tests: ["1234567890123456", "0000000000000000", "1111111111111119", "12345", "1234 5678 9012 3456", "abcdefghijklmnop", "5555555555555550", "55555555555555555"].map((s) => t(s, cardResult(s))),
    solution: `card = input()
if not card.isdigit():
    print("Not digits")
elif len(card) != 16:
    print("Wrong length")
else:
    total = 0
    for character in card:
        total = total + int(character)
    if total % 10 != 0:
        print("Failed check")
    else:
        print("Valid")`,
  },

  // ============================================================ authentication
  {
    slug: "gcse-robust-programs-p-13", tier: 1, difficulty: 1, xp: 10, title: "Do the passwords match?",
    brief: "When someone creates an account they type their new password twice, to catch typing mistakes.\n\nInput the password, then input it again. Print `Match` if the two are exactly the same, otherwise print `Do not match`. Capital letters matter.",
    starter: "", hints: ["Read both lines into two variables.", "Compare them with `==`. It already treats `Cat` and `cat` as different."],
    tests: [["river42", "river42"], ["river42", "River42"], ["a", "b"], ["", ""], ["pass word", "pass word"], ["abc", "abcd"]].map(([a, b]) => t(lines(a, b), a === b ? "Match" : "Do not match")),
    solution: `first = input()
second = input()
if first == second:
    print("Match")
else:
    print("Do not match")`,
  },
  {
    slug: "gcse-robust-programs-p-14", tier: 2, difficulty: 2, xp: 15, title: "PIN with a leading zero",
    brief: "The stored PIN is `0472`. Input a PIN. Print `Access granted` if it is exactly the same as the stored PIN, otherwise print `Access denied`.\n\nCareful: `472` is **not** the same as `0472`.",
    starter: "", hints: ["If you turn the PIN into a number with `int()`, the leading 0 disappears and the check goes wrong.", "Keep the PIN as text and compare it with the string `\"0472\"`."],
    tests: ["0472", "472", "0473", "", "04720", "0472 "].map((s) => t(s, s === "0472" ? "Access granted" : "Access denied")),
    solution: `pin = input()
if pin == "0472":
    print("Access granted")
else:
    print("Access denied")`,
  },
  {
    slug: "gcse-robust-programs-p-15", tier: 3, difficulty: 3, xp: 25, title: "Two accounts",
    brief: "A system has two accounts:\n- username `ana`, password `blue7`\n- username `raj`, password `Green!9`\n\nInput a username, then a password. If they match one of the accounts, print `Welcome, ` followed by the username. Otherwise print `Login failed`.\n\nThe password must belong to the same account as the username: `ana` with `Green!9` fails.",
    starter: "", hints: ["Check each account separately: the username matches AND the password matches.", "Use `if username == \"ana\" and password == \"blue7\":` then `elif` for the second account."],
    tests: [["ana", "blue7"], ["raj", "Green!9"], ["ana", "Green!9"], ["raj", "blue7"], ["Ana", "blue7"], ["zed", "x"], ["ana", "Blue7"]].map(([u, p]) => t(lines(u, p), (u === "ana" && p === "blue7") || (u === "raj" && p === "Green!9") ? `Welcome, ${u}` : "Login failed")),
    solution: `username = input()
password = input()
if username == "ana" and password == "blue7":
    print("Welcome, ana")
elif username == "raj" and password == "Green!9":
    print("Welcome, raj")
else:
    print("Login failed")`,
  },
  {
    slug: "gcse-robust-programs-p-16", tier: 4, difficulty: 4, xp: 30, title: "Password strength score",
    brief: "A password gets 1 point for each of these it meets:\n- at least 8 characters long\n- has a capital letter\n- has a lower case letter\n- has a digit (0 to 9)\n- has a symbol (anything that is not a letter or a digit)\n\nInput a password. Print `Score: ` followed by the points out of 5 (for example `Score: 3/5`), then on the next line print `Weak` for 0 to 2 points, `OK` for 3 or 4 points, or `Strong` for 5 points.",
    starter: "", hints: ["Work out each of the five checks separately and add 1 to a `score` variable for each one that is met.", "Useful string methods: `isupper()`, `islower()`, `isdigit()` and `isalnum()` (a symbol is a character where `isalnum()` is False)."],
    tests: ["abc", "abcdefgh", "Abcdefg1", "Passw0rd!", "PASSWORD", "12345678", "a1!", "Ab1!"].map((s) => { const r = strength(s); return t(s, `Score: ${r.n}/5\n${r.label}`); }),
    solution: `password = input()
score = 0
has_upper = False
has_lower = False
has_digit = False
has_symbol = False
for character in password:
    if character.isupper():
        has_upper = True
    elif character.islower():
        has_lower = True
    elif character.isdigit():
        has_digit = True
    elif not character.isalnum():
        has_symbol = True
if len(password) >= 8:
    score = score + 1
if has_upper:
    score = score + 1
if has_lower:
    score = score + 1
if has_digit:
    score = score + 1
if has_symbol:
    score = score + 1
print("Score: " + str(score) + "/5")
if score <= 2:
    print("Weak")
elif score <= 4:
    print("OK")
else:
    print("Strong")`,
  },
  {
    slug: "gcse-robust-programs-p-17", tier: 3, difficulty: 3, xp: 25, title: "Strong or weak?",
    brief: "A password is **strong** if it is at least 8 characters long AND has at least one capital letter AND at least one lower case letter AND at least one digit.\n\nInput a password. Print `Strong` or `Weak`.",
    starter: "", hints: ["Loop through the characters and use three True/False variables: one for capitals, one for lower case, one for digits.", "At the end, the password is strong only if the length is enough and all three variables are True."],
    tests: ["Passw0rd", "password1", "PASSWORD1", "Pass1", "Abcdefg1", "abcdefgH", "12345678", "P4ssword!"].map((s) => t(s, strong(s) ? "Strong" : "Weak")),
    solution: `password = input()
has_upper = False
has_lower = False
has_digit = False
for character in password:
    if character.isupper():
        has_upper = True
    if character.islower():
        has_lower = True
    if character.isdigit():
        has_digit = True
if len(password) >= 8 and has_upper and has_lower and has_digit:
    print("Strong")
else:
    print("Weak")`,
  },
  {
    slug: "gcse-robust-programs-p-18", tier: 3, difficulty: 3, xp: 25, title: "Is the username taken?",
    brief: "Input a whole number N. Then input N usernames that already exist, one per line. Finally input a new username that someone wants.\n\nPrint `Taken` if the new username is already in the list, otherwise print `Available`. Capital letters do not matter, so `Sam` and `sam` count as the same username.",
    starter: "", hints: ["To ignore capital letters, change both the new name and each stored name to lower case with `.lower()` before comparing.", "Loop through the stored names. If any of them matches, it is taken."],
    tests: [[["sam", "ana"], "ana"], [["sam", "ana"], "ANA"], [["sam", "ana"], "ben"], [["Sam"], "sam"], [["sam", "ana", "raj"], "ra"], [["x"], "x"]].map(([u, n]) => t(lines(u.length, u, n), u.some((v) => v.toLowerCase() === n.toLowerCase()) ? "Taken" : "Available")),
    solution: `n = int(input())
existing = []
for i in range(n):
    existing.append(input().lower())
wanted = input().lower()
if wanted in existing:
    print("Taken")
else:
    print("Available")`,
  },
  {
    slug: "gcse-robust-programs-p-19", tier: 4, difficulty: 4, xp: 30, title: "Two-factor login",
    brief: "A login needs two things: the password `river42` and the code `4821` that was sent to the user's phone.\n\nInput the password, then input the code. Print:\n- `Logged in` if both are correct\n- `Wrong password` if the password is wrong (whatever the code is)\n- `Wrong code` if the password is right but the code is wrong",
    starter: "", hints: ["Read both lines first. Then check the password before you check the code.", "Use `if password != \"river42\":` first, then `elif code != \"4821\":`, then `else:`."],
    tests: [["river42", "4821"], ["river42", "1234"], ["River42", "4821"], ["wrong", "wrong"], ["river42", ""], ["", "4821"]].map(([p, c]) => t(lines(p, c), p !== "river42" ? "Wrong password" : c !== "4821" ? "Wrong code" : "Logged in")),
    solution: `password = input()
code = input()
if password != "river42":
    print("Wrong password")
elif code != "4821":
    print("Wrong code")
else:
    print("Logged in")`,
  },

  // ================================================== finding and fixing errors
  {
    slug: "gcse-robust-programs-p-20", tier: 2, difficulty: 2, xp: 15, title: "Fix the syntax error: greeting",
    brief: "This program should input a name and print `Hello, ` followed by the name. For example, the name `Sam` prints `Hello, Sam`.\n\nIt will not run because of a syntax error. Find it and fix it.",
    starter: "name = input()\nprint(\"Hello, \" + name\n",
    hints: ["Python's error message points to the line. Look at how that line ends.", "Every opening bracket needs a closing bracket."],
    tests: ["Sam", "Priya", "A"].map((s) => t(s, `Hello, ${s}`)),
    solution: `name = input()
print("Hello, " + name)`,
  },
  {
    slug: "gcse-robust-programs-p-21", tier: 2, difficulty: 2, xp: 15, title: "Fix the syntax error: countdown",
    brief: "This program should input a whole number and count down from it to 1, printing each number on its own line. For example, `3` prints `3`, `2`, `1`.\n\nIt will not run because of a syntax error. Find it and fix it.",
    starter: "count = int(input())\nwhile count > 0\n    print(count)\n    count = count - 1\n",
    hints: ["Look at the end of the line that starts with `while`.", "Lines that start `if`, `while`, `for` and `else` must end with a colon."],
    tests: [3, 1, 5].map((n) => t(String(n), Array.from({ length: n }, (_, i) => n - i).join("\n"))),
    solution: `count = int(input())
while count > 0:
    print(count)
    count = count - 1`,
  },
  {
    slug: "gcse-robust-programs-p-22", tier: 3, difficulty: 3, xp: 25, title: "Fix the logic error: the total",
    brief: "This program should input a whole number N, then N whole numbers (one per line), and print their total. For example, `3` then `4`, `5`, `6` prints `15`.\n\nIt runs, but the total is wrong. Find the logic error and fix it.",
    starter: "n = int(input())\ntotal = 0\nfor i in range(n):\n    number = int(input())\ntotal = total + number\nprint(total)\n",
    hints: ["Run it with 3 numbers and work out by hand which numbers actually get added to the total.", "The line that adds to the total is not inside the loop, so it only runs once. Indent it."],
    tests: [[4, 5, 6], [10], [1, 2], [7, 7, 7, 7]].map((a) => t(lines(a.length, a), String(a.reduce((x, y) => x + y, 0)))),
    solution: `n = int(input())
total = 0
for i in range(n):
    number = int(input())
    total = total + number
print(total)`,
  },
  {
    slug: "gcse-robust-programs-p-23", tier: 3, difficulty: 3, xp: 25, title: "Fix the logic error: age check",
    brief: "An age is valid if it is from 1 to 120 (both included). This program should print `Valid` or `Invalid`.\n\nA tester says it prints `Valid` for ages that are far too big. Find the logic error and fix it.",
    starter: "age = int(input())\nif age >= 1 or age <= 120:\n    print(\"Valid\")\nelse:\n    print(\"Invalid\")\n",
    hints: ["Try the ages 0 and 200 in your head. Which part of the condition is true for 200?", "Both limits must be respected at the same time, so `or` is the wrong word."],
    tests: [45, 1, 120, 0, 121, 200, -5].map((n) => t(String(n), n >= 1 && n <= 120 ? V : I)),
    solution: `age = int(input())
if age >= 1 and age <= 120:
    print("Valid")
else:
    print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-24", tier: 3, difficulty: 3, xp: 25, title: "Fix the logic error: three attempts",
    brief: "A user gets **3** attempts to enter the password `sun`. Read guesses, one per line. If a guess is right, print `Access granted` and stop. If the user has used 3 wrong guesses, print `Locked out`.\n\nThis program lets the user have more than 3 attempts. Find the logic error and fix it.",
    starter: "attempts = 0\ngranted = False\nwhile attempts <= 3 and not granted:\n    guess = input()\n    attempts = attempts + 1\n    if guess == \"sun\":\n        granted = True\nif granted:\n    print(\"Access granted\")\nelse:\n    print(\"Locked out\")\n",
    hints: ["Count how many guesses the loop allows. The loop runs while `attempts <= 3` - how many values of `attempts` is that?", "Starting from 0, the loop should run for the values 0, 1 and 2 only, so the condition should be `attempts < 3`."],
    tests: [["sun"], ["a", "sun"], ["a", "b", "sun"], ["a", "b", "c"], ["a", "b", "c", "sun"], ["a", "b", "c", "d", "sun"]].map((g) => { let ok = false; for (const x of g.slice(0, 3)) if (x === "sun") { ok = true; break; } return t(g.join("\n"), ok ? "Access granted" : "Locked out"); }),
    solution: `attempts = 0
granted = False
while attempts < 3 and not granted:
    guess = input()
    attempts = attempts + 1
    if guess == "sun":
        granted = True
if granted:
    print("Access granted")
else:
    print("Locked out")`,
  },
  {
    slug: "gcse-robust-programs-p-25", tier: 3, difficulty: 3, xp: 25, title: "Fix the logic error: at least 8",
    brief: "A password must have **at least** 8 characters. This program should print `Long enough` or `Too short`.\n\nA tester says it gives the wrong answer for one particular length. Find the logic error and fix it.",
    starter: "password = input()\nif len(password) > 8:\n    print(\"Long enough\")\nelse:\n    print(\"Too short\")\n",
    hints: ["Try passwords with 7, 8 and 9 characters. Which one is treated wrongly?", "\"At least 8\" includes 8 itself. Look at the comparison operator: `>` leaves 8 out."],
    tests: ["abcdefg", "abcdefgh", "abcdefghi", "", "12345678", "a"].map((s) => t(s, s.length >= 8 ? "Long enough" : "Too short")),
    solution: `password = input()
if len(password) >= 8:
    print("Long enough")
else:
    print("Too short")`,
  },

  // ============================================================== test data
  {
    slug: "gcse-robust-programs-p-26", tier: 2, difficulty: 2, xp: 15, title: "Classify the test data",
    brief: "A program should accept whole numbers from 13 to 19. Each entry is typed as text.\n\nInput an entry and print what kind of test data it is:\n- `Erroneous` if it contains anything that is not a digit (so `abc`, `4.5` and `-3` are erroneous)\n- `Boundary` if it is 13 or 19\n- `Normal` if it is from 14 to 18\n- `Invalid` for any other whole number",
    starter: "", hints: ["Check for erroneous data first, with `isdigit()`. Only then convert with `int()`.", "After that: boundary values first, then the normal range, and everything left over is invalid."],
    tests: ["15", "13", "19", "14", "18", "12", "20", "0", "abc", "4.5", "-3", ""].map((s) => t(s, classifyAge(s))),
    solution: `entry = input()
if not entry.isdigit():
    print("Erroneous")
else:
    number = int(entry)
    if number == 13 or number == 19:
        print("Boundary")
    elif number > 13 and number < 19:
        print("Normal")
    else:
        print("Invalid")`,
  },
  {
    slug: "gcse-robust-programs-p-27", tier: 2, difficulty: 2, xp: 15, title: "Choose test data for a range",
    brief: "A tester wants a set of test values for a rule that accepts whole numbers from a lowest value to a highest value.\n\nInput the lowest allowed number, then the highest allowed number. Print four lines:\n```\nNormal: <the middle value>\nBoundary: <the lowest number>\nBoundary: <the highest number>\nInvalid: <the highest number plus 1>\n```\nThe middle value is `(lowest + highest) DIV 2` (whole-number division).\n\nFor example, the range 1 to 10 prints `Normal: 5`, `Boundary: 1`, `Boundary: 10` and `Invalid: 11`.",
    starter: "", hints: ["Convert both inputs to whole numbers first, then work out the middle value with `//`.", "Use one `print` for each of the four lines, joining the label and the number with `str()`."],
    tests: [[1, 10], [13, 19], [0, 100], [5, 5], [-4, 4]].map(([a, b]) => t(lines(a, b), `Normal: ${Math.floor((a + b) / 2)}\nBoundary: ${a}\nBoundary: ${b}\nInvalid: ${b + 1}`)),
    solution: `low = int(input())
high = int(input())
print("Normal: " + str((low + high) // 2))
print("Boundary: " + str(low))
print("Boundary: " + str(high))
print("Invalid: " + str(high + 1))`,
  },
  {
    slug: "gcse-robust-programs-p-28", tier: 3, difficulty: 3, xp: 25, title: "A username-checking function",
    brief: "A username is valid if it is from 4 to 12 characters long AND made up only of letters and digits (no spaces or symbols).\n\nWrite a function called `is_valid_username(name)` that returns `True` if the username is valid and `False` if it is not.\n\nThen write a main program. Input a whole number N, then N usernames (one per line). For each one, in order, use your function and print `Valid` or `Invalid` on its own line.",
    starter: "def is_valid_username(name):\n    # write your code here\n\n\n",
    hints: ["Inside the function, `return` a condition that checks the length and `name.isalnum()` together.", "In the main program, use a loop that runs N times. Call the function inside an `if`."],
    tests: [[["sam99", "ab", "has space", "abcdefghijklm"]], [["Ana2"]], [["a_b_c_d", "abcd", "abcdefghijkl"]]].map(([a]) => t(lines(a.length, a), a.map((s) => (s.length >= 4 && s.length <= 12 && /^[A-Za-z0-9]+$/.test(s) ? V : I)).join("\n"))),
    solution: `def is_valid_username(name):
    return len(name) >= 4 and len(name) <= 12 and name.isalnum()

n = int(input())
for i in range(n):
    name = input()
    if is_valid_username(name):
        print("Valid")
    else:
        print("Invalid")`,
  },

  // ==================================================================== stretch
  {
    slug: "gcse-robust-programs-p-s1", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Registration checker",
    brief: "A website checks a new account. Input a username, then a password, then an age (all typed as text, one per line).\n\nCheck them in this order and print one line for **each** rule that is broken:\n1. The username must be 4 to 12 characters and made up only of letters and digits. Otherwise print `Bad username`\n2. The password must be at least 8 characters long and contain at least one digit. Otherwise print `Bad password`\n3. The age must be made up only of digits and be from 13 to 19. Otherwise print `Bad age`\n\nIf nothing is broken, print `Registered`.\n\nFor example, `sam99`, `abc`, `20` prints `Bad password` and `Bad age`.",
    starter: "", hints: ["Do the three checks one after the other, each with its own `if`, so that more than one message can be printed.", "Keep a variable that counts the problems. At the end, if it is still 0, print `Registered`. Do the age type check before you use `int()`."],
    tests: [["sam99", "abcdefg1", "15"], ["sam99", "abc", "20"], ["ab", "abcdefgh", "x"], ["sam 99", "12345678", "13"], ["Bo_b", "password", "19"], ["abcd", "abcdefg9", "12"]].map(([u, p, a]) => {
      const out = [];
      if (!(u.length >= 4 && u.length <= 12 && /^[A-Za-z0-9]+$/.test(u))) out.push("Bad username");
      if (!(p.length >= 8 && /[0-9]/.test(p))) out.push("Bad password");
      if (!(isDigits(a) && Number(a) >= 13 && Number(a) <= 19)) out.push("Bad age");
      return t(lines(u, p, a), out.length ? out.join("\n") : "Registered");
    }),
    solution: `username = input()
password = input()
age = input()
problems = 0
if not (len(username) >= 4 and len(username) <= 12 and username.isalnum()):
    print("Bad username")
    problems = problems + 1
has_digit = False
for character in password:
    if character.isdigit():
        has_digit = True
if not (len(password) >= 8 and has_digit):
    print("Bad password")
    problems = problems + 1
if not (age.isdigit() and int(age) >= 13 and int(age) <= 19):
    print("Bad age")
    problems = problems + 1
if problems == 0:
    print("Registered")`,
  },
  {
    slug: "gcse-robust-programs-p-s2", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Tidy up a name",
    brief: "Users often type their name with extra spaces or in the wrong case. Input a name and clean it up:\n- remove any spaces at the start and end\n- replace each run of spaces between words with a single space\n- make the first letter of each word a capital and the rest lower case\n\nPrint the cleaned name. If nothing is left after cleaning (the entry was empty or only spaces), print `Invalid` instead.\n\nFor example, `  aNA   maRIA  ` prints `Ana Maria`.",
    starter: "", hints: ["`text.split()` with nothing in the brackets splits on any amount of spaces and throws away the empty pieces.", "For each word use `word.capitalize()`, then join the words back together with `\" \".join(...)`. Check for an empty result before printing."],
    tests: ["  aNA   maRIA  ", "sam", "SAM SMITH", "   ", "", "o'neil  jones", "mary  ann  lee"].map((s) => { const w = s.split(/\s+/).filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()); return t(s, w.length ? w.join(" ") : "Invalid"); }),
    solution: `text = input()
words = text.split()
if len(words) == 0:
    print("Invalid")
else:
    cleaned = []
    for word in words:
        cleaned.append(word.capitalize())
    print(" ".join(cleaned))`,
  },
  {
    slug: "gcse-robust-programs-p-s3", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Find the failing test",
    brief: "A program should accept whole numbers from 1 to 100 and reject all others. A tester ran it with some values and wrote down what the program did.\n\nInput a whole number N. Then, for each of N tests, input the value that was tested, then input the result the program gave (`Accepted` or `Rejected`).\n\nPrint `All tests passed` if the program did the right thing every time. Otherwise print `First failure: ` followed by the value of the **first** test where the program did the wrong thing.\n\nFor example, the test value `100` with the result `Rejected` is a failure, because 100 should have been accepted.",
    starter: "", hints: ["For each test work out what SHOULD have happened (`Accepted` if the value is from 1 to 100, otherwise `Rejected`) and compare it with the result you were given.", "You still need to read every line of input, but only remember the first failing value. A variable that starts as `None` is a good way to do this."],
    tests: [[[50, "Accepted"], [0, "Accepted"], [101, "Rejected"]], [[1, "Accepted"], [100, "Accepted"], [0, "Rejected"], [101, "Rejected"]], [[100, "Rejected"], [0, "Accepted"]], [[5, "Rejected"]], [[7, "Accepted"]]].map((tests) => {
      const fail = tests.find(([v, r]) => (v >= 1 && v <= 100 ? "Accepted" : "Rejected") !== r);
      return t(lines(tests.length, tests.flat()), fail ? `First failure: ${fail[0]}` : "All tests passed");
    }),
    solution: `n = int(input())
first_failure = None
for i in range(n):
    value = int(input())
    result = input()
    if value >= 1 and value <= 100:
        expected = "Accepted"
    else:
        expected = "Rejected"
    if result != expected and first_failure is None:
        first_failure = value
if first_failure is None:
    print("All tests passed")
else:
    print("First failure: " + str(first_failure))`,
  },
  {
    slug: "gcse-robust-programs-p-s4", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Count the entries",
    brief: "A survey asks for a whole number from 1 to 50. Input a whole number N, then N entries (one per line, typed as text).\n\nSort the entries into three groups and print the size of each group on its own line:\n```\nValid: <how many are digits AND from 1 to 50>\nNot numbers: <how many contain anything that is not a digit>\nOut of range: <how many are digits but not from 1 to 50>\n```\nFor example, the entries `7`, `abc`, `0`, `50`, `51` print `Valid: 2`, `Not numbers: 1` and `Out of range: 2`.",
    starter: "", hints: ["Use three counters that all start at 0. For each entry decide which one to add to: check for digits first, then the range.", "An entry that is not all digits must be counted as `Not numbers`, and you must not call `int()` on it."],
    tests: [["7", "abc", "0", "50", "51"], ["1", "2", "3"], ["x", "y"], ["", "00", "-1", "49", "1.5"], ["50"]].map((e) => {
      let v = 0, nn = 0, o = 0;
      for (const x of e) { if (!isDigits(x)) nn++; else if (Number(x) >= 1 && Number(x) <= 50) v++; else o++; }
      return t(lines(e.length, e), `Valid: ${v}\nNot numbers: ${nn}\nOut of range: ${o}`);
    }),
    solution: `n = int(input())
valid = 0
not_numbers = 0
out_of_range = 0
for i in range(n):
    entry = input()
    if not entry.isdigit():
        not_numbers = not_numbers + 1
    elif int(entry) >= 1 and int(entry) <= 50:
        valid = valid + 1
    else:
        out_of_range = out_of_range + 1
print("Valid: " + str(valid))
print("Not numbers: " + str(not_numbers))
print("Out of range: " + str(out_of_range))`,
  },
];
