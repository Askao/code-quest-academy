// A level: Object-oriented programming. OCR H446 1.2.4 (object-oriented
// languages: classes, objects, methods, attributes, inheritance,
// encapsulation, polymorphism) and 2.2.1; AQA 7517 4.1.2.3 (OOP: classes,
// objects, instantiation, encapsulation, inheritance, aggregation,
// composition, polymorphism, overriding, public/private).
export const topic = "oop";

export const lessons = [
  {
    title: "Classes and objects",
    summary: "Defining a class, making objects from it, and giving them attributes and methods.",
    notes: `
**Object-oriented programming (OOP)** builds a program out of **objects**: bundles of data together with the code that works on that data.

- A **class** is a blueprint. It says what data each object will hold and what it can do.
- An **object** is one thing made from that blueprint. Making one is called **instantiation**, and the object is an **instance** of the class.
- An object's data are its **attributes**. The subroutines that belong to it are its **methods**.

\`\`\`python
class Dog:
    def __init__(self, name, age):   # the constructor
        self.name = name             # attributes
        self.age = age

    def describe(self):              # a method
        return self.name + " is " + str(self.age)

rex = Dog("Rex", 3)                  # instantiation
print(rex.describe())                # Rex is 3
\`\`\`

---

- \`__init__\` is the **constructor**. It runs automatically when an object is made, and sets up its attributes.
- \`self\` means "this object". Every method gets it as its first parameter, and \`self.name\` is *this* dog's name.
- Each object has its own copy of the attributes, so \`Dog("Rex", 3)\` and \`Dog("Bella", 7)\` don't interfere with each other.

You call a method with a dot: \`rex.describe()\`. Python passes \`rex\` in as \`self\` for you.
`,
    worked_example: `class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

small = Rectangle(2, 3)
big = Rectangle(10, 4)
print(small.area())
print(big.area())`,
    worked_example_note:
      "Both objects use the same area method, but self is a different rectangle each time, so each call uses its own width and height.",
    quiz: [
      {
        question: "What is the difference between a class and an object?",
        options: [
          "A class is a blueprint; an object is one thing made from it",
          "A class is a variable; an object is a function",
          "They mean the same thing",
          "An object is a blueprint; a class is made from it",
        ],
        answer: "A class is a blueprint; an object is one thing made from it",
        explanation: "The class describes the attributes and methods. Each object (instance) made from it has its own values for those attributes.",
      },
      {
        question: "What does the constructor __init__ do?",
        options: [
          "Runs when an object is made, setting up its attributes",
          "Deletes an object",
          "Prints an object",
          "Runs only when a method is called",
        ],
        answer: "Runs when an object is made, setting up its attributes",
        explanation: "Dog(\"Rex\", 3) calls __init__ straight away, which is where self.name and self.age get their values.",
      },
      {
        question: "Inside a method, what does self refer to?",
        options: [
          "The object the method was called on",
          "The class itself",
          "The first argument the caller typed",
          "The program's global variables",
        ],
        answer: "The object the method was called on",
        explanation: "In rex.describe(), self is rex, so self.name is Rex's name.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "A Dog class",
        brief: `
Write a class \`Dog\` with:
- a constructor that takes \`name\` and \`age\` and stores them as attributes;
- a method \`describe()\` that returns \`<name> is <age> years old\`.

Then input a name and an age (a whole number), one per line. Make a \`Dog\` object from them and print what its \`describe()\` method returns.

For example, Rex and 3 prints \`Rex is 3 years old\`.`,
        starter: "class Dog:\n    def __init__(self, name, age):\n        pass\n\n    def describe(self):\n        pass\n",
        hints: [
          "In the constructor, store each parameter on the object: self.name = name.",
          "describe can return self.name + \" is \" + str(self.age) + \" years old\".",
        ],
        solution: `class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def describe(self):
        return self.name + " is " + str(self.age) + " years old"

dog = Dog(input(), int(input()))
print(dog.describe())`,
        inputs: ["Rex\n3", "Bella\n11", "Pip\n1"],
      },
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Rectangle methods",
        brief: `
Write a class \`Rectangle\` whose constructor takes \`width\` and \`height\`, with two methods:
- \`area()\` returns width × height;
- \`perimeter()\` returns the distance all the way round.

Input a width and a height (whole numbers, one per line). Make a \`Rectangle\` and print its area on one line and its perimeter on the next.

For example, 3 and 4 prints \`12\` then \`14\`.`,
        starter: "class Rectangle:\n    pass\n",
        hints: [
          "The perimeter is 2 × (width + height).",
          "Both methods need self so they can use self.width and self.height.",
        ],
        solution: `class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

r = Rectangle(int(input()), int(input()))
print(r.area())
print(r.perimeter())`,
        inputs: ["3\n4", "5\n5", "1\n10"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "A bank account object",
        brief: `
Write a class \`BankAccount\`. Its constructor takes the owner's name and sets the balance to 0. It has two methods:
- \`deposit(amount)\` adds to the balance;
- \`withdraw(amount)\` takes away from the balance, unless that would take it below 0. Then it changes nothing and returns \`False\`. Otherwise it returns \`True\`.

Input the owner's name. Then read commands, one per line, until \`end\`: each is \`deposit\` or \`withdraw\` and a whole number, such as \`deposit 50\`. Print \`Refused\` whenever a withdrawal is refused.

Finally print the owner's name, a colon, a space and the balance. For example, Ada, deposit 50, withdraw 80, end prints \`Refused\` then \`Ada: 50\`.`,
        starter: "class BankAccount:\n    pass\n",
        hints: [
          "The constructor sets self.owner = owner and self.balance = 0.",
          "In the main loop, check what withdraw returns: if not account.withdraw(n): print(\"Refused\").",
        ],
        solution: `class BankAccount:
    def __init__(self, owner):
        self.owner = owner
        self.balance = 0

    def deposit(self, amount):
        self.balance = self.balance + amount

    def withdraw(self, amount):
        if amount > self.balance:
            return False
        self.balance = self.balance - amount
        return True

account = BankAccount(input())
line = input()
while line != "end":
    word, number = line.split()
    if word == "deposit":
        account.deposit(int(number))
    elif not account.withdraw(int(number)):
        print("Refused")
    line = input()
print(account.owner + ": " + str(account.balance))`,
        inputs: ["Ada\ndeposit 50\nwithdraw 80\nend", "Sam\ndeposit 20\nwithdraw 5\nwithdraw 15\nend", "Li\nwithdraw 1\nend"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "A list of objects",
        brief: `
Write a class \`Student\` whose constructor takes a \`name\` and a \`mark\`, with a method \`passed()\` that returns \`True\` when the mark is 40 or more.

Input a whole number \`n\`, then \`n\` lines, each a name and a mark separated by a space. Make a \`Student\` object for each one and keep them all in a list. Then print:
- \`Passed: \` followed by how many students passed (use the method);
- \`Top: \` followed by the name of the student with the highest mark (if two tie, the first one input).

For example, Ada 72, Sam 35, Li 60 prints \`Passed: 2\` then \`Top: Ada\`.`,
        starter: "class Student:\n    pass\n",
        hints: [
          "Append each new object to a list: students.append(Student(name, int(mark))).",
          "To find the top student, keep the best object so far and replace it only when another student's mark is strictly higher.",
        ],
        solution: `class Student:
    def __init__(self, name, mark):
        self.name = name
        self.mark = mark

    def passed(self):
        return self.mark >= 40

students = []
for i in range(int(input())):
    name, mark = input().split()
    students.append(Student(name, int(mark)))
count = 0
top = students[0]
for s in students:
    if s.passed():
        count = count + 1
    if s.mark > top.mark:
        top = s
print("Passed: " + str(count))
print("Top: " + top.name)`,
        inputs: ["3\nAda 72\nSam 35\nLi 60", "1\nJo 10", "4\nA 50\nB 80\nC 80\nD 39"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "A clock object",
        brief: `
Write a class \`Clock\` that stores a time of day as hours and minutes (a 24-hour clock). It has:
- a constructor taking \`hours\` and \`minutes\`;
- a method \`add_minutes(n)\` that moves the time forward by \`n\` minutes, going past midnight correctly (23:50 plus 20 minutes is 00:10);
- a method \`show()\` that returns the time as \`HH:MM\`, with two digits each (\`07:05\`, not \`7:5\`).

Input a time as \`HH:MM\`, then a whole number of minutes to add. Print the time before, then the time after, using \`show()\`.

For example, \`23:50\` and \`20\` prints \`23:50\` then \`00:10\`.`,
        starter: "",
        hints: [
          "It's easiest to work in total minutes: total = hours * 60 + minutes, add n, then take % (24 * 60).",
          "f\"{h:02d}:{m:02d}\" writes each number with two digits.",
        ],
        solution: `class Clock:
    def __init__(self, hours, minutes):
        self.hours = hours
        self.minutes = minutes

    def add_minutes(self, n):
        total = (self.hours * 60 + self.minutes + n) % (24 * 60)
        self.hours = total // 60
        self.minutes = total % 60

    def show(self):
        return f"{self.hours:02d}:{self.minutes:02d}"

h, m = input().split(":")
clock = Clock(int(h), int(m))
print(clock.show())
clock.add_minutes(int(input()))
print(clock.show())`,
        inputs: ["23:50\n20", "07:05\n0", "12:00\n1500", "00:00\n59"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "A Book class",
        brief: `
Write a class \`Book\` whose constructor takes a \`title\` and a number of \`pages\`, with a method \`is_long()\` that returns \`True\` when the book has more than 300 pages.

Input a title and a number of pages, one per line. Make a \`Book\` and print \`<title> is long\` or \`<title> is short\` using the method.`,
        starter: "class Book:\n    pass\n",
        hints: [
          "Store both values in the constructor: self.title = title, self.pages = pages.",
          "is_long can simply return self.pages > 300.",
        ],
        solution: `class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

    def is_long(self):
        return self.pages > 300

book = Book(input(), int(input()))
if book.is_long():
    print(book.title + " is long")
else:
    print(book.title + " is short")`,
        inputs: ["Dune\n412", "Holes\n233", "Exactly\n300"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 25,
        title: "Two separate counters",
        brief: `
Write a class \`Counter\` with an attribute \`value\` that starts at 0, and a method \`click()\` that adds 1 to it.

Make **two** counters, \`a\` and \`b\`. Then read a line of letters, such as \`aabab\`: for each \`a\`, click counter \`a\`; for each \`b\`, click counter \`b\`. Print \`a: \` and \`b: \` with each counter's value, on two lines.

This shows that each object keeps its own attributes.`,
        starter: "class Counter:\n    pass\n",
        hints: [
          "The constructor only needs self.value = 0.",
          "Loop over the characters of the line: for ch in input(): and click the matching counter.",
        ],
        solution: `class Counter:
    def __init__(self):
        self.value = 0

    def click(self):
        self.value = self.value + 1

a = Counter()
b = Counter()
for ch in input():
    if ch == "a":
        a.click()
    elif ch == "b":
        b.click()
print("a: " + str(a.value))
print("b: " + str(b.value))`,
        inputs: ["aabab", "bbbb", "a"],
      },
    ],
  },
  {
    title: "Encapsulation",
    summary: "Keeping an object's data private, and only changing it through methods that check it.",
    notes: `
**Encapsulation** means an object's data is kept inside it, and other code changes it only by calling the object's methods. Those methods can then check every change, so the object can never get into a nonsense state, like a negative balance or a mark of 250.

- **Private** attributes and methods can only be used inside the class.
- **Public** ones can be used from anywhere.

In OCR and AQA pseudocode you write \`private\` and \`public\`. In Python, an attribute whose name starts with **two underscores** is treated as private: code outside the class can't reach it by that name.

\`\`\`python
class Account:
    def __init__(self):
        self.__balance = 0          # private

    def get_balance(self):          # a "getter"
        return self.__balance

    def deposit(self, amount):      # changes go through a method
        if amount > 0:
            self.__balance += amount

acc = Account()
acc.deposit(50)
print(acc.get_balance())            # 50
print(acc.__balance)                # error: no attribute __balance
\`\`\`

---

A method that returns a private attribute is a **getter**; one that changes it (after checking the new value) is a **setter**. The rest of the program doesn't need to know how the data is stored, only which methods to call. That means the class can change how it works inside without breaking the code that uses it.
`,
    worked_example: `class Thermostat:
    def __init__(self):
        self.__target = 20

    def set_target(self, value):
        if 10 <= value <= 30:
            self.__target = value
        else:
            print("Out of range")

    def get_target(self):
        return self.__target

t = Thermostat()
t.set_target(45)
t.set_target(22)
print(t.get_target())`,
    worked_example_note:
      "The only way to change __target is set_target, which refuses 45, so the thermostat can never be set to a dangerous value.",
    quiz: [
      {
        question: "What is encapsulation?",
        options: [
          "Keeping an object's data inside it, changed only through its methods",
          "Making one class from another",
          "Giving two classes a method with the same name",
          "Storing objects in a list",
        ],
        answer: "Keeping an object's data inside it, changed only through its methods",
        explanation: "Encapsulation hides the data, so every change goes through methods that can check it.",
      },
      {
        question: "In Python, how do you make an attribute private?",
        options: [
          "Start its name with two underscores, like self.__balance",
          "Write private before it",
          "Put it outside the class",
          "Write it in capital letters",
        ],
        answer: "Start its name with two underscores, like self.__balance",
        explanation: "Python has no private keyword. A double-underscore name can't be reached by that name from outside the class.",
      },
      {
        question: "Why use a setter method instead of letting code change an attribute directly?",
        options: [
          "The setter can check the new value before accepting it",
          "Setters run faster",
          "Attributes can't be changed any other way in any language",
          "It stops the object being printed",
        ],
        answer: "The setter can check the new value before accepting it",
        explanation: "A setter is the one place a value changes, so it can refuse bad values and keep the object valid.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "A private balance",
        brief: `
Write a class \`Account\` that keeps its balance in a **private** attribute \`__balance\`, starting at 0. Give it:
- \`deposit(amount)\`, which adds \`amount\` only if it is more than 0, and otherwise prints \`Invalid amount\`;
- \`get_balance()\`, which returns the balance.

Input a line of whole numbers separated by spaces. Deposit each one in turn, then print the balance using \`get_balance()\`.

For example, \`10 -5 20\` prints \`Invalid amount\` then \`30\`.`,
        starter: "class Account:\n    pass\n",
        hints: [
          "In the constructor: self.__balance = 0.",
          "Loop with for n in input().split(): and call acc.deposit(int(n)).",
        ],
        solution: `class Account:
    def __init__(self):
        self.__balance = 0

    def deposit(self, amount):
        if amount > 0:
            self.__balance = self.__balance + amount
        else:
            print("Invalid amount")

    def get_balance(self):
        return self.__balance

acc = Account()
for n in input().split():
    acc.deposit(int(n))
print(acc.get_balance())`,
        inputs: ["10 -5 20", "100", "0 0 3"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "A setter that checks",
        brief: `
Write a class \`Student\` with a private attribute \`__mark\`, starting at 0, and two methods:
- \`set_mark(m)\` stores \`m\` only if it is from 0 to 100. Otherwise it prints \`Mark must be 0 to 100\` and keeps the old mark;
- \`get_mark()\` returns the mark.

Input a whole number \`n\`, then \`n\` marks, one per line. After trying to set each one, print the mark using \`get_mark()\`.

For example, 2, 55, 140 prints \`55\`, then \`Mark must be 0 to 100\`, then \`55\`.`,
        starter: "class Student:\n    pass\n",
        hints: [
          "set_mark checks 0 <= m <= 100 before changing self.__mark.",
          "Print s.get_mark() inside the loop, after each call to set_mark.",
        ],
        solution: `class Student:
    def __init__(self):
        self.__mark = 0

    def set_mark(self, m):
        if 0 <= m <= 100:
            self.__mark = m
        else:
            print("Mark must be 0 to 100")

    def get_mark(self):
        return self.__mark

s = Student()
for i in range(int(input())):
    s.set_mark(int(input()))
    print(s.get_mark())`,
        inputs: ["2\n55\n140", "3\n-1\n100\n0", "1\n42"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "A password object",
        brief: `
Write a class \`Password\` that keeps the password in a private attribute. Its constructor takes the first password. It has:
- \`check(attempt)\`, which returns \`True\` if \`attempt\` matches;
- \`change(old, new)\`, which changes the password only if \`old\` is correct **and** \`new\` is at least 8 characters long. It returns \`True\` if it changed the password and \`False\` if not.

Input the first password. Then read commands until \`end\`:
- \`check <word>\` prints \`Correct\` or \`Wrong\`;
- \`change <old> <new>\` prints \`Changed\` or \`Not changed\`.`,
        starter: "class Password:\n    pass\n",
        hints: [
          "change should test self.check(old) and len(new) >= 8 together.",
          "Split each command with .split(); a change command has three parts, a check command has two.",
        ],
        solution: `class Password:
    def __init__(self, first):
        self.__password = first

    def check(self, attempt):
        return attempt == self.__password

    def change(self, old, new):
        if self.check(old) and len(new) >= 8:
            self.__password = new
            return True
        return False

p = Password(input())
line = input()
while line != "end":
    parts = line.split()
    if parts[0] == "check":
        print("Correct" if p.check(parts[1]) else "Wrong")
    else:
        print("Changed" if p.change(parts[1], parts[2]) else "Not changed")
    line = input()`,
        inputs: [
          "secret12\ncheck secret12\nchange secret12 short\nchange secret12 longerpass\ncheck secret12\ncheck longerpass\nend",
          "abc\ncheck ABC\nend",
          "first\nchange wrong newpassword\nchange first newpassword\nend",
        ],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Stored one way, shown another",
        brief: `
Encapsulation lets a class store data however it likes inside. Write a class \`Temperature\` that stores a temperature privately **in Celsius**, with:
- \`set_celsius(c)\`, which refuses anything below -273.15 (absolute zero) by printing \`Below absolute zero\` and keeping the old value;
- \`get_celsius()\`;
- \`get_fahrenheit()\`, which works out the Fahrenheit value from the stored Celsius: F = C × 9 / 5 + 32.

The temperature starts at 0. Input a decimal number, try to set it, then print the Celsius and Fahrenheit values on two lines, each rounded to 1 decimal place.

For example, \`100\` prints \`100.0\` then \`212.0\`.`,
        starter: "class Temperature:\n    pass\n",
        hints: [
          "Only Celsius is stored. get_fahrenheit calculates from it every time it is called.",
          "Print round(t.get_celsius(), 1) and round(t.get_fahrenheit(), 1).",
        ],
        solution: `class Temperature:
    def __init__(self):
        self.__celsius = 0.0

    def set_celsius(self, c):
        if c < -273.15:
            print("Below absolute zero")
        else:
            self.__celsius = c

    def get_celsius(self):
        return self.__celsius

    def get_fahrenheit(self):
        return self.__celsius * 9 / 5 + 32

t = Temperature()
t.set_celsius(float(input()))
print(round(t.get_celsius(), 1))
print(round(t.get_fahrenheit(), 1))`,
        inputs: ["100", "-40", "-300", "37.5"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Stock control",
        brief: `
Write a class \`StockItem\` with a private name and a private quantity. Its constructor takes the name and the starting quantity. It has:
- \`sell(n)\`: if there are at least \`n\` in stock, reduce the quantity and print \`Sold <n>\`. Otherwise print \`Only <quantity> left\` and change nothing;
- \`restock(n)\`: add \`n\` to the quantity;
- \`report()\`: return \`<name>: <quantity>\`.

Input the item's name and starting quantity, one per line. Then read commands until \`end\`, each \`sell <n>\` or \`restock <n>\`. After \`end\`, print \`report()\`.`,
        starter: "",
        hints: [
          "Keep self.__name and self.__quantity private, and use them only inside the methods.",
          "sell compares n with self.__quantity before changing anything.",
        ],
        solution: `class StockItem:
    def __init__(self, name, quantity):
        self.__name = name
        self.__quantity = quantity

    def sell(self, n):
        if n <= self.__quantity:
            self.__quantity = self.__quantity - n
            print("Sold " + str(n))
        else:
            print("Only " + str(self.__quantity) + " left")

    def restock(self, n):
        self.__quantity = self.__quantity + n

    def report(self):
        return self.__name + ": " + str(self.__quantity)

item = StockItem(input(), int(input()))
line = input()
while line != "end":
    word, n = line.split()
    if word == "sell":
        item.sell(int(n))
    else:
        item.restock(int(n))
    line = input()
print(item.report())`,
        inputs: ["Pens\n10\nsell 4\nsell 7\nrestock 5\nsell 7\nend", "Pads\n0\nsell 1\nend", "Glue\n3\nrestock 2\nend"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "A private score",
        brief: `
Write a class \`Player\` with a private \`__score\` starting at 0, a method \`add_points(p)\` that only accepts points from 1 to 10 (anything else prints \`Not allowed\`), and a getter \`get_score()\`.

Input a line of whole numbers separated by spaces. Add each one, then print the score.`,
        starter: "class Player:\n    pass\n",
        hints: [
          "Check 1 <= p <= 10 inside add_points before changing self.__score.",
          "Use get_score() for the final print.",
        ],
        solution: `class Player:
    def __init__(self):
        self.__score = 0

    def add_points(self, p):
        if 1 <= p <= 10:
            self.__score = self.__score + p
        else:
            print("Not allowed")

    def get_score(self):
        return self.__score

player = Player()
for n in input().split():
    player.add_points(int(n))
print(player.get_score())`,
        inputs: ["5 10 11", "0", "1 2 3"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "A volume knob",
        brief: `
Write a class \`Speaker\` with a private volume from 0 to 10, starting at 5. It has \`louder()\` and \`quieter()\`, which change the volume by 1 but never go above 10 or below 0, and \`get_volume()\`.

Input a line of \`+\` and \`-\` characters, such as \`++-+\`. Call \`louder()\` for each \`+\` and \`quieter()\` for each \`-\`, then print the volume.`,
        starter: "class Speaker:\n    pass\n",
        hints: [
          "louder only adds 1 if the volume is below 10.",
          "Loop over the characters of the input line.",
        ],
        solution: `class Speaker:
    def __init__(self):
        self.__volume = 5

    def louder(self):
        if self.__volume < 10:
            self.__volume = self.__volume + 1

    def quieter(self):
        if self.__volume > 0:
            self.__volume = self.__volume - 1

    def get_volume(self):
        return self.__volume

s = Speaker()
for ch in input():
    if ch == "+":
        s.louder()
    elif ch == "-":
        s.quieter()
print(s.get_volume())`,
        inputs: ["++-+", "++++++++++", "-------", "+-"],
      },
    ],
  },
  {
    title: "Inheritance and overriding",
    summary: "Making a new class from an existing one, and changing the methods it inherits.",
    notes: `
**Inheritance** lets a new class take on all the attributes and methods of an existing one, and then add its own. The existing class is the **parent** (also called the superclass or base class); the new one is the **child** (subclass or derived class).

\`\`\`python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):            # Dog inherits from Animal
    def speak(self):          # overriding
        return "Woof"

d = Dog("Rex")
print(d.name, d.speak())      # Rex Woof
\`\`\`

\`Dog\` has no constructor of its own, so it uses \`Animal\`'s, and \`d.name\` works. Inheritance is an **"is a"** relationship: a dog *is an* animal.

---

**Overriding** means a child class gives its own version of a method the parent already has. When \`speak()\` is called on a \`Dog\`, Python uses \`Dog\`'s version.

If the child needs the parent's version too, call it with \`super()\`. This is common in constructors, so the parent sets up its attributes and the child only adds the new ones:

\`\`\`python
class Puppy(Dog):
    def __init__(self, name, weeks):
        super().__init__(name)    # Animal sets self.name
        self.weeks = weeks
\`\`\`

Inheritance avoids writing the same code twice: anything shared goes in the parent once.
`,
    worked_example: `class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def monthly_pay(self):
        return self.salary / 12

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        super().__init__(name, salary)
        self.bonus = bonus

    def monthly_pay(self):
        return super().monthly_pay() + self.bonus / 12

m = Manager("Ada", 36000, 6000)
print(m.name, m.monthly_pay())`,
    worked_example_note:
      "Manager's constructor lets Employee store name and salary, then adds bonus. Its monthly_pay overrides the parent's but still uses it through super().",
    quiz: [
      {
        question: "class Car(Vehicle): — which statement is true?",
        options: [
          "Car inherits Vehicle's attributes and methods",
          "Vehicle inherits Car's attributes and methods",
          "Car and Vehicle are unrelated",
          "Car can only use methods it defines itself",
        ],
        answer: "Car inherits Vehicle's attributes and methods",
        explanation: "The class in brackets is the parent. Car gets everything Vehicle has, and can add or override methods.",
      },
      {
        question: "What is overriding?",
        options: [
          "A child class giving its own version of a method its parent has",
          "Calling a method twice",
          "Deleting a parent's method",
          "Making an attribute private",
        ],
        answer: "A child class giving its own version of a method its parent has",
        explanation: "When the method is called on the child, the child's version runs instead of the parent's.",
      },
      {
        question: "What does super().__init__(name) do inside a child's constructor?",
        options: [
          "Runs the parent's constructor, so it can set up its attributes",
          "Makes a new parent object",
          "Stops the parent's constructor from running",
          "Copies the child into the parent",
        ],
        answer: "Runs the parent's constructor, so it can set up its attributes",
        explanation: "super() reaches the parent class, so the shared set-up code isn't written twice.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Animals that speak",
        brief: `
Write a class \`Animal\` with a method \`speak()\` that returns \`...\`.

Write two child classes of \`Animal\`: \`Dog\`, whose \`speak()\` returns \`Woof\`, and \`Cat\`, whose \`speak()\` returns \`Meow\`.

Input a word. If it is \`dog\`, make a \`Dog\`; if it is \`cat\`, make a \`Cat\`; otherwise make a plain \`Animal\`. Print what the object's \`speak()\` returns.`,
        starter: "class Animal:\n    def speak(self):\n        return \"...\"\n",
        hints: [
          "class Dog(Animal): makes Dog a child of Animal.",
          "Each child class only needs its own speak method.",
        ],
        solution: `class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "Woof"

class Cat(Animal):
    def speak(self):
        return "Meow"

word = input()
if word == "dog":
    pet = Dog()
elif word == "cat":
    pet = Cat()
else:
    pet = Animal()
print(pet.speak())`,
        inputs: ["dog", "cat", "fish"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Managers get a bonus",
        brief: `
Write a class \`Employee\` whose constructor takes a \`name\` and a yearly \`salary\`, with a method \`monthly_pay()\` returning salary ÷ 12.

Write a child class \`Manager\` whose constructor also takes a yearly \`bonus\`. Use \`super().__init__\` to set the name and salary. Override \`monthly_pay()\` so it returns the employee's monthly pay plus bonus ÷ 12, using \`super().monthly_pay()\`.

Input the word \`employee\` or \`manager\`, then a name, then a salary, and (for a manager only) a bonus, one per line. Print the name, a colon, a space and the monthly pay rounded to 2 decimal places.

For example, manager, Ada, 36000, 6000 prints \`Ada: 3500.0\`.`,
        starter: "",
        hints: [
          "In Manager.__init__, the first line is super().__init__(name, salary), then self.bonus = bonus.",
          "Manager.monthly_pay returns super().monthly_pay() + self.bonus / 12.",
        ],
        solution: `class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def monthly_pay(self):
        return self.salary / 12

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        super().__init__(name, salary)
        self.bonus = bonus

    def monthly_pay(self):
        return super().monthly_pay() + self.bonus / 12

kind = input()
name = input()
salary = int(input())
if kind == "manager":
    person = Manager(name, salary, int(input()))
else:
    person = Employee(name, salary)
print(person.name + ": " + str(round(person.monthly_pay(), 2)))`,
        inputs: ["manager\nAda\n36000\n6000", "employee\nSam\n25000", "manager\nLi\n30000\n0"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Shapes with their own area",
        brief: `
Write a class \`Shape\` with a method \`area()\` that returns 0, and two child classes that override it:
- \`Square\`, whose constructor takes a side length;
- \`Circle\`, whose constructor takes a radius. Use \`3.14159\` for π.

Read lines until \`end\`. Each line is \`square\` or \`circle\` followed by a number, such as \`circle 2\`. Make the right kind of object and print its area rounded to 2 decimal places.

For example, \`square 3\` prints \`9\` and \`circle 2\` prints \`12.57\`.`,
        starter: "",
        hints: [
          "Each child class stores its own measurement in its constructor and overrides area.",
          "A circle's area is π × radius × radius.",
        ],
        solution: `class Shape:
    def area(self):
        return 0

class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side * self.side

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius * self.radius

line = input()
while line != "end":
    kind, size = line.split()
    shape = Square(float(size)) if kind == "square" else Circle(float(size))
    print(round(shape.area(), 2))
    line = input()`,
        inputs: ["square 3\ncircle 2\nend", "circle 1\nend", "square 2.5\nsquare 10\nend"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Bridge tolls",
        brief: `
A bridge charges by vehicle. Write a class \`Vehicle\` whose constructor takes a registration, with a method \`toll()\` that returns 5. Write a child class \`Lorry\` whose constructor also takes a number of axles (use \`super().__init__\` for the registration). A lorry's toll is 12, plus 2 for every axle over 2.

Input a whole number \`n\`, then \`n\` lines. Each line is either \`car <reg>\` or \`lorry <reg> <axles>\`. For each one print \`<reg>: <toll>\`. Finally print \`Total: \` followed by the total of all the tolls.

For example, \`car AB12\` and \`lorry XY34 4\` print \`AB12: 5\`, \`XY34: 16\`, \`Total: 21\`.`,
        starter: "",
        hints: [
          "Lorry.toll returns 12 + 2 * (self.axles - 2), but never less than 12: use max(0, self.axles - 2).",
          "Keep all the objects in a list, or add each toll to a running total as you go.",
        ],
        solution: `class Vehicle:
    def __init__(self, reg):
        self.reg = reg

    def toll(self):
        return 5

class Lorry(Vehicle):
    def __init__(self, reg, axles):
        super().__init__(reg)
        self.axles = axles

    def toll(self):
        return 12 + 2 * max(0, self.axles - 2)

total = 0
for i in range(int(input())):
    parts = input().split()
    v = Lorry(parts[1], int(parts[2])) if parts[0] == "lorry" else Vehicle(parts[1])
    print(v.reg + ": " + str(v.toll()))
    total = total + v.toll()
print("Total: " + str(total))`,
        inputs: ["2\ncar AB12\nlorry XY34 4", "1\nlorry BIG1 2", "3\ncar A1\ncar B2\nlorry C3 6"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Two kinds of account",
        brief: `
Write a class \`Account\` with a balance starting at 0, \`deposit(amount)\`, and \`withdraw(amount)\` that refuses (returns \`False\`) if the balance would go below 0, otherwise takes the money and returns \`True\`.

Write two child classes that override \`withdraw\`:
- \`Savings\`: allows at most 2 successful withdrawals in total. After that, every withdrawal is refused, even if there is money. (A refused withdrawal doesn't count towards the 2.)
- \`Current\`: allows an overdraft, so the balance can go down to -100 but no lower.

Input the account type (\`savings\` or \`current\`). Then read commands until \`end\`, each \`deposit <n>\` or \`withdraw <n>\`. Print \`Refused\` for each refused withdrawal, and finally print \`Balance: \` and the balance.`,
        starter: "",
        hints: [
          "Savings needs its own counter of withdrawals, set up in its constructor after super().__init__().",
          "Savings can call super().withdraw(amount) once it knows the limit isn't reached, so the 'no going below 0' rule isn't written twice.",
        ],
        solution: `class Account:
    def __init__(self):
        self.balance = 0

    def deposit(self, amount):
        self.balance = self.balance + amount

    def withdraw(self, amount):
        if self.balance - amount < 0:
            return False
        self.balance = self.balance - amount
        return True

class Savings(Account):
    def __init__(self):
        super().__init__()
        self.withdrawals = 0

    def withdraw(self, amount):
        if self.withdrawals >= 2:
            return False
        if super().withdraw(amount):
            self.withdrawals = self.withdrawals + 1
            return True
        return False

class Current(Account):
    def withdraw(self, amount):
        if self.balance - amount < -100:
            return False
        self.balance = self.balance - amount
        return True

account = Savings() if input() == "savings" else Current()
line = input()
while line != "end":
    word, n = line.split()
    if word == "deposit":
        account.deposit(int(n))
    elif not account.withdraw(int(n)):
        print("Refused")
    line = input()
print("Balance: " + str(account.balance))`,
        inputs: [
          "savings\ndeposit 100\nwithdraw 10\nwithdraw 10\nwithdraw 10\nend",
          "current\nwithdraw 60\nwithdraw 50\nwithdraw 40\nend",
          "savings\nwithdraw 5\ndeposit 5\nwithdraw 5\nend",
        ],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Ticket prices",
        brief: `
Write a class \`Ticket\` whose \`price()\` returns 10, and a child class \`ChildTicket\` that overrides \`price()\` to return half the normal price, using \`super().price()\`.

Input a line of ages separated by spaces. Make a \`ChildTicket\` for anyone under 16 and a \`Ticket\` for everyone else, and print the total price.`,
        starter: "",
        hints: [
          "ChildTicket.price returns super().price() / 2.",
          "Add each ticket's price() to a running total.",
        ],
        solution: `class Ticket:
    def price(self):
        return 10

class ChildTicket(Ticket):
    def price(self):
        return super().price() / 2

total = 0
for age in input().split():
    ticket = ChildTicket() if int(age) < 16 else Ticket()
    total = total + ticket.price()
print(total)`,
        inputs: ["10 40", "16 15", "30"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Inherit the constructor",
        brief: `
Write a class \`Person\` whose constructor takes a \`name\`, with a method \`introduce()\` returning \`Hi, I'm <name>\`.

Write a child class \`Pupil\` whose constructor takes a \`name\` and a \`form\` (like 12C), using \`super().__init__(name)\`. Override \`introduce()\` so it returns the parent's introduction followed by \` from <form>\`.

Input a name, then a form, one per line. Make a \`Pupil\` and print its introduction. For example, Ada and 12C prints \`Hi, I'm Ada from 12C\`.`,
        starter: "",
        hints: [
          "Pupil.introduce returns super().introduce() + \" from \" + self.form.",
          "Only the new attribute, form, needs setting in Pupil's constructor after the super() call.",
        ],
        solution: `class Person:
    def __init__(self, name):
        self.name = name

    def introduce(self):
        return "Hi, I'm " + self.name

class Pupil(Person):
    def __init__(self, name, form):
        super().__init__(name)
        self.form = form

    def introduce(self):
        return super().introduce() + " from " + self.form

print(Pupil(input(), input()).introduce())`,
        inputs: ["Ada\n12C", "Sam\n13A", "Li\n12B"],
      },
    ],
  },
  {
    title: "Polymorphism, aggregation and composition",
    summary: "One method name doing the right thing for each class, and objects that contain other objects.",
    notes: `
**Polymorphism** means "many forms": code can call the same method on objects of different classes, and each object runs its own version. The calling code doesn't need to know which class it has.

\`\`\`python
for shape in [Square(2), Circle(1), Square(3)]:
    print(shape.area())     # each shape works out its own area
\`\`\`

Without polymorphism you'd need an \`if\` for every kind of shape. With it, adding a new shape class needs no change to this loop at all.

---

Objects often contain other objects. There are two kinds of **"has a"** relationship:

- **Aggregation**: the parts exist on their own. A \`Team\` has \`Player\`s, but the players were made outside the team and carry on existing if the team is deleted.
- **Composition**: the parts belong to the whole. A \`House\` creates its own \`Room\`s; if the house is destroyed, the rooms go with it.

\`\`\`python
class Team:                      # aggregation
    def __init__(self):
        self.players = []
    def add(self, player):       # player made elsewhere
        self.players.append(player)

class House:                     # composition
    def __init__(self, room_names):
        self.rooms = [Room(n) for n in room_names]   # made here
\`\`\`

Compare these with inheritance, which is an **"is a"** relationship.
`,
    worked_example: `class Guitar:
    def play(self):
        return "Strum"

class Drum:
    def play(self):
        return "Boom"

band = [Guitar(), Drum(), Guitar()]
for instrument in band:
    print(instrument.play())`,
    worked_example_note:
      "The loop calls play() without checking what each instrument is. Each object answers with its own version: that is polymorphism.",
    quiz: [
      {
        question: "What is polymorphism?",
        options: [
          "Calling the same method on different objects, each running its own version",
          "A class containing a list of objects",
          "Keeping attributes private",
          "Making a copy of an object",
        ],
        answer: "Calling the same method on different objects, each running its own version",
        explanation: "shape.area() works for a Square or a Circle; each class decides what area means for it.",
      },
      {
        question: "A Library creates its own Shelf objects, and they are destroyed with it. Which relationship is this?",
        options: ["Composition", "Aggregation", "Inheritance", "Encapsulation"],
        answer: "Composition",
        explanation: "The shelves belong to the library and don't exist without it: composition.",
      },
      {
        question: "A Club has Members who were registered separately and stay registered if the club closes. Which relationship is this?",
        options: ["Aggregation", "Composition", "Inheritance", "Overriding"],
        answer: "Aggregation",
        explanation: "The members exist on their own and are only collected by the club: aggregation.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "The band plays",
        brief: `
Write three classes, \`Guitar\`, \`Drum\` and \`Piano\`, each with a method \`play()\` returning \`Strum\`, \`Boom\` and \`Plink\` respectively.

Input a line of instrument names separated by spaces, such as \`drum piano drum\`. Make an object for each one and put them all in a list. Then loop through the list and print what each object's \`play()\` returns, one per line.`,
        starter: "",
        hints: [
          "A dictionary can turn a name into a class: kinds = {\"guitar\": Guitar, \"drum\": Drum, \"piano\": Piano}, then kinds[name]().",
          "The final loop should just call instrument.play(), with no if statements.",
        ],
        solution: `class Guitar:
    def play(self):
        return "Strum"

class Drum:
    def play(self):
        return "Boom"

class Piano:
    def play(self):
        return "Plink"

kinds = {"guitar": Guitar, "drum": Drum, "piano": Piano}
band = [kinds[name]() for name in input().split()]
for instrument in band:
    print(instrument.play())`,
        inputs: ["drum piano drum", "guitar", "piano guitar drum"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "A team of players",
        brief: `
This is **aggregation**: players are made on their own, then added to a team.

Write a class \`Player\` with a \`name\`, and a class \`Team\` with a \`name\` and an empty list of players. \`Team\` has \`add(player)\` and \`summary()\`, which returns \`<team> has <n> players: <names>\`, with the names separated by \`, \`.

Input the team name, then a whole number \`n\`, then \`n\` player names, one per line. Make each \`Player\`, add it to the team, and print the team's summary.

For example, Red, 2, Ada, Sam prints \`Red has 2 players: Ada, Sam\`.`,
        starter: "",
        hints: [
          "Team.add just appends the player object to self.players.",
          "In summary, build the names with \", \".join(p.name for p in self.players).",
        ],
        solution: `class Player:
    def __init__(self, name):
        self.name = name

class Team:
    def __init__(self, name):
        self.name = name
        self.players = []

    def add(self, player):
        self.players.append(player)

    def summary(self):
        names = ", ".join(p.name for p in self.players)
        return self.name + " has " + str(len(self.players)) + " players: " + names

team = Team(input())
for i in range(int(input())):
    team.add(Player(input()))
print(team.summary())`,
        inputs: ["Red\n2\nAda\nSam", "Blue\n1\nLi", "Gold\n3\nA\nB\nC"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "A library that owns its books",
        brief: `
This is **composition**: the library creates its own \`Book\` objects.

Write a class \`Book\` with a \`title\` and an \`author\`. Write a class \`Library\` with a method \`add_book(title, author)\` that creates the \`Book\` itself and stores it, and a method \`by_author(author)\` that returns a list of the titles by that author, in the order they were added.

Input a whole number \`n\`, then \`n\` lines in the form \`title;author\`, then one author to search for. Print each matching title on its own line, or \`None found\` if there are none.`,
        starter: "",
        hints: [
          "add_book does self.books.append(Book(title, author)): the Book is made inside the library.",
          "Split each line with .split(\";\") to get the title and author.",
        ],
        solution: `class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author

class Library:
    def __init__(self):
        self.books = []

    def add_book(self, title, author):
        self.books.append(Book(title, author))

    def by_author(self, author):
        return [b.title for b in self.books if b.author == author]

library = Library()
for i in range(int(input())):
    title, author = input().split(";")
    library.add_book(title, author)
found = library.by_author(input())
if found:
    for title in found:
        print(title)
else:
    print("None found")`,
        inputs: [
          "3\nEmma;Austen\nDracula;Stoker\nPersuasion;Austen\nAusten",
          "1\nHoles;Sachar\nTolkien",
          "2\nA;X\nB;X\nX",
        ],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Payroll",
        brief: `
A company has two kinds of staff. Write two classes, each with a \`name\` and a method \`pay()\` for one week's pay:
- \`Salaried\`: constructed with a yearly salary; weekly pay is salary ÷ 52.
- \`Hourly\`: constructed with an hourly rate and hours worked; weekly pay is rate × hours.

Read lines until \`end\`, each either \`salaried <name> <salary>\` or \`hourly <name> <rate> <hours>\`. Store all the staff in one list. Then, using polymorphism (just calling \`pay()\` on each object), print each person as \`<name>: <pay>\` and then \`Total: <total>\`, all rounded to 2 decimal places.`,
        starter: "",
        hints: [
          "Both classes have a pay() method, so the printing loop never needs to know which class each object is.",
          "Build the list first, then loop over it to print and add up the total.",
        ],
        solution: `class Salaried:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def pay(self):
        return self.salary / 52

class Hourly:
    def __init__(self, name, rate, hours):
        self.name = name
        self.rate = rate
        self.hours = hours

    def pay(self):
        return self.rate * self.hours

staff = []
line = input()
while line != "end":
    p = line.split()
    if p[0] == "salaried":
        staff.append(Salaried(p[1], float(p[2])))
    else:
        staff.append(Hourly(p[1], float(p[2]), float(p[3])))
    line = input()
total = 0
for person in staff:
    print(person.name + ": " + str(round(person.pay(), 2)))
    total = total + person.pay()
print("Total: " + str(round(total, 2)))`,
        inputs: ["salaried Ann 26000\nhourly Bob 12.5 30\nend", "hourly Cy 10 0\nend", "salaried Di 52000\nsalaried Ed 31200\nend"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Parcel pricing",
        brief: `
A courier prices three kinds of item. Write a parent class \`Item\` with a method \`cost()\` that returns 0, and three child classes that override it:
- \`Letter\`: costs 1.
- \`Parcel\`: constructed with a weight in kg; costs 3 plus 2 for each whole kg over 1 (so 1kg costs 3, 2.5kg costs 5).
- \`FragileParcel\`: a child of \`Parcel\`; costs whatever a parcel of that weight costs, plus 4.

Input a whole number \`n\`, then \`n\` lines: \`letter\`, \`parcel <kg>\` or \`fragile <kg>\`. Print each item's cost and then \`Total: <total>\`.`,
        starter: "",
        hints: [
          "\"Each whole kg over 1\" is int(weight - 1) when the weight is over 1, else 0.",
          "FragileParcel.cost returns super().cost() + 4, so the parcel rule is only written once.",
        ],
        solution: `class Item:
    def cost(self):
        return 0

class Letter(Item):
    def cost(self):
        return 1

class Parcel(Item):
    def __init__(self, weight):
        self.weight = weight

    def cost(self):
        extra = int(self.weight - 1) if self.weight > 1 else 0
        return 3 + 2 * extra

class FragileParcel(Parcel):
    def cost(self):
        return super().cost() + 4

total = 0
for i in range(int(input())):
    p = input().split()
    if p[0] == "letter":
        item = Letter()
    elif p[0] == "parcel":
        item = Parcel(float(p[1]))
    else:
        item = FragileParcel(float(p[1]))
    print(item.cost())
    total = total + item.cost()
print("Total: " + str(total))`,
        inputs: ["3\nletter\nparcel 2.5\nfragile 1", "1\nparcel 0.4", "2\nfragile 3\nletter"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Greetings in many languages",
        brief: `
Write three classes, \`English\`, \`French\` and \`Spanish\`, each with a method \`greet(name)\` returning \`Hello <name>\`, \`Bonjour <name>\` and \`Hola <name>\`.

Input a name, then a line of language words separated by spaces (\`english\`, \`french\`, \`spanish\`). Make an object for each language and print each one's greeting, one per line, using a single loop that just calls \`greet\`.`,
        starter: "",
        hints: [
          "A dictionary from word to class lets you make each object without a chain of ifs.",
          "Each class's greet uses the name it is given.",
        ],
        solution: `class English:
    def greet(self, name):
        return "Hello " + name

class French:
    def greet(self, name):
        return "Bonjour " + name

class Spanish:
    def greet(self, name):
        return "Hola " + name

name = input()
kinds = {"english": English, "french": French, "spanish": Spanish}
for word in input().split():
    print(kinds[word]().greet(name))`,
        inputs: ["Ada\nfrench english", "Sam\nspanish", "Li\nenglish spanish french"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "A car and its engine",
        brief: `
This is **composition**. Write a class \`Engine\` with a \`running\` attribute (starting \`False\`) and methods \`start()\` and \`stop()\`. Write a class \`Car\` whose constructor creates its own \`Engine\`. \`Car\` has \`drive()\`, which returns \`Driving\` if the engine is running and \`Start the engine first\` if not.

Read commands until \`end\`: \`start\`, \`stop\` or \`drive\`. \`start\` and \`stop\` act on the car's engine; for \`drive\`, print what \`drive()\` returns.`,
        starter: "",
        hints: [
          "In Car.__init__: self.engine = Engine(). The engine is made inside the car.",
          "For a start command, call car.engine.start().",
        ],
        solution: `class Engine:
    def __init__(self):
        self.running = False

    def start(self):
        self.running = True

    def stop(self):
        self.running = False

class Car:
    def __init__(self):
        self.engine = Engine()

    def drive(self):
        return "Driving" if self.engine.running else "Start the engine first"

car = Car()
line = input()
while line != "end":
    if line == "start":
        car.engine.start()
    elif line == "stop":
        car.engine.stop()
    else:
        print(car.drive())
    line = input()`,
        inputs: ["drive\nstart\ndrive\nend", "start\nstop\ndrive\nend", "start\ndrive\ndrive\nend"],
      },
    ],
  },
];
