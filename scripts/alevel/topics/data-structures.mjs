// A level: Data structures. OCR H446 1.4.2 (stacks, queues, linked lists,
// hash tables) and 2.3.1; AQA 7517 4.2 (queues: linear, circular, priority;
// stacks; hash tables; dictionaries) and 4.3.3 (reverse Polish).
export const topic = "data-structures";

export const lessons = [
  {
    title: "Stacks",
    summary: "Last in, first out: push, pop and peek, and what stacks are used for.",
    notes: `
A **stack** is a **last in, first out (LIFO)** structure: the last item added is the first one taken off, like a pile of plates.

Its operations:
- **push(item)**: add an item to the top;
- **pop()**: remove and return the top item;
- **peek()** (or top): return the top item without removing it;
- **is_empty()**, and, for a stack with a fixed size, **is_full()**.

Popping an empty stack is a **stack underflow**; pushing onto a full one is a **stack overflow**.

---

In an exam, a stack is often an **array** with a **top pointer** holding the position of the top item (-1 when empty):

\`\`\`python
class Stack:
    def __init__(self, size):
        self.items = [None] * size
        self.top = -1

    def push(self, item):
        if self.top == len(self.items) - 1:
            return False               # full: overflow
        self.top += 1
        self.items[self.top] = item
        return True

    def pop(self):
        if self.top == -1:
            return None                # empty: underflow
        item = self.items[self.top]
        self.top -= 1
        return item
\`\`\`

Stacks are used for undo in editors, the back button in a browser, the call stack, checking brackets match, and evaluating expressions in **reverse Polish notation** (\`3 4 +\` means 3 + 4).
`,
    worked_example: `stack = []
for word in ["one", "two", "three"]:
    stack.append(word)       # push
print(stack.pop())           # pop
print(stack[-1])             # peek`,
    worked_example_note:
      "A Python list makes a quick stack: append pushes onto the end and pop takes from the end, so the end of the list is the top.",
    quiz: [
      {
        question: "Push A, push B, push C, pop, push D, pop. Which item is now on top?",
        options: ["B", "A", "C", "D"],
        answer: "B",
        explanation: "After the pushes the stack is A B C; pop removes C, push D gives A B D, pop removes D, leaving B on top.",
      },
      {
        question: "What is a stack underflow?",
        options: [
          "Trying to pop from an empty stack",
          "Trying to push onto a full stack",
          "A stack with one item",
          "Peeking at the top item",
        ],
        answer: "Trying to pop from an empty stack",
        explanation: "Underflow is removing from an empty stack; overflow is adding to a full one.",
      },
      {
        question: "In an array-based stack, what does the top pointer hold when the stack is empty?",
        options: ["-1", "0", "The array's length", "None of the above"],
        answer: "-1",
        explanation: "The top pointer is the position of the top item, so with no items it is -1. The first push moves it to 0.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Push, pop and peek",
        brief: `
Write a class \`Stack\` that stores items in a list, with \`push(item)\`, \`pop()\`, \`peek()\` and \`is_empty()\`. \`pop\` and \`peek\` should return \`None\` if the stack is empty.

Read commands until \`end\`:
- \`push <word>\` pushes the word;
- \`pop\` prints the item it removes, or \`Empty\`;
- \`peek\` prints the top item, or \`Empty\`.`,
        starter: "class Stack:\n    pass\n",
        hints: [
          "Use self.items = [] in the constructor; the end of the list is the top.",
          "pop and peek should check is_empty() first and return None if so.",
        ],
        solution: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if self.is_empty():
            return None
        return self.items.pop()

    def peek(self):
        if self.is_empty():
            return None
        return self.items[-1]

    def is_empty(self):
        return len(self.items) == 0

s = Stack()
line = input()
while line != "end":
    if line.startswith("push "):
        s.push(line[5:])
    else:
        result = s.pop() if line == "pop" else s.peek()
        print("Empty" if result is None else result)
    line = input()`,
        inputs: ["push a\npush b\npeek\npop\npop\npop\nend", "pop\nend", "push x\npush y\npush z\npop\npeek\nend"],
      },
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Reverse with a stack",
        brief: `
Input a line of words separated by spaces. Push each word onto a stack, then pop them all off, so they come out in reverse order. Print the words separated by spaces.

Use a list as the stack, with \`append\` and \`pop\` only (no slicing or \`reverse\`). For example, \`to be or not\` prints \`not or be to\`.`,
        starter: "",
        hints: [
          "Push every word first, then pop in a while loop until the stack is empty.",
          "Collect the popped words in a second list and join it at the end.",
        ],
        solution: `stack = []
for word in input().split():
    stack.append(word)
out = []
while stack:
    out.append(stack.pop())
print(" ".join(out))`,
        inputs: ["to be or not", "single", "a b c d e"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Do the brackets match?",
        brief: `
A compiler uses a stack to check that brackets match. Input a line containing any characters, including the brackets \`( ) [ ] { }\`. Print \`Balanced\` if every bracket is closed by the matching kind in the right order, otherwise \`Not balanced\`.

The method: go through the characters. Push each opening bracket. For each closing bracket, the stack must not be empty and the top must be the matching opening bracket; pop it. At the end the stack must be empty.

For example, \`(a[1] + {b})\` is balanced, and \`(]\` is not.`,
        starter: "",
        hints: [
          "A dictionary helps: pairs = {\")\": \"(\", \"]\": \"[\", \"}\": \"{\"}.",
          "Stop as soon as a closing bracket doesn't match: that's already Not balanced.",
        ],
        solution: `pairs = {")": "(", "]": "[", "}": "{"}
stack = []
ok = True
for ch in input():
    if ch in "([{":
        stack.append(ch)
    elif ch in pairs:
        if not stack or stack.pop() != pairs[ch]:
            ok = False
            break
if ok and not stack:
    print("Balanced")
else:
    print("Not balanced")`,
        inputs: ["(a[1] + {b})", "(]", "((x)", "no brackets", "{[()()]}", "())("],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "An array stack with a top pointer",
        brief: `
Write the exam-style stack: a class \`Stack\` whose constructor takes a size, makes a list of that many \`None\`s, and sets a \`top\` pointer to -1. Write \`push(item)\` and \`pop()\` that move the pointer, without using \`append\` or the list's own \`pop\`:
- push onto a full stack prints \`Stack full\` and changes nothing;
- pop from an empty stack prints \`Stack empty\`; otherwise it prints the popped item.

Input the size, then commands until \`end\` (\`push <word>\` or \`pop\`). Finally print \`Top: \` followed by the top pointer.`,
        starter: "class Stack:\n    def __init__(self, size):\n        self.items = [None] * size\n        self.top = -1\n",
        hints: [
          "The stack is full when self.top == len(self.items) - 1.",
          "push: self.top += 1 then self.items[self.top] = item. pop: read self.items[self.top], then self.top -= 1.",
        ],
        solution: `class Stack:
    def __init__(self, size):
        self.items = [None] * size
        self.top = -1

    def push(self, item):
        if self.top == len(self.items) - 1:
            print("Stack full")
            return
        self.top = self.top + 1
        self.items[self.top] = item

    def pop(self):
        if self.top == -1:
            print("Stack empty")
            return
        print(self.items[self.top])
        self.top = self.top - 1

s = Stack(int(input()))
line = input()
while line != "end":
    if line == "pop":
        s.pop()
    else:
        s.push(line.split()[1])
    line = input()
print("Top: " + str(s.top))`,
        inputs: ["2\npush a\npush b\npush c\npop\nend", "3\npop\nend", "1\npush x\npop\npush y\nend"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Reverse Polish calculator",
        brief: `
In **reverse Polish notation** (RPN) the operator comes after its two numbers: \`3 4 +\` means 3 + 4, and \`3 4 + 2 *\` means (3 + 4) × 2. No brackets are ever needed.

It is evaluated with a stack. Go through the tokens left to right:
- a number: push it;
- an operator (\`+\`, \`-\`, \`*\` or \`/\`): pop the top item (the **second** number), pop again (the **first** number), work out first ⟨operator⟩ second, and push the result. \`/\` divides and rounds down (use \`//\`).

At the end the answer is the only item left. Input an RPN expression with tokens separated by spaces (all numbers are whole) and print the answer.`,
        starter: "",
        hints: [
          "Order matters for - and /: the first item popped is the right-hand number.",
          "Check whether a token is an operator with if token in \"+-*/\", and otherwise push int(token).",
        ],
        solution: `stack = []
for token in input().split():
    if token in ("+", "-", "*", "/"):
        second = stack.pop()
        first = stack.pop()
        if token == "+":
            stack.append(first + second)
        elif token == "-":
            stack.append(first - second)
        elif token == "*":
            stack.append(first * second)
        else:
            stack.append(first // second)
    else:
        stack.append(int(token))
print(stack.pop())`,
        inputs: ["3 4 + 2 *", "10 2 -", "5 1 2 + 4 * + 3 -", "20 6 /", "7"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Undo",
        brief: `
A simple editor keeps a list of words typed so far, and a stack so it can undo.

Read commands until \`end\`:
- \`type <word>\` adds the word to the end of the text and pushes it onto the stack;
- \`undo\` pops the most recent word off the stack and removes it from the end of the text. If there is nothing to undo, it does nothing.

Print the final text, words separated by spaces, or \`(empty)\` if there's nothing left.`,
        starter: "",
        hints: [
          "The text and the stack can both be lists. Undo pops from both.",
          "Check the stack isn't empty before undoing.",
        ],
        solution: `text = []
stack = []
line = input()
while line != "end":
    if line == "undo":
        if stack:
            stack.pop()
            text.pop()
    else:
        word = line.split()[1]
        text.append(word)
        stack.append(word)
    line = input()
print(" ".join(text) if text else "(empty)")`,
        inputs: ["type hello\ntype there\nundo\ntype world\nend", "undo\nend", "type a\nundo\nundo\nend"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 25,
        title: "Binary with a stack",
        brief: `
To turn a whole number into binary, keep dividing by 2 and push each remainder onto a stack. The remainders come out backwards, so popping them all gives the binary digits in the right order.

Input a whole number (0 or more) and print it in binary using a stack. Don't use \`bin\` or \`format\`. 0 prints \`0\`.`,
        starter: "",
        hints: [
          "while n > 0: push n % 2, then n = n // 2.",
          "Then pop every item into a string. Handle 0 separately.",
        ],
        solution: `n = int(input())
if n == 0:
    print(0)
else:
    stack = []
    while n > 0:
        stack.append(n % 2)
        n = n // 2
    digits = ""
    while stack:
        digits = digits + str(stack.pop())
    print(digits)`,
        inputs: ["10", "0", "255", "1"],
      },
    ],
  },
  {
    title: "Queues: linear and circular",
    summary: "First in, first out, and how a circular queue reuses the space at the front of its array.",
    notes: `
A **queue** is **first in, first out (FIFO)**: items join at the **rear** and leave from the **front**, like people waiting at a till.

Its operations:
- **enqueue(item)**: add to the rear;
- **dequeue()**: remove and return the front item;
- **is_empty()** and, for a fixed size, **is_full()**.

---

**Linear queue in an array.** Keep a **front** pointer and a **rear** pointer. Enqueue moves the rear pointer forward; dequeue moves the front pointer forward. The problem: once the rear reaches the end of the array, nothing more can join, even if items have left from the front and there is free space there.

**Circular queue.** When a pointer reaches the end of the array it wraps round to position 0, so the freed space is reused. The wrap-around uses \`%\`:

\`\`\`python
rear = (rear + 1) % capacity
front = (front + 1) % capacity
\`\`\`

Keep a count of the items too, so you can tell full (count == capacity) from empty (count == 0). Circular queues are used for keyboard buffers, streaming audio and anywhere a fixed block of memory is reused over and over.
`,
    worked_example: `capacity = 3
items = [None] * capacity
front, rear, count = 0, -1, 0

for name in ["Ann", "Bob"]:
    rear = (rear + 1) % capacity
    items[rear] = name
    count += 1

print(items[front])               # dequeue Ann
front = (front + 1) % capacity
count -= 1

rear = (rear + 1) % capacity      # wraps round to 2, then 0
items[rear] = "Cy"
count += 1
print(front, rear, count)`,
    worked_example_note:
      "After Ann leaves, the front pointer moves on to 1. New items keep moving the rear pointer forward, and % sends it back to 0 at the end of the array.",
    quiz: [
      {
        question: "Enqueue A, enqueue B, enqueue C, dequeue, enqueue D. Which item is at the front?",
        options: ["B", "A", "C", "D"],
        answer: "B",
        explanation: "A joined first and leaves first; B is next in line.",
      },
      {
        question: "What problem does a circular queue solve?",
        options: [
          "A linear queue can't reuse space freed at the front of its array",
          "A linear queue can't hold strings",
          "A linear queue is last in, first out",
          "A linear queue can't be empty",
        ],
        answer: "A linear queue can't reuse space freed at the front of its array",
        explanation: "In a circular queue the pointers wrap round, so freed spaces at the start of the array are used again.",
      },
      {
        question: "A circular queue has capacity 5 and the rear pointer is 4. Where does the next item go?",
        options: ["Position 0", "Position 5", "Position 4", "Nowhere: it's full"],
        answer: "Position 0",
        explanation: "(4 + 1) % 5 = 0, so the rear wraps round to the start (as long as the queue isn't full).",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "The queue at the till",
        brief: `
Write a class \`Queue\` that stores items in a list, with \`enqueue(item)\`, \`dequeue()\` (returning \`None\` if empty) and \`is_empty()\`.

Read commands until \`end\`:
- \`join <name>\` adds the name to the queue;
- \`serve\` prints the name served, or \`Nobody waiting\`.

Finally print \`Still waiting: \` followed by the names left, front first, separated by \`, \`, or \`Still waiting: nobody\`.`,
        starter: "class Queue:\n    pass\n",
        hints: [
          "enqueue appends to the end; dequeue removes from the front with self.items.pop(0).",
          "Check is_empty() before dequeuing.",
        ],
        solution: `class Queue:
    def __init__(self):
        self.items = []

    def enqueue(self, item):
        self.items.append(item)

    def dequeue(self):
        if self.is_empty():
            return None
        return self.items.pop(0)

    def is_empty(self):
        return len(self.items) == 0

q = Queue()
line = input()
while line != "end":
    if line == "serve":
        name = q.dequeue()
        print("Nobody waiting" if name is None else name)
    else:
        q.enqueue(line.split()[1])
    line = input()
print("Still waiting: " + (", ".join(q.items) if q.items else "nobody"))`,
        inputs: ["join Ann\njoin Bob\nserve\njoin Cy\nend", "serve\nend", "join A\nserve\nserve\nend"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "A circular queue",
        brief: `
Write a class \`CircularQueue\` whose constructor takes a capacity and sets up a list of that many \`None\`s, \`front = 0\`, \`rear = -1\` and \`count = 0\`.

- \`enqueue(item)\`: if \`count\` equals the capacity, print \`Queue full\`. Otherwise move \`rear\` on by one, wrapping with \`%\`, store the item there, and add 1 to \`count\`.
- \`dequeue()\`: if \`count\` is 0, print \`Queue empty\`. Otherwise print the item at \`front\`, move \`front\` on by one (wrapping), and take 1 from \`count\`.

Input the capacity, then commands until \`end\` (\`add <word>\` or \`remove\`). Finally print \`Front: f Rear: r Count: c\` with the three values.`,
        starter: "",
        hints: [
          "self.rear = (self.rear + 1) % len(self.items)",
          "Use count, not the pointers, to decide whether the queue is full or empty.",
        ],
        solution: `class CircularQueue:
    def __init__(self, capacity):
        self.items = [None] * capacity
        self.front = 0
        self.rear = -1
        self.count = 0

    def enqueue(self, item):
        if self.count == len(self.items):
            print("Queue full")
            return
        self.rear = (self.rear + 1) % len(self.items)
        self.items[self.rear] = item
        self.count = self.count + 1

    def dequeue(self):
        if self.count == 0:
            print("Queue empty")
            return
        print(self.items[self.front])
        self.front = (self.front + 1) % len(self.items)
        self.count = self.count - 1

q = CircularQueue(int(input()))
line = input()
while line != "end":
    if line == "remove":
        q.dequeue()
    else:
        q.enqueue(line.split()[1])
    line = input()
print("Front: " + str(q.front) + " Rear: " + str(q.rear) + " Count: " + str(q.count))`,
        inputs: [
          "3\nadd a\nadd b\nadd c\nadd d\nremove\nadd d\nend",
          "2\nremove\nend",
          "2\nadd x\nremove\nadd y\nremove\nadd z\nend",
        ],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Pass the parcel",
        brief: `
Children sit in a circle and pass a parcel. A queue models the circle: passing the parcel means taking the child at the front and putting them at the back.

Input a line of names separated by spaces, then a whole number \`k\`. Repeat until one child is left:
- pass the parcel \`k\` times (each pass moves the front child to the back);
- the child now at the front is out: remove them and print their name.

Then print \`Winner: \` and the last child's name.`,
        starter: "",
        hints: [
          "One pass: queue.append(queue.pop(0)).",
          "Loop while len(queue) > 1: do k passes, then pop(0) and print it.",
        ],
        solution: `queue = input().split()
k = int(input())
while len(queue) > 1:
    for i in range(k):
        queue.append(queue.pop(0))
    print(queue.pop(0))
print("Winner: " + queue[0])`,
        inputs: ["Ann Bob Cy Di\n1", "Ann Bob Cy\n0", "A B C D E\n2", "Solo\n3"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "A queue made from two stacks",
        brief: `
A queue can be built from two stacks, \`inbox\` and \`outbox\`:
- **enqueue**: push onto \`inbox\`;
- **dequeue**: if \`outbox\` is empty, pop everything off \`inbox\` and push it onto \`outbox\` (which reverses the order). Then pop from \`outbox\`.

Write a class \`TwoStackQueue\` that works this way, using lists with only \`append\` and \`pop()\` (no \`pop(0)\`). Read commands until \`end\`: \`add <word>\` or \`remove\`. For \`remove\`, print the item, or \`Empty\`.`,
        starter: "",
        hints: [
          "Only move items from inbox to outbox when outbox is empty, otherwise the order breaks.",
          "while self.inbox: self.outbox.append(self.inbox.pop())",
        ],
        solution: `class TwoStackQueue:
    def __init__(self):
        self.inbox = []
        self.outbox = []

    def enqueue(self, item):
        self.inbox.append(item)

    def dequeue(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        if not self.outbox:
            return None
        return self.outbox.pop()

q = TwoStackQueue()
line = input()
while line != "end":
    if line == "remove":
        item = q.dequeue()
        print("Empty" if item is None else item)
    else:
        q.enqueue(line.split()[1])
    line = input()`,
        inputs: ["add a\nadd b\nremove\nadd c\nremove\nremove\nremove\nend", "remove\nend", "add x\nadd y\nadd z\nremove\nend"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Rolling average",
        brief: `
A sensor keeps only its last 3 readings in a circular buffer: a list of size 3 and a pointer to the next slot to write. Each new reading overwrites the oldest one once the buffer is full.

Input a line of whole-number readings separated by spaces. After each reading is stored, print the average of the readings currently held (1, 2 or 3 of them), rounded to 1 decimal place.

For example, \`10 20 30 40\` prints \`10.0\`, \`15.0\`, \`20.0\`, \`30.0\` (the last one is the average of 20, 30 and 40).`,
        starter: "",
        hints: [
          "Write each reading at buffer[pointer], then pointer = (pointer + 1) % 3.",
          "Keep a count of how many readings are held, up to 3, so the first averages only use the slots filled so far.",
        ],
        solution: `buffer = [0, 0, 0]
pointer = 0
count = 0
for value in input().split():
    buffer[pointer] = int(value)
    pointer = (pointer + 1) % 3
    count = min(count + 1, 3)
    held = buffer if count == 3 else buffer[:count]
    print(round(sum(held) / count, 1))`,
        inputs: ["10 20 30 40", "5", "1 2 3 4 5 6", "9 9 9 0"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Two tills",
        brief: `
A shop has one queue and two tills. Input a line of customer names separated by spaces, in the order they joined. Customers are served in order, alternating: the first goes to till 1, the second to till 2, the third to till 1, and so on.

Use a queue (a list you remove from the front of). Print \`Till 1: \` and \`Till 2: \` on two lines, each followed by its customers separated by spaces (or nothing if a till served no one).`,
        starter: "",
        hints: [
          "Dequeue with pop(0) inside a while loop, and keep a counter to alternate the tills.",
          "Keep a list for each till and join it at the end.",
        ],
        solution: `queue = input().split()
tills = [[], []]
turn = 0
while queue:
    tills[turn].append(queue.pop(0))
    turn = 1 - turn
print("Till 1: " + " ".join(tills[0]))
print("Till 2: " + " ".join(tills[1]))`,
        inputs: ["Ann Bob Cy Di Ed", "Solo", "A B"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 25,
        title: "Reverse a queue",
        brief: `
Input a line of words, which form a queue (first word at the front). Reverse the queue using a stack: dequeue every item and push it onto the stack, then pop every item off the stack and enqueue it again.

Print the queue, front first, separated by spaces. Use \`pop(0)\` to dequeue, \`append\` to enqueue and push, and \`pop()\` to pop.`,
        starter: "",
        hints: [
          "while queue: stack.append(queue.pop(0))",
          "while stack: queue.append(stack.pop())",
        ],
        solution: `queue = input().split()
stack = []
while queue:
    stack.append(queue.pop(0))
while stack:
    queue.append(stack.pop())
print(" ".join(queue))`,
        inputs: ["one two three", "solo", "a b c d"],
      },
    ],
  },
  {
    title: "Priority queues",
    summary: "Queues where the most urgent item is served first, whenever it arrived.",
    notes: `
In a **priority queue** each item has a **priority**, and the item with the highest priority leaves first. Items with the **same** priority leave in the order they joined, like a normal queue.

Examples: a hospital A&E (the most urgent patient is seen first), a printer that prints short jobs first, an operating system choosing which process to run next.

One simple way to build one is to keep the list **in priority order** all the time. Enqueue finds the right place and inserts there; dequeue just takes the front:

\`\`\`python
def enqueue(queue, item, priority):
    i = 0
    # walk past everything with priority >= this one,
    # so equal priorities stay first-come, first-served
    while i < len(queue) and queue[i][1] >= priority:
        i += 1
    queue.insert(i, (item, priority))
\`\`\`

---

Adding an item this way takes longer as the queue grows (it may look at every item), but removing is instant. Python's \`heapq\` module stores a priority queue as a **heap**, which makes both adding and removing fast. It always gives back the *smallest* item first, so it suits "lowest number is most urgent" priorities.
`,
    worked_example: `queue = []

def enqueue(item, priority):
    i = 0
    while i < len(queue) and queue[i][1] >= priority:
        i += 1
    queue.insert(i, (item, priority))

enqueue("Sprained wrist", 2)
enqueue("Broken leg", 4)
enqueue("Cut finger", 2)
for patient, priority in queue:
    print(priority, patient)`,
    worked_example_note:
      "Broken leg has the highest priority so it goes to the front. The two priority-2 patients stay in the order they arrived.",
    quiz: [
      {
        question: "In a priority queue, which item is dequeued first?",
        options: [
          "The one with the highest priority",
          "The one that joined first",
          "The one that joined last",
          "A random one",
        ],
        answer: "The one with the highest priority",
        explanation: "Priority decides first; arrival order only matters between items with the same priority.",
      },
      {
        question: "Two items have the same priority. Which leaves first?",
        options: ["The one that joined first", "The one that joined last", "Either", "Neither"],
        answer: "The one that joined first",
        explanation: "Equal priorities behave like a normal queue: first in, first out.",
      },
      {
        question: "Python's heapq always gives back which item first?",
        options: ["The smallest", "The largest", "The newest", "The oldest"],
        answer: "The smallest",
        explanation: "heapq is a min-heap, so the smallest value comes out first.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Accident and emergency",
        brief: `
Write a class \`PriorityQueue\` that keeps a list of \`(name, priority)\` pairs in order, highest priority first, with equal priorities in arrival order. It has \`enqueue(name, priority)\` and \`dequeue()\`, which returns the front name or \`None\` if empty.

Read commands until \`end\`:
- \`arrive <name> <priority>\` (priority is a whole number; bigger is more urgent);
- \`see\` prints the name of the next patient, or \`Nobody waiting\`.`,
        starter: "class PriorityQueue:\n    pass\n",
        hints: [
          "In enqueue, walk forward past every item whose priority is >= the new one, then insert.",
          "dequeue returns self.items.pop(0)[0], the front item's name.",
        ],
        solution: `class PriorityQueue:
    def __init__(self):
        self.items = []

    def enqueue(self, name, priority):
        i = 0
        while i < len(self.items) and self.items[i][1] >= priority:
            i = i + 1
        self.items.insert(i, (name, priority))

    def dequeue(self):
        if not self.items:
            return None
        return self.items.pop(0)[0]

pq = PriorityQueue()
line = input()
while line != "end":
    parts = line.split()
    if parts[0] == "see":
        name = pq.dequeue()
        print("Nobody waiting" if name is None else name)
    else:
        pq.enqueue(parts[1], int(parts[2]))
    line = input()`,
        inputs: [
          "arrive Ann 2\narrive Bob 5\narrive Cy 2\nsee\nsee\nsee\nsee\nend",
          "see\nend",
          "arrive A 1\narrive B 1\narrive C 3\nsee\narrive D 3\nsee\nsee\nend",
        ],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Print the shortest jobs first",
        brief: `
A printer serves the job with the **fewest pages** first; jobs with the same number of pages print in the order they arrived.

Input a whole number \`n\`, then \`n\` lines, each a job name and a number of pages. Using a priority queue (you can use the class from the last task with a small change, or \`heapq\`), print the jobs in the order they will be printed, one per line, as \`<name> (<pages>)\`.`,
        starter: "",
        hints: [
          "Here a smaller number is more urgent, so walk past every item whose pages is <= the new one.",
          "With heapq, push (pages, arrival_number, name) so ties are broken by arrival order.",
        ],
        solution: `queue = []
for i in range(int(input())):
    name, pages = input().split()
    pages = int(pages)
    j = 0
    while j < len(queue) and queue[j][1] <= pages:
        j = j + 1
    queue.insert(j, (name, pages))
for name, pages in queue:
    print(name + " (" + str(pages) + ")")`,
        inputs: ["3\nessay 12\nmemo 1\nposter 1", "1\nreport 40", "4\na 5\nb 3\nc 5\nd 4"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Using heapq",
        brief: `
Python's \`heapq\` module keeps a list as a heap, so the smallest item can always be taken off quickly with \`heapq.heappop\`.

Input a line of whole numbers separated by spaces, then a whole number \`k\`. Push every number onto a heap with \`heapq.heappush\`, then pop the \`k\` smallest and print them separated by spaces (smallest first). If there are fewer than \`k\` numbers, print them all.`,
        starter: "import heapq\n",
        hints: [
          "Start with heap = [] and call heapq.heappush(heap, number) for each number.",
          "Pop min(k, len(heap)) times.",
        ],
        solution: `import heapq

heap = []
for x in input().split():
    heapq.heappush(heap, int(x))
k = int(input())
out = []
for i in range(min(k, len(heap))):
    out.append(heapq.heappop(heap))
print(" ".join(str(x) for x in out))`,
        inputs: ["9 4 7 1 8\n3", "5 5 2\n1", "3 1\n5", "-1 -7 0 2\n2"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Peek, size and empty",
        brief: `
Extend a priority queue with the full set of operations. Write a class with:
- \`enqueue(item, priority)\` (bigger priority is more urgent; ties first-come, first-served);
- \`dequeue()\` returning the front item, or \`None\`;
- \`peek()\` returning the front item without removing it, or \`None\`;
- \`size()\` and \`is_empty()\`.

Read commands until \`end\`: \`add <item> <priority>\`, \`take\`, \`peek\`, \`size\`. \`take\` and \`peek\` print the item or \`Empty\`; \`size\` prints the number of items.`,
        starter: "",
        hints: [
          "peek looks at self.items[0] but doesn't pop it.",
          "size returns len(self.items).",
        ],
        solution: `class PriorityQueue:
    def __init__(self):
        self.items = []

    def enqueue(self, item, priority):
        i = 0
        while i < len(self.items) and self.items[i][1] >= priority:
            i = i + 1
        self.items.insert(i, (item, priority))

    def dequeue(self):
        return self.items.pop(0)[0] if self.items else None

    def peek(self):
        return self.items[0][0] if self.items else None

    def size(self):
        return len(self.items)

    def is_empty(self):
        return self.size() == 0

pq = PriorityQueue()
line = input()
while line != "end":
    p = line.split()
    if p[0] == "add":
        pq.enqueue(p[1], int(p[2]))
    elif p[0] == "size":
        print(pq.size())
    else:
        item = pq.dequeue() if p[0] == "take" else pq.peek()
        print("Empty" if item is None else item)
    line = input()`,
        inputs: ["add a 1\nadd b 9\npeek\nsize\ntake\ntake\ntake\nsize\nend", "peek\nsize\nend", "add x 2\nadd y 2\ntake\npeek\nend"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Minute by minute",
        brief: `
A help desk deals with one call per minute. Each call has a priority (bigger is more urgent) and the minute it arrives.

Input a whole number \`n\`, then \`n\` lines, each \`<name> <arrival minute> <priority>\`, in order of arrival. The desk starts at minute 0. Each minute, of the calls that have **arrived by then** and are still waiting, it answers the one with the highest priority (ties: earliest arrival). If nobody is waiting that minute, nothing happens and the clock moves on.

For each call answered, print \`Minute <m>: <name>\`.`,
        starter: "",
        hints: [
          "Loop minute by minute until every call is answered. Each minute, move any newly arrived calls into a priority queue.",
          "Keep the priority queue ordered by priority, highest first, with ties in arrival order.",
        ],
        solution: `calls = []
for i in range(int(input())):
    name, arrive, priority = input().split()
    calls.append((name, int(arrive), int(priority)))
waiting = []
minute = 0
next_call = 0
answered = 0
while answered < len(calls):
    while next_call < len(calls) and calls[next_call][1] <= minute:
        name, arrive, priority = calls[next_call]
        i = 0
        while i < len(waiting) and waiting[i][1] >= priority:
            i = i + 1
        waiting.insert(i, (name, priority))
        next_call = next_call + 1
    if waiting:
        print("Minute " + str(minute) + ": " + waiting.pop(0)[0])
        answered = answered + 1
    minute = minute + 1`,
        inputs: ["3\nAnn 0 1\nBob 0 3\nCy 1 5", "2\nLate 3 1\nLater 4 9", "4\nA 0 2\nB 0 2\nC 0 2\nD 2 9"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Boarding the plane",
        brief: `
Passengers board by group: group 1 first, then group 2, and so on. Within a group, they board in the order they arrived at the gate.

Input a whole number \`n\`, then \`n\` lines each with a name and a group number. Print the boarding order, one name per line, using a priority queue where a **smaller** group number is more urgent.`,
        starter: "",
        hints: [
          "Insert each passenger after everyone whose group is <= theirs.",
          "Then print the names from front to back.",
        ],
        solution: `queue = []
for i in range(int(input())):
    name, group = input().split()
    group = int(group)
    j = 0
    while j < len(queue) and queue[j][1] <= group:
        j = j + 1
    queue.insert(j, (name, group))
for name, group in queue:
    print(name)`,
        inputs: ["4\nAnn 3\nBob 1\nCy 3\nDi 2", "1\nSolo 5", "3\nA 2\nB 2\nC 1"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Homework planner",
        brief: `
Input a whole number \`n\`, then \`n\` lines in the form \`<subject> <days until due>\`. Using \`heapq\`, print the subjects in the order to do them: soonest deadline first, and for equal deadlines, the order they were input.

Push tuples of \`(days, position, subject)\` so that equal days are separated by input position.`,
        starter: "import heapq\n",
        hints: [
          "heapq compares tuples item by item, so (days, position, subject) sorts by days, then position.",
          "Pop until the heap is empty and print each subject.",
        ],
        solution: `import heapq

heap = []
for position in range(int(input())):
    subject, days = input().split()
    heapq.heappush(heap, (int(days), position, subject))
while heap:
    print(heapq.heappop(heap)[2])`,
        inputs: ["3\nmaths 4\nart 1\ncs 4", "2\nhistory 0\nfrench 0", "1\nbiology 7"],
      },
    ],
  },
  {
    title: "Linked lists",
    summary: "Nodes joined by pointers: traversing, adding and removing without moving everything else.",
    notes: `
A **linked list** stores items in **nodes**. Each node holds its data and a **pointer** to the next node. A **start** (or head) pointer points at the first node, and the last node's pointer is null (\`None\`).

\`\`\`
start -> [ "Ann" | -]-> [ "Bob" | -]-> [ "Cy" | None ]
\`\`\`

\`\`\`python
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None
\`\`\`

**Traversing**: start at \`start\` and follow \`next\` until you reach \`None\`:

\`\`\`python
current = start
while current is not None:
    print(current.data)
    current = current.next
\`\`\`

---

The advantage over an array is that adding or removing an item only changes a couple of pointers; nothing has to be shuffled along. To insert \`new\` after node \`a\`: \`new.next = a.next\`, then \`a.next = new\`. To delete the node after \`a\`: \`a.next = a.next.next\`.

The disadvantage: you can't jump straight to the 100th item, so finding one means traversing from the start. A linked list is a **dynamic** structure (it grows and shrinks as needed); a plain array is **static** (fixed size). In exams, a linked list is sometimes stored in arrays, with a second array holding each item's next pointer and a **free pointer** to the next unused slot.
`,
    worked_example: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

start = Node("Ann")
start.next = Node("Cy")
new = Node("Bob")
new.next = start.next      # Bob points at Cy
start.next = new           # Ann points at Bob

current = start
while current is not None:
    print(current.data)
    current = current.next`,
    worked_example_note:
      "Bob is inserted between Ann and Cy by changing two pointers. The order of those two lines matters: set new.next first, or the link to Cy would be lost.",
    quiz: [
      {
        question: "What does each node in a linked list hold?",
        options: [
          "Its data and a pointer to the next node",
          "Only its data",
          "Its position number",
          "A copy of the whole list",
        ],
        answer: "Its data and a pointer to the next node",
        explanation: "The pointers chain the nodes together; the last one points to None.",
      },
      {
        question: "Why is inserting into a linked list quicker than inserting into the middle of an array?",
        options: [
          "Only pointers change; no items have to be moved along",
          "Linked lists are always sorted",
          "Arrays can't have items inserted at all",
          "Linked lists use less memory per item",
        ],
        answer: "Only pointers change; no items have to be moved along",
        explanation: "An array has to shift every later item along to make room. A linked list just relinks two pointers.",
      },
      {
        question: "How do you reach the fifth item of a linked list?",
        options: [
          "Follow the pointers from the start through the first four nodes",
          "Jump straight to position 4",
          "Follow the pointers backwards from the end",
          "You can't",
        ],
        answer: "Follow the pointers from the start through the first four nodes",
        explanation: "There's no direct access by position: you have to traverse from the start pointer.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Add to the front",
        brief: `
Write a class \`Node\` with \`data\` and \`next\` (starting as \`None\`).

Input a line of words separated by spaces. Starting from an empty list (\`start = None\`), add each word to the **front** of the linked list: make a new node, point it at the current start, and make it the new start.

Then traverse the list from \`start\` and print the words joined by \` -> \`. For example, \`a b c\` prints \`c -> b -> a\`.`,
        starter: "class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None\n\nstart = None\n",
        hints: [
          "node = Node(word); node.next = start; start = node",
          "Collect the words while traversing, then print \" -> \".join(words).",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

start = None
for word in input().split():
    node = Node(word)
    node.next = start
    start = node
words = []
current = start
while current is not None:
    words.append(current.data)
    current = current.next
print(" -> ".join(words))`,
        inputs: ["a b c", "only", "1 2 3 4 5"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Append and count",
        brief: `
Write a class \`LinkedList\` with a \`start\` pointer, and these methods:
- \`append(data)\`: adds a new node at the **end** (traverse to the last node, then link the new node after it; if the list is empty, the new node becomes \`start\`);
- \`length()\`: counts the nodes by traversing;
- \`show()\`: returns the items joined by \` -> \`, or \`(empty)\`.

Input a line of words separated by spaces (it may be empty), append each, then print \`show()\` and \`Length: \` with the length on the next line. Don't use a Python list to store the items.`,
        starter: "",
        hints: [
          "To find the end: current = self.start, then while current.next is not None: current = current.next.",
          "length counts how many times the traversal loop runs.",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.start = None

    def append(self, data):
        node = Node(data)
        if self.start is None:
            self.start = node
            return
        current = self.start
        while current.next is not None:
            current = current.next
        current.next = node

    def length(self):
        count = 0
        current = self.start
        while current is not None:
            count = count + 1
            current = current.next
        return count

    def show(self):
        items = []
        current = self.start
        while current is not None:
            items.append(current.data)
            current = current.next
        return " -> ".join(items) if items else "(empty)"

ll = LinkedList()
for word in input().split():
    ll.append(word)
print(ll.show())
print("Length: " + str(ll.length()))`,
        inputs: ["a b c", "", "x"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Keep it in order",
        brief: `
Write a function \`insert_in_order(start, value)\` that puts \`value\` into a linked list of numbers that is already in ascending order, keeping it in order, and returns the (possibly new) start node.

- If the list is empty, or \`value\` is smaller than the first item, the new node becomes the start.
- Otherwise traverse until the next node is \`None\` or bigger than \`value\`, and insert the new node there.

Input a line of whole numbers in any order. Insert each one, then print the list joined by \` -> \`.`,
        starter: "class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None\n",
        hints: [
          "Insert after current: node.next = current.next, then current.next = node.",
          "Equal values: put the new one after the existing one by stopping only when the next value is strictly bigger.",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def insert_in_order(start, value):
    node = Node(value)
    if start is None or value < start.data:
        node.next = start
        return node
    current = start
    while current.next is not None and current.next.data <= value:
        current = current.next
    node.next = current.next
    current.next = node
    return start

start = None
for x in input().split():
    start = insert_in_order(start, int(x))
items = []
current = start
while current is not None:
    items.append(str(current.data))
    current = current.next
print(" -> ".join(items))`,
        inputs: ["5 2 8 1", "3", "4 4 1 9 0", "10 9 8 7"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Delete a node",
        brief: `
Build a linked list from a line of words (in the same order). Then read words to delete, one per line, until \`end\`.

To delete a word, find the **first** node holding it and unlink it: if it's the start node, move \`start\` on to the next node; otherwise make the node before it point past it. If the word isn't there, print \`<word> not found\`.

After \`end\`, print the list joined by \` -> \`, or \`(empty)\`.`,
        starter: "",
        hints: [
          "Keep two pointers while traversing: previous and current.",
          "Unlink with previous.next = current.next.",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

start = None
last = None
for word in input().split():
    node = Node(word)
    if start is None:
        start = node
    else:
        last.next = node
    last = node

word = input()
while word != "end":
    previous = None
    current = start
    while current is not None and current.data != word:
        previous = current
        current = current.next
    if current is None:
        print(word + " not found")
    elif previous is None:
        start = current.next
    else:
        previous.next = current.next
    word = input()

items = []
current = start
while current is not None:
    items.append(current.data)
    current = current.next
print(" -> ".join(items) if items else "(empty)")`,
        inputs: ["a b c d\nb\nz\na\nend", "x\nx\nend", "p q p\np\nend"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Reverse the pointers",
        brief: `
Build a linked list from a line of words, in order. Then reverse it **in place**: don't make any new nodes and don't use a Python list. Walk along the list, turning each node's \`next\` pointer round to point at the node before it.

Use three pointers: \`previous\` (starts \`None\`), \`current\` (starts at \`start\`) and \`following\`. At each step: save \`following = current.next\`, point \`current.next\` back at \`previous\`, then move \`previous\` and \`current\` one step on. At the end, \`previous\` is the new start.

Print the reversed list joined by \` -> \`.`,
        starter: "",
        hints: [
          "Save current.next before you overwrite it, or you lose the rest of the list.",
          "The loop runs while current is not None.",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

start = None
last = None
for word in input().split():
    node = Node(word)
    if start is None:
        start = node
    else:
        last.next = node
    last = node

previous = None
current = start
while current is not None:
    following = current.next
    current.next = previous
    previous = current
    current = following
start = previous

items = []
current = start
while current is not None:
    items.append(current.data)
    current = current.next
print(" -> ".join(items))`,
        inputs: ["a b c d", "solo", "1 2"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Is it in the list?",
        brief: `
Build a linked list from a line of words, in order. Then input a word to search for. Traverse the list and print \`Found at position <p>\` (counting from 1) for the first node holding that word, or \`Not found\`.`,
        starter: "",
        hints: [
          "Keep a position counter that goes up by 1 each time you move to the next node.",
          "Stop as soon as you find it.",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

start = None
last = None
for word in input().split():
    node = Node(word)
    if start is None:
        start = node
    else:
        last.next = node
    last = node

target = input()
position = 1
current = start
while current is not None and current.data != target:
    current = current.next
    position = position + 1
print("Not found" if current is None else "Found at position " + str(position))`,
        inputs: ["red green blue\nblue", "red green blue\npink", "a a\na"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Remove repeats",
        brief: `
Build a linked list from a line of whole numbers that are already in ascending order (repeats allowed). Remove every repeated value so each number appears once, by relinking pointers: when a node's next node holds the same value, make the node point past it.

Print the list joined by \` -> \`.`,
        starter: "",
        hints: [
          "while current.next is not None: if current.next.data == current.data, skip it; otherwise move on.",
          "Only move current forward when the next value is different.",
        ],
        solution: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

start = None
last = None
for x in input().split():
    node = Node(int(x))
    if start is None:
        start = node
    else:
        last.next = node
    last = node

current = start
while current is not None and current.next is not None:
    if current.next.data == current.data:
        current.next = current.next.next
    else:
        current = current.next

items = []
current = start
while current is not None:
    items.append(str(current.data))
    current = current.next
print(" -> ".join(items))`,
        inputs: ["1 1 2 3 3 3 4", "5", "2 2 2"],
      },
    ],
  },
  {
    title: "Hash tables and dictionaries",
    summary: "Storing items where a hash function says they go, and what to do when two want the same place.",
    notes: `
A **hash table** stores items in an array, using a **hash function** to work out which position (bucket) each key goes in. To find a key later, you hash it again and look straight there, so a lookup takes about the same time however big the table is.

A simple hash function for text adds up the character codes and takes the remainder when divided by the table size:

\`\`\`python
def hash_key(key, size):
    return sum(ord(ch) for ch in key) % size
\`\`\`

---

A **collision** happens when two keys hash to the same position. Two ways to handle it:

- **Linear probing** (open addressing): if the position is taken, try the next one, then the next, wrapping round to 0 at the end, until a free one is found. Searching works the same way: start at the hashed position and step along until you find the key or an empty slot.
- **Chaining**: each position holds a list, and every key that hashes there goes in that list.

The **load factor** is how full the table is (items ÷ size). As it rises, collisions get more common and lookups slow down, so the table is **rehashed**: a bigger table is made and every item is inserted into it again.

A **dictionary** is a collection of key–value pairs, where each key is unique. Python's \`dict\` is built on a hash table, which is why looking up \`scores["Ada"]\` is fast.
`,
    worked_example: `def hash_key(key, size):
    return sum(ord(ch) for ch in key) % size

for name in ["cat", "act", "dog"]:
    print(name, hash_key(name, 7))`,
    worked_example_note:
      "cat and act contain the same letters, so their codes add up to the same total and they collide at the same position. dog lands somewhere else.",
    quiz: [
      {
        question: "What is a collision in a hash table?",
        options: [
          "Two keys hashing to the same position",
          "A key that isn't in the table",
          "A table that is completely full",
          "Two identical values",
        ],
        answer: "Two keys hashing to the same position",
        explanation: "Collisions are dealt with by linear probing or chaining.",
      },
      {
        question: "With linear probing, a key hashes to position 3 but 3 is taken. Where does it try next?",
        options: ["Position 4", "Position 0", "Position 2", "A random position"],
        answer: "Position 4",
        explanation: "Linear probing steps along one position at a time, wrapping round to 0 at the end.",
      },
      {
        question: "Why is a hash table rehashed into a bigger table?",
        options: [
          "A high load factor makes collisions common, which slows lookups",
          "To sort the keys",
          "Because keys can only be used once",
          "To delete old items",
        ],
        answer: "A high load factor makes collisions common, which slows lookups",
        explanation: "A bigger table lowers the load factor, so fewer keys collide.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "A hash function",
        brief: `
Write a function \`hash_key(key, size)\` that adds up the character codes of every character in \`key\` (using \`ord\`) and returns the total modulo \`size\`.

Input the table size, then a line of keys separated by spaces. Print each key and its hash value as \`<key>: <hash>\`, one per line.

For example, with size 7, \`cat\` prints \`cat: 4\`, because the codes of c, a and t are 99 + 97 + 116 = 312, and 312 % 7 = 4.`,
        starter: "def hash_key(key, size):\n    pass\n",
        hints: [
          "total = 0, then add ord(ch) for each character.",
          "return total % size",
        ],
        solution: `def hash_key(key, size):
    total = 0
    for ch in key:
        total = total + ord(ch)
    return total % size

size = int(input())
for key in input().split():
    print(key + ": " + str(hash_key(key, size)))`,
        inputs: ["7\ncat act dog", "10\na b", "13\nhello world"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Linear probing",
        brief: `
Make a hash table: a list of \`size\` slots, all \`None\`. Insert keys using the hash function from the last task (sum of character codes, mod size). If a key's slot is taken, step to the next slot, wrapping round to 0 after the last, until you find an empty one. (There will always be enough space.)

Input the size, then a line of keys separated by spaces. Insert them in order, then print every slot on its own line as \`<slot>: <key>\`, using \`-\` for an empty slot.`,
        starter: "",
        hints: [
          "position = hash; while table[position] is not None: position = (position + 1) % size",
          "Print every slot with for i in range(size).",
        ],
        solution: `def hash_key(key, size):
    return sum(ord(ch) for ch in key) % size

size = int(input())
table = [None] * size
for key in input().split():
    position = hash_key(key, size)
    while table[position] is not None:
        position = (position + 1) % size
    table[position] = key
for i in range(size):
    print(str(i) + ": " + (table[i] if table[i] is not None else "-"))`,
        inputs: ["7\ncat act dog", "5\nab ba", "4\nz y x w"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Chaining",
        brief: `
Make a hash table where every slot holds a list (chaining). Each key is added to the end of the list in the slot it hashes to (sum of character codes, mod size).

Input the size, then a line of keys separated by spaces. Insert them in order, then print every slot as \`<slot>: \` followed by its keys separated by \`, \` (nothing after the colon for an empty slot).`,
        starter: "",
        hints: [
          "table = [[] for i in range(size)] makes a separate list for each slot.",
          "table[hash_key(key, size)].append(key)",
        ],
        solution: `def hash_key(key, size):
    return sum(ord(ch) for ch in key) % size

size = int(input())
table = [[] for i in range(size)]
for key in input().split():
    table[hash_key(key, size)].append(key)
for i in range(size):
    print(str(i) + ": " + ", ".join(table[i]))`,
        inputs: ["7\ncat act dog", "3\na b c d", "5\nhi ih hello"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 35,
        title: "Searching with probes",
        brief: `
Build a linear-probing hash table as in the earlier task: input the size and a line of keys to insert. Then input one key to search for.

Search the same way you insert: start at the key's hash position and check each slot in turn, wrapping round. Stop when you find the key, reach an empty slot, or have checked every slot. Count each slot you look at as one probe.

Print \`Found at <slot> after <n> probes\`, or \`Not found after <n> probes\`.`,
        starter: "",
        hints: [
          "Loop at most size times, adding 1 to probes each time you look at a slot.",
          "An empty slot (None) means the key can't be further along, so stop there.",
        ],
        solution: `def hash_key(key, size):
    return sum(ord(ch) for ch in key) % size

size = int(input())
table = [None] * size
for key in input().split():
    position = hash_key(key, size)
    while table[position] is not None:
        position = (position + 1) % size
    table[position] = key

target = input()
position = hash_key(target, size)
probes = 0
found = False
while probes < size:
    probes = probes + 1
    if table[position] is None:
        break
    if table[position] == target:
        found = True
        break
    position = (position + 1) % size
if found:
    print("Found at " + str(position) + " after " + str(probes) + " probes")
else:
    print("Not found after " + str(probes) + " probes")`,
        inputs: ["7\ncat act dog\nact", "7\ncat act dog\ncow", "3\na b c\nd", "5\nab ba\nab"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Rehash when it fills up",
        brief: `
A hash table starts with 4 slots and uses linear probing (sum of character codes, mod size). Before inserting each key, check the load factor it **would** have after the insert: (items + 1) ÷ size. If that is more than 0.7, first **rehash**: make a new table of double the size and re-insert every existing key into it, in the order they appear in the old table (slot 0 first), then insert the new key. Print \`Rehashed to <size>\` each time.

Input a line of keys separated by spaces and insert them in order. Finally print each slot as \`<slot>: <key>\` (\`-\` for empty).`,
        starter: "",
        hints: [
          "Keep a count of items. Rehash when (count + 1) / size > 0.7.",
          "Write an insert(table, key) function so rehashing and normal inserts use the same code.",
        ],
        solution: `def hash_key(key, size):
    return sum(ord(ch) for ch in key) % size

def insert(table, key):
    position = hash_key(key, len(table))
    while table[position] is not None:
        position = (position + 1) % len(table)
    table[position] = key

table = [None] * 4
count = 0
for key in input().split():
    if (count + 1) / len(table) > 0.7:
        old = table
        table = [None] * (len(old) * 2)
        for k in old:
            if k is not None:
                insert(table, k)
        print("Rehashed to " + str(len(table)))
    insert(table, key)
    count = count + 1
for i in range(len(table)):
    print(str(i) + ": " + (table[i] if table[i] is not None else "-"))`,
        inputs: ["a b c d", "x", "one two three four five six seven"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 2,
        xp: 20,
        title: "Word counts with a dictionary",
        brief: `
Input a line of words. Use a dictionary to count how often each word appears, then print each word and its count as \`<word>: <count>\`, in **alphabetical order** of the words.`,
        starter: "",
        hints: [
          "counts[word] = counts.get(word, 0) + 1",
          "Loop over sorted(counts) to print in alphabetical order.",
        ],
        solution: `counts = {}
for word in input().split():
    counts[word] = counts.get(word, 0) + 1
for word in sorted(counts):
    print(word + ": " + str(counts[word]))`,
        inputs: ["the cat and the hat", "solo", "b a b a b"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Find a pair that adds up",
        brief: `
Input a line of whole numbers, then a target. Find the first pair of numbers (at different positions) that add up to the target, scanning from the left: for each number, check whether its partner (target − number) has already been seen.

Use a dictionary that maps each number seen so far to its position, so each check is a single lookup. Print the two positions (counting from 0, earlier one first) separated by a space, or \`No pair\`.`,
        starter: "",
        hints: [
          "For each position i and number x: if target - x is in seen, you've found the pair (seen[target - x], i).",
          "Otherwise store seen[x] = i, but only if x isn't already there, so the earliest position is kept.",
        ],
        solution: `numbers = [int(x) for x in input().split()]
target = int(input())
seen = {}
answer = None
for i, x in enumerate(numbers):
    if target - x in seen:
        answer = (seen[target - x], i)
        break
    if x not in seen:
        seen[x] = i
print("No pair" if answer is None else str(answer[0]) + " " + str(answer[1]))`,
        inputs: ["2 7 11 15\n9", "1 2 3\n7", "3 3\n6", "5 1 4 1\n2"],
      },
    ],
  },
];
