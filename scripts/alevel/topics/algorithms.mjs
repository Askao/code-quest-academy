// A level: Algorithms. OCR H446 2.3.1 (Big O; bubble, insertion, merge and
// quick sort; Dijkstra's shortest path; A* search); AQA 7517 4.3.4 (searching:
// linear, binary), 4.3.5 (sorting: bubble, merge), 4.3.6 (Dijkstra) and 4.4.4
// (classification of algorithms, Big O). A* is OCR only.
export const topic = "algorithms";

const GRAPH = `graph = {}
for i in range(int(input())):
    a, b, w = input().split()
    graph.setdefault(a, {})[b] = int(w)
    graph.setdefault(b, {})[a] = int(w)
`;

export const lessons = [
  {
    title: "Big O notation",
    summary: "Describing how an algorithm's time grows as its input grows, and comparing algorithms fairly.",
    notes: `
**Big O notation** describes how the time an algorithm takes (or the memory it uses) grows as the size of its input, \`n\`, grows. It ignores the details of a particular computer and keeps only the part that matters most for big inputs.

| Big O | Name | Example |
|---|---|---|
| O(1) | constant | looking up an item by its position in an array |
| O(log n) | logarithmic | binary search: halving the data each step |
| O(n) | linear | linear search: looking at every item once |
| O(n log n) | linearithmic | merge sort |
| O(n²) | polynomial (quadratic) | bubble sort, comparing every pair |
| O(2ⁿ) | exponential | trying every subset of the items |

---

To work out an algorithm's Big O, count how many times its main step runs:
- one loop over the data: O(n);
- a loop inside a loop, both over the data: O(n²);
- halving what's left each time: O(log n).

Keep only the fastest-growing term and drop constants: \`3n² + 5n + 2\` is O(n²).

Algorithms can also have a **best case** and a **worst case**. Linear search is O(1) at best (the item is first) and O(n) at worst (last, or missing). Exam questions usually mean the worst case.

**Space complexity** is the same idea for memory. Merge sort needs O(n) extra memory; bubble sort needs O(1).
`,
    worked_example: `import math

for n in [10, 1000, 1000000]:
    print(n, round(math.log2(n)), n * n)`,
    worked_example_note:
      "For a million items, a logarithmic algorithm does about 20 steps while a quadratic one does a million million. That gap is why Big O matters more than the speed of the computer.",
    quiz: [
      {
        question: "What is the Big O of binary search?",
        options: ["O(log n)", "O(n)", "O(1)", "O(n²)"],
        answer: "O(log n)",
        explanation: "Each step halves the part still to be searched, so doubling n adds only one more step.",
      },
      {
        question: "An algorithm takes 4n² + 10n + 7 steps. What is its Big O?",
        options: ["O(n²)", "O(4n²)", "O(n)", "O(n² + n)"],
        answer: "O(n²)",
        explanation: "Keep the fastest-growing term and drop the constant in front of it.",
      },
      {
        question: "A loop over n items contains another loop over the same n items. What is its Big O?",
        options: ["O(n²)", "O(2n)", "O(n)", "O(log n)"],
        answer: "O(n²)",
        explanation: "The inner loop runs n times for each of the outer loop's n repeats: n × n.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Count the comparisons: linear search",
        brief: `
Input a line of whole numbers, then a target. Do a linear search, counting each time you compare an item with the target.

Print \`Found at <position>\` (positions count from 0) or \`Not found\`, then \`Comparisons: <c>\` on the next line.

Try a target at the start and one that's missing to see the best and worst cases.`,
        starter: "",
        hints: [
          "Add 1 to the count before each comparison, inside the loop.",
          "Stop as soon as you find it.",
        ],
        solution: `items = [int(x) for x in input().split()]
target = int(input())
count = 0
found = -1
for i in range(len(items)):
    count = count + 1
    if items[i] == target:
        found = i
        break
if found == -1:
    print("Not found")
else:
    print("Found at " + str(found))
print("Comparisons: " + str(count))`,
        inputs: ["4 8 15 16 23 42\n4", "4 8 15 16 23 42\n42", "4 8 15 16 23 42\n7", "9\n9"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Count the comparisons: binary search",
        brief: `
Input a line of whole numbers in ascending order, then a target. Do an iterative binary search (\`low\`, \`high\`, \`mid = (low + high) // 2\`), counting one comparison each time you look at \`items[mid]\`.

Print \`Found at <position>\` or \`Not found\`, then \`Comparisons: <c>\` on the next line. Compare the counts with linear search on the same list.`,
        starter: "",
        hints: [
          "Loop while low <= high, adding 1 to the count each time round.",
          "If items[mid] < target, low = mid + 1; if bigger, high = mid - 1.",
        ],
        solution: `items = [int(x) for x in input().split()]
target = int(input())
low = 0
high = len(items) - 1
count = 0
found = -1
while low <= high:
    mid = (low + high) // 2
    count = count + 1
    if items[mid] == target:
        found = mid
        break
    if items[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
if found == -1:
    print("Not found")
else:
    print("Found at " + str(found))
print("Comparisons: " + str(count))`,
        inputs: ["4 8 15 16 23 42\n4", "4 8 15 16 23 42\n42", "4 8 15 16 23 42\n7", "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\n15"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "How fast do they grow?",
        brief: `
Input a whole number \`n\` (1 or more). Print how many steps each kind of algorithm would take for that \`n\`, one per line, in this format:

\`\`\`
O(1): 1
O(log n): <log2 n, rounded to 1 decimal place>
O(n): <n>
O(n log n): <n × log2 n, rounded to 1 decimal place>
O(n^2): <n squared>
O(2^n): <2 to the power n>
\`\`\`

Use \`math.log2\`. Try 10, then 30, and notice which lines explode.`,
        starter: "import math\n",
        hints: [
          "round(math.log2(n), 1) and round(n * math.log2(n), 1)",
          "2 ** n for the exponential line.",
        ],
        solution: `import math

n = int(input())
print("O(1): 1")
print("O(log n): " + str(round(math.log2(n), 1)))
print("O(n): " + str(n))
print("O(n log n): " + str(round(n * math.log2(n), 1)))
print("O(n^2): " + str(n * n))
print("O(2^n): " + str(2 ** n))`,
        inputs: ["10", "1", "30"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Every pair: O(n²)",
        brief: `
Input a line of whole numbers, then a target. Using two nested loops, check **every pair** of different positions (\`i\` before \`j\`) and count how many pairs add up to the target. Also count every pair you check.

Print \`Pairs: <p>\` and then \`Checked: <c>\`. For \`n\` numbers, the checked count is always n(n − 1) / 2: that's what makes this O(n²).`,
        starter: "",
        hints: [
          "for i in range(len(items)): for j in range(i + 1, len(items)):",
          "Add 1 to checked every time the inner loop runs.",
        ],
        solution: `items = [int(x) for x in input().split()]
target = int(input())
pairs = 0
checked = 0
for i in range(len(items)):
    for j in range(i + 1, len(items)):
        checked = checked + 1
        if items[i] + items[j] == target:
            pairs = pairs + 1
print("Pairs: " + str(pairs))
print("Checked: " + str(checked))`,
        inputs: ["1 2 3 4 5\n6", "5\n10", "2 2 2 2\n4", "10 -10 0\n0"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "From O(n²) to O(n)",
        brief: `
If the list is **sorted**, a pair that adds up to a target can be found in O(n) with two pointers: \`left\` at the start, \`right\` at the end.
- If the two items add up to the target, you've found it.
- If the sum is too small, move \`left\` one place right.
- If it's too big, move \`right\` one place left.
- Stop when they meet.

Input a line of whole numbers in ascending order, then a target. Count each sum you check. Print \`<a> + <b>\` (the two items, smaller first) and then \`Checked: <c>\`, or \`No pair\` and then \`Checked: <c>\`.`,
        starter: "",
        hints: [
          "Loop while left < right.",
          "Each time round the loop, add 1 to checked before comparing.",
        ],
        solution: `items = [int(x) for x in input().split()]
target = int(input())
left = 0
right = len(items) - 1
checked = 0
answer = None
while left < right:
    checked = checked + 1
    total = items[left] + items[right]
    if total == target:
        answer = (items[left], items[right])
        break
    if total < target:
        left = left + 1
    else:
        right = right - 1
print(str(answer[0]) + " + " + str(answer[1]) if answer else "No pair")
print("Checked: " + str(checked))`,
        inputs: ["1 3 4 6 8 11\n10", "1 2 3\n100", "2 7 11 15\n9", "5\n10"],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Bubble sort's comparisons and swaps",
        brief: `
Input a line of whole numbers. Sort them with a plain bubble sort: \`n − 1\` passes, and in each pass compare every neighbouring pair from the start to the end, swapping if they're in the wrong order. (Don't stop early.)

Count every comparison and every swap. Print the sorted list separated by spaces, then \`Comparisons: <c>\` and \`Swaps: <s>\`.`,
        starter: "",
        hints: [
          "for p in range(n - 1): for i in range(n - 1): compare items[i] and items[i + 1].",
          "Comparisons will always be (n − 1)²; swaps depends on how unsorted the list was.",
        ],
        solution: `items = [int(x) for x in input().split()]
n = len(items)
comparisons = 0
swaps = 0
for p in range(n - 1):
    for i in range(n - 1):
        comparisons = comparisons + 1
        if items[i] > items[i + 1]:
            items[i], items[i + 1] = items[i + 1], items[i]
            swaps = swaps + 1
print(" ".join(str(x) for x in items))
print("Comparisons: " + str(comparisons))
print("Swaps: " + str(swaps))`,
        inputs: ["5 1 4 2 8", "1 2 3", "3 2 1"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Worst-case binary search",
        brief: `
In the worst case, binary search on \`n\` items needs \`floor(log2 n) + 1\` comparisons.

Input a whole number \`n\` (1 or more). Make the list \`[1, 2, ..., n]\` and do a binary search for a value that **isn't** there and is bigger than everything (\`n + 1\`), counting comparisons. Print \`Counted: <c>\` and \`Formula: <f>\` on two lines, where \`f\` is \`math.floor(math.log2(n)) + 1\`.`,
        starter: "import math\n",
        hints: [
          "Use the same binary search loop as in the lesson, counting each time round.",
          "The two numbers should always match.",
        ],
        solution: `import math

n = int(input())
items = list(range(1, n + 1))
target = n + 1
low = 0
high = n - 1
count = 0
while low <= high:
    mid = (low + high) // 2
    count = count + 1
    if items[mid] == target:
        break
    if items[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
print("Counted: " + str(count))
print("Formula: " + str(math.floor(math.log2(n)) + 1))`,
        inputs: ["8", "1", "1000", "15"],
      },
    ],
  },
  {
    title: "Merge sort",
    summary: "Divide and conquer: split the list in half, sort each half, then merge them back together.",
    notes: `
**Merge sort** is a **divide and conquer** algorithm:
1. **Divide**: split the list into two halves.
2. **Conquer**: sort each half, by merge sorting it (recursion). A list of 0 or 1 items is already sorted: the base case.
3. **Combine**: **merge** the two sorted halves into one sorted list.

The merge step walks along both halves at once, always taking the smaller front item:

\`\`\`python
def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    return result + left[i:] + right[j:]   # whatever is left over
\`\`\`

---

**Complexity**: the list can be halved about log₂ n times, and each level of halving does O(n) work merging, so merge sort is **O(n log n)** in every case, best and worst. That is far quicker than bubble sort's O(n²) for large lists.

The cost is **memory**: it builds new lists while merging, so it needs O(n) extra space.

Using \`<=\` in the merge keeps equal items in their original order, which makes merge sort **stable**. That matters when sorting records by one field after another.
`,
    worked_example: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    return result + left[i:] + right[j:]

print(merge([1, 4, 9], [2, 3, 10, 12]))`,
    worked_example_note:
      "Each step compares the front of each list and takes the smaller. When one list runs out, the rest of the other is already in order, so it's added on the end.",
    quiz: [
      {
        question: "What is the Big O time complexity of merge sort?",
        options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
        answer: "O(n log n)",
        explanation: "About log₂ n levels of splitting, each with O(n) merging work.",
      },
      {
        question: "What is the base case of a recursive merge sort?",
        options: [
          "A list of 0 or 1 items, which is already sorted",
          "A list of two items",
          "A list that is already sorted",
          "The merge step",
        ],
        answer: "A list of 0 or 1 items, which is already sorted",
        explanation: "Lists keep being halved until they are this small, then the merges build them back up.",
      },
      {
        question: "What is merge sort's main disadvantage compared with bubble sort?",
        options: [
          "It needs extra memory for the lists it builds",
          "It is slower on large lists",
          "It only sorts numbers",
          "It isn't stable",
        ],
        answer: "It needs extra memory for the lists it builds",
        explanation: "Merging builds new lists, so it uses O(n) extra space; bubble sort works in place.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Merge two sorted lists",
        brief: `
Write a function \`merge(left, right)\` that takes two lists that are each already in ascending order and returns one list with all their items in ascending order. Walk along both lists with two positions, always taking the smaller front item. Don't use \`sorted\` or \`.sort()\`.

Input two lines of whole numbers (each already in order; either may be empty) and print the merged list separated by spaces.`,
        starter: "def merge(left, right):\n    pass\n",
        hints: [
          "while i < len(left) and j < len(right): compare left[i] and right[j].",
          "When the loop ends, add whatever is left: result + left[i:] + right[j:].",
        ],
        solution: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

a = [int(x) for x in input().split()]
b = [int(x) for x in input().split()]
print(" ".join(str(x) for x in merge(a, b)))`,
        inputs: ["1 4 9\n2 3 10 12", "\n5 6", "3 3\n3", "-5 0\n-10 20"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Merge sort",
        brief: `
Write a recursive function \`merge_sort(items)\` that returns a sorted copy of a list:
- if the list has 0 or 1 items, return it;
- otherwise split it at \`mid = len(items) // 2\`, merge sort each half, and merge the results.

Include your \`merge\` function from the last task. Input a line of whole numbers and print them sorted, separated by spaces. Don't use \`sorted\` or \`.sort()\`.`,
        starter: "",
        hints: [
          "left = merge_sort(items[:mid]) and right = merge_sort(items[mid:]).",
          "return merge(left, right)",
        ],
        solution: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))

print(" ".join(str(x) for x in merge_sort([int(x) for x in input().split()])))`,
        inputs: ["38 27 43 3 9 82 10", "5", "2 1", "4 4 1 9 0 -3"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Watch it merge",
        brief: `
Change your merge sort so that every time it merges two lists, it prints the merged result (items separated by spaces) before returning it. Split at \`mid = len(items) // 2\` and sort the left half before the right half.

Input a line of whole numbers. The printed lines show the order the merges happen in, from the smallest pieces up to the whole sorted list (which is the last line).`,
        starter: "",
        hints: [
          "Store the merged list in a variable, print it, then return it.",
          "Lists of 0 or 1 items are returned without printing: no merge happened.",
        ],
        solution: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    merged = merge(merge_sort(items[:mid]), merge_sort(items[mid:]))
    print(" ".join(str(x) for x in merged))
    return merged

merge_sort([int(x) for x in input().split()])`,
        inputs: ["38 27 43 3", "5 1 4 2 3", "2 1", "9 8 7 6 5 4 3 2"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "Stable sorting of records",
        brief: `
Merge sort is **stable**: items that compare equal stay in their original order. That lets you sort records by one field without scrambling ties.

Input a whole number \`n\`, then \`n\` lines each with a name and a score. Sort the students by score, **highest first**, using your own merge sort (no \`sorted\` or \`.sort()\`). Students with equal scores must stay in the order they were input. Print each as \`<name> <score>\`.`,
        starter: "",
        hints: [
          "Store (name, score) pairs, and compare the scores in merge.",
          "For highest first, take from left when left[i][1] >= right[j][1]. The = keeps it stable.",
        ],
        solution: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i][1] >= right[j][1]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))

records = []
for i in range(int(input())):
    name, score = input().split()
    records.append((name, int(score)))
for name, score in merge_sort(records):
    print(name + " " + str(score))`,
        inputs: ["4\nAda 70\nSam 85\nLi 70\nJo 90", "1\nSolo 1", "3\nA 5\nB 5\nC 5"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Count merge sort's comparisons",
        brief: `
Count how many comparisons merge sort makes: add 1 each time the \`merge\` loop compares a left item with a right item.

Input a line of whole numbers. Sort them with your merge sort (split at \`len(items) // 2\`). Print the sorted list separated by spaces, then \`Comparisons: <c>\`. Compare the number with the (n − 1)² comparisons of a plain bubble sort on the same list.`,
        starter: "",
        hints: [
          "Use a global counter, increased inside the while loop of merge.",
          "Comparisons stop as soon as one half runs out, so the count depends on the order of the input.",
        ],
        solution: `comparisons = 0

def merge(left, right):
    global comparisons
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        comparisons = comparisons + 1
        if left[i] <= right[j]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))

print(" ".join(str(x) for x in merge_sort([int(x) for x in input().split()])))
print("Comparisons: " + str(comparisons))`,
        inputs: ["38 27 43 3 9 82 10", "1 2 3 4 5 6 7 8", "8 7 6 5 4 3 2 1", "7"],
      },
    ],
    homework: [
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Merge sort for words",
        brief: `
Input a line of words. Sort them alphabetically using your own merge sort (no \`sorted\` or \`.sort()\`), and print them separated by spaces. The same code works for words, because \`<=\` compares strings alphabetically.`,
        starter: "",
        hints: [
          "Reuse merge and merge_sort from the lesson unchanged.",
          "Capital letters sort before lower-case ones, so keep the input lower case.",
        ],
        solution: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))

print(" ".join(merge_sort(input().split())))`,
        inputs: ["pear apple mango kiwi", "zebra", "b a c a"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Merge three lists",
        brief: `
Three classes have each sorted their test scores in ascending order. Input three lines of whole numbers (each in order; any may be empty). Using your \`merge\` function twice, combine them into one ascending list and print it separated by spaces.`,
        starter: "",
        hints: [
          "merge(merge(a, b), c)",
          "No need for merge sort: the inputs are already sorted.",
        ],
        solution: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i = i + 1
        else:
            result.append(right[j])
            j = j + 1
    return result + left[i:] + right[j:]

a = [int(x) for x in input().split()]
b = [int(x) for x in input().split()]
c = [int(x) for x in input().split()]
print(" ".join(str(x) for x in merge(merge(a, b), c)))`,
        inputs: ["1 5 9\n2 6\n3 4 10", "\n\n7", "5 5\n5\n1 9"],
      },
    ],
  },
  {
    title: "Quicksort",
    summary: "Choose a pivot, split the list around it, and sort each side: fast on average, slow at its worst.",
    notes: `
**Quicksort** is another divide and conquer sort:
1. Choose an item as the **pivot**.
2. **Partition**: put every other item into one of two lists: those **smaller** than the pivot and those **greater than or equal** to it.
3. Quicksort each of those lists (recursion), and join them back together: smaller, pivot, greater.

A list of 0 or 1 items is already sorted: the base case.

\`\`\`python
def quicksort(items):
    if len(items) <= 1:
        return items
    pivot = items[0]
    smaller = [x for x in items[1:] if x < pivot]
    larger = [x for x in items[1:] if x >= pivot]
    return quicksort(smaller) + [pivot] + quicksort(larger)
\`\`\`

In these tasks the pivot is always the **first** item, so the results are predictable.

---

**Complexity**: on average the pivot splits the list roughly in half, giving **O(n log n)**, and quicksort is usually faster than merge sort in practice. But if the pivot is always the smallest or largest item (for example, the first item of an already-sorted list), each partition only removes one item and quicksort becomes **O(n²)**. Choosing the pivot at random, or the middle of three items, makes that unlikely.

Quicksort can also be done **in place**, swapping items within the original list, so it needs little extra memory.
`,
    worked_example: `def quicksort(items):
    if len(items) <= 1:
        return items
    pivot = items[0]
    smaller = [x for x in items[1:] if x < pivot]
    larger = [x for x in items[1:] if x >= pivot]
    return quicksort(smaller) + [pivot] + quicksort(larger)

print(quicksort([33, 10, 55, 71, 29, 3]))`,
    worked_example_note:
      "33 is the first pivot: 10, 29 and 3 go to the smaller side, 55 and 71 to the larger. Each side is then quicksorted the same way.",
    quiz: [
      {
        question: "What is quicksort's worst-case time complexity?",
        options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
        answer: "O(n²)",
        explanation: "If every pivot is the smallest or largest item, each partition only removes one item.",
      },
      {
        question: "With the first item as the pivot, which input causes quicksort's worst case?",
        options: [
          "A list that is already sorted",
          "A list in random order",
          "A list of different numbers",
          "A list with an even number of items",
        ],
        answer: "A list that is already sorted",
        explanation: "The first item is then always the smallest, so the 'smaller' side is always empty.",
      },
      {
        question: "Pivot 20, items 35 5 20 8. Which items go in the 'smaller' list?",
        options: ["5 8", "5 8 20", "35", "35 20"],
        answer: "5 8",
        explanation: "Only items strictly less than the pivot go to the smaller side; the other 20 goes with the larger ones.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Partition around a pivot",
        brief: `
Input a line of whole numbers. Use the **first** number as the pivot. Partition the rest into items **smaller** than the pivot and items **greater than or equal** to it, keeping each list in its original order.

Print three lines: \`Smaller: \`, \`Pivot: \` and \`Larger: \`, each followed by its items separated by spaces (nothing after the colon if a list is empty).`,
        starter: "",
        hints: [
          "pivot = items[0], then loop over items[1:].",
          "Use < for smaller and >= for larger, so equal items go to the larger side.",
        ],
        solution: `items = [int(x) for x in input().split()]
pivot = items[0]
smaller = [x for x in items[1:] if x < pivot]
larger = [x for x in items[1:] if x >= pivot]
print("Smaller: " + " ".join(str(x) for x in smaller))
print("Pivot: " + str(pivot))
print("Larger: " + " ".join(str(x) for x in larger))`,
        inputs: ["33 10 55 71 29 3", "5", "20 35 5 20 8", "1 2 3"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Quicksort",
        brief: `
Write a recursive function \`quicksort(items)\` that returns a sorted copy of a list, using the **first** item as the pivot, as in the notes: lists of 0 or 1 items are returned as they are; otherwise partition into smaller and greater-or-equal, quicksort both, and join them with the pivot in the middle.

Input a line of whole numbers and print them sorted, separated by spaces. Don't use \`sorted\` or \`.sort()\`.`,
        starter: "def quicksort(items):\n    pass\n",
        hints: [
          "return quicksort(smaller) + [pivot] + quicksort(larger)",
          "Check the base case first: if len(items) <= 1: return items.",
        ],
        solution: `def quicksort(items):
    if len(items) <= 1:
        return items
    pivot = items[0]
    smaller = [x for x in items[1:] if x < pivot]
    larger = [x for x in items[1:] if x >= pivot]
    return quicksort(smaller) + [pivot] + quicksort(larger)

print(" ".join(str(x) for x in quicksort([int(x) for x in input().split()])))`,
        inputs: ["33 10 55 71 29 3", "5", "4 4 1 9 0 -3", "2 1"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Which pivots were chosen?",
        brief: `
Change your quicksort so that each time it chooses a pivot (on a list of 2 or more items), it prints \`Pivot <p> splits <smaller> | <larger>\`, with each side's items separated by spaces. Sort the smaller side before the larger side.

Input a line of whole numbers. After all the pivot lines, print \`Sorted: \` and the sorted list.

For example, the first line for \`33 10 55 71 29 3\` is \`Pivot 33 splits 10 29 3 | 55 71\`.`,
        starter: "",
        hints: [
          "Print straight after partitioning, before the recursive calls.",
          "Lists of 0 or 1 items return without printing.",
        ],
        solution: `def quicksort(items):
    if len(items) <= 1:
        return items
    pivot = items[0]
    smaller = [x for x in items[1:] if x < pivot]
    larger = [x for x in items[1:] if x >= pivot]
    print("Pivot " + str(pivot) + " splits " + " ".join(str(x) for x in smaller) + " | " + " ".join(str(x) for x in larger))
    return quicksort(smaller) + [pivot] + quicksort(larger)

result = quicksort([int(x) for x in input().split()])
print("Sorted: " + " ".join(str(x) for x in result))`,
        inputs: ["33 10 55 71 29 3", "2 1", "5 3 8 1"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "Quicksort's best and worst",
        brief: `
Count quicksort's comparisons: each item compared with the pivot during a partition counts as one (so partitioning a list of \`k\` items costs \`k − 1\`). Use the first item as the pivot.

Input a line of whole numbers. Print the sorted list separated by spaces, then \`Comparisons: <c>\`. Then try an already-sorted list of the same length: it should cost far more, n(n − 1) / 2.`,
        starter: "",
        hints: [
          "Add len(items) - 1 to a global counter each time you partition.",
          "Count once per partition, not twice for the two list comprehensions.",
        ],
        solution: `comparisons = 0

def quicksort(items):
    global comparisons
    if len(items) <= 1:
        return items
    pivot = items[0]
    comparisons = comparisons + len(items) - 1
    smaller = [x for x in items[1:] if x < pivot]
    larger = [x for x in items[1:] if x >= pivot]
    return quicksort(smaller) + [pivot] + quicksort(larger)

result = quicksort([int(x) for x in input().split()])
print(" ".join(str(x) for x in result))
print("Comparisons: " + str(comparisons))`,
        inputs: ["4 2 6 1 3 5 7", "1 2 3 4 5 6 7", "7 6 5 4 3 2 1", "9"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Quicksort in place",
        brief: `
Quicksort can sort a list without making new lists, using the **Lomuto** partition. To partition the part of the list from \`low\` to \`high\`:
- the pivot is the **last** item, \`items[high]\`;
- keep a position \`i\`, starting at \`low\`. For each \`j\` from \`low\` to \`high − 1\`: if \`items[j]\` is smaller than the pivot, swap \`items[i]\` and \`items[j]\`, then add 1 to \`i\`;
- finally swap \`items[i]\` with \`items[high]\`. The pivot is now at \`i\`, in its final place.

Then quicksort \`low\` to \`i − 1\` and \`i + 1\` to \`high\`. Stop when \`low >= high\`.

Input a line of whole numbers. After **each** partition, print the whole list separated by spaces. Finally print \`Sorted: \` and the list.`,
        starter: "",
        hints: [
          "Write partition(items, low, high), which returns i, and quicksort(items, low, high).",
          "Call quicksort(items, 0, len(items) - 1) once; it changes the list itself.",
        ],
        solution: `def partition(items, low, high):
    pivot = items[high]
    i = low
    for j in range(low, high):
        if items[j] < pivot:
            items[i], items[j] = items[j], items[i]
            i = i + 1
    items[i], items[high] = items[high], items[i]
    print(" ".join(str(x) for x in items))
    return i

def quicksort(items, low, high):
    if low >= high:
        return
    p = partition(items, low, high)
    quicksort(items, low, p - 1)
    quicksort(items, p + 1, high)

items = [int(x) for x in input().split()]
quicksort(items, 0, len(items) - 1)
print("Sorted: " + " ".join(str(x) for x in items))`,
        inputs: ["5 2 9 1 6", "3 1 2", "1 2 3 4"],
      },
    ],
    homework: [
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Biggest first",
        brief: `
Input a line of whole numbers. Sort them into **descending** order using your own quicksort with the first item as the pivot (no \`sorted\` or \`.sort()\`), and print them separated by spaces.

Only the partition needs to change: put the **greater** items on the first side.`,
        starter: "",
        hints: [
          "Split into larger (x > pivot) and smaller_or_equal (x <= pivot).",
          "return quicksort(larger) + [pivot] + quicksort(smaller_or_equal)",
        ],
        solution: `def quicksort(items):
    if len(items) <= 1:
        return items
    pivot = items[0]
    larger = [x for x in items[1:] if x > pivot]
    rest = [x for x in items[1:] if x <= pivot]
    return quicksort(larger) + [pivot] + quicksort(rest)

print(" ".join(str(x) for x in quicksort([int(x) for x in input().split()])))`,
        inputs: ["3 9 1 7", "4", "5 5 2 8"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "The k-th smallest",
        brief: `
To find the k-th smallest item, you don't need to sort everything. **Quickselect** partitions around the first item (smaller / greater-or-equal, as in quicksort), then looks only in the side that must contain the answer:
- if \`k\` is at most the size of the smaller side, find the k-th smallest in the smaller side;
- if \`k\` is exactly one more than that size, the pivot is the answer;
- otherwise find the (k − size of smaller − 1)-th smallest in the larger side.

Input a line of whole numbers and then \`k\` (1 means the smallest). Print the k-th smallest.`,
        starter: "",
        hints: [
          "Write a recursive select(items, k).",
          "Only one recursive call is made each time, which is why it's quicker than a full sort on average.",
        ],
        solution: `def select(items, k):
    pivot = items[0]
    smaller = [x for x in items[1:] if x < pivot]
    larger = [x for x in items[1:] if x >= pivot]
    if k <= len(smaller):
        return select(smaller, k)
    if k == len(smaller) + 1:
        return pivot
    return select(larger, k - len(smaller) - 1)

items = [int(x) for x in input().split()]
print(select(items, int(input())))`,
        inputs: ["7 2 9 4 1\n2", "7 2 9 4 1\n5", "5\n1", "3 3 1\n3"],
      },
    ],
  },
  {
    title: "Dijkstra's shortest path",
    summary: "Finding the shortest route from one vertex to every other in a weighted graph.",
    notes: `
**Dijkstra's algorithm** finds the shortest distance from a start vertex to every other vertex in a weighted graph whose weights are not negative.

1. Give the start a distance of 0 and every other vertex a distance of **infinity**. Nothing is **visited** yet.
2. Choose the **unvisited** vertex with the **smallest** distance. Mark it visited: its distance is now final.
3. For each of its neighbours, work out: (this vertex's distance) + (edge weight). If that is smaller than the neighbour's current distance, update the neighbour's distance and record this vertex as its **previous** vertex.
4. Repeat from step 2 until every reachable vertex is visited.

To get the actual route to a vertex, follow the **previous** vertices backwards from it to the start, then reverse.

---

It works because once the closest unvisited vertex is chosen, no later route could reach it more cheaply: every other route would have to go through a vertex that is already further away.

In these tasks, when two unvisited vertices tie for the smallest distance, choose the one that comes first **alphabetically**. A **priority queue** of (distance, vertex) makes choosing the smallest fast in a large graph.

Dijkstra is used for satnav routes, network routing (finding the quickest path for data) and games.
`,
    worked_example: `${GRAPH}
INF = float("inf")
distance = {v: INF for v in graph}
distance["A"] = 0
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w
print(distance)`,
    worked_example_demo_input: ["4", "A B 4", "A C 1", "C B 2", "B D 5"],
    worked_example_note:
      "B's distance starts as 4 (straight from A), but once C is visited, the route A, C, B costs 1 + 2 = 3, so B's distance is updated before B is chosen.",
    quiz: [
      {
        question: "At each step, which vertex does Dijkstra's algorithm visit next?",
        options: [
          "The unvisited vertex with the smallest distance so far",
          "The vertex with the most edges",
          "The vertex nearest the end",
          "The next vertex alphabetically",
        ],
        answer: "The unvisited vertex with the smallest distance so far",
        explanation: "Its distance can't be improved any more, so it becomes final.",
      },
      {
        question: "What distance does every vertex except the start begin with?",
        options: ["Infinity", "0", "1", "Its number of edges"],
        answer: "Infinity",
        explanation: "No route to it is known yet; any real route will be smaller.",
      },
      {
        question: "Why does Dijkstra's algorithm need weights that aren't negative?",
        options: [
          "A negative edge could make a visited vertex's 'final' distance wrong",
          "Negative numbers can't be stored",
          "It only works on unweighted graphs",
          "Negative edges make the graph directed",
        ],
        answer: "A negative edge could make a visited vertex's 'final' distance wrong",
        explanation: "The algorithm assumes adding an edge never makes a route shorter.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 4,
        xp: 35,
        title: "Shortest distances",
        brief: `
The starter code reads an **undirected** weighted graph: a whole number \`n\`, then \`n\` lines \`<vertex> <vertex> <weight>\`. \`graph["A"]["B"]\` is the weight between A and B.

Input a start vertex. Use Dijkstra's algorithm (from the notes; ties go to the alphabetically first vertex) to find the shortest distance to every vertex. Print every vertex in alphabetical order as \`<vertex>: <distance>\`.`,
        starter: GRAPH,
        hints: [
          "distance = {v: float(\"inf\") for v in graph}, then distance[start] = 0.",
          "min(unvisited, key=lambda v: (distance[v], v)) picks the smallest distance, ties alphabetical.",
        ],
        solution: `${GRAPH}
start = input()
INF = float("inf")
distance = {v: INF for v in graph}
distance[start] = 0
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w
for v in sorted(graph):
    print(v + ": " + str(distance[v]))`,
        inputs: ["4\nA B 4\nA C 1\nC B 2\nB D 5\nA", "5\nA B 7\nA C 9\nA F 14\nB C 10\nC F 2\nF", "1\nX Y 3\nY"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "The route itself",
        brief: `
Using the starter code's graph, input a start vertex and an end vertex. Run Dijkstra's algorithm, and whenever you update a vertex's distance, also record its \`previous\` vertex.

Then rebuild the route by following \`previous\` from the end back to the start, and reverse it. Print the route joined by \` -> \`, then \`Distance: \` and its length. If the end can't be reached, print \`No route\`.`,
        starter: GRAPH,
        hints: [
          "previous[n] = current, at the same moment you update distance[n].",
          "Build the route: v = end; while v != start: route.append(v); v = previous[v]. Then add start and reverse.",
        ],
        solution: `${GRAPH}
start = input()
end = input()
INF = float("inf")
distance = {v: INF for v in graph}
distance[start] = 0
previous = {}
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w
            previous[n] = current
if distance[end] == INF:
    print("No route")
else:
    route = [end]
    while route[-1] != start:
        route.append(previous[route[-1]])
    route.reverse()
    print(" -> ".join(route))
    print("Distance: " + str(distance[end]))`,
        inputs: ["4\nA B 4\nA C 1\nC B 2\nB D 5\nA\nD", "5\nA B 7\nA C 9\nA F 14\nB C 10\nC F 2\nA\nF", "2\nA B 1\nC D 1\nA\nD"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "The order vertices are finalised",
        brief: `
Exam questions often ask you to show the order Dijkstra's algorithm visits the vertices. Using the starter code's graph, input a start vertex. Run Dijkstra (ties alphabetical) and, each time a vertex is chosen and marked visited, print \`<vertex> <distance>\`.

Unreachable vertices are never chosen, so they aren't printed.`,
        starter: GRAPH,
        hints: [
          "Print straight after adding current to visited.",
          "Stop when the smallest remaining distance is infinity.",
        ],
        solution: `${GRAPH}
start = input()
INF = float("inf")
distance = {v: INF for v in graph}
distance[start] = 0
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    print(current + " " + str(distance[current]))
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w`,
        inputs: ["4\nA B 4\nA C 1\nC B 2\nB D 5\nA", "6\nA B 2\nA C 5\nB C 1\nB D 7\nC D 2\nD E 1\nA", "2\nA B 1\nC D 1\nC"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "One-way streets",
        brief: `
Dijkstra works on directed graphs too. Input a whole number \`n\`, then \`n\` lines \`<from> <to> <weight>\`, each a **one-way** road. Then input a start vertex.

Build the graph so every vertex mentioned appears (even one with no roads out). Run Dijkstra (ties alphabetical) and print every vertex alphabetically as \`<vertex>: <distance>\`, writing \`unreachable\` for any that can't be reached.`,
        starter: "",
        hints: [
          "graph.setdefault(a, {})[b] = w, and graph.setdefault(b, {}) so b appears even with no roads out.",
          "Print \"unreachable\" when the distance is still infinity.",
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b, w = input().split()
    graph.setdefault(a, {})[b] = int(w)
    graph.setdefault(b, {})
start = input()
INF = float("inf")
distance = {v: INF for v in graph}
distance[start] = 0
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w
for v in sorted(graph):
    print(v + ": " + ("unreachable" if distance[v] == INF else str(distance[v])))`,
        inputs: ["3\nA B 5\nB C 3\nC A 1\nB", "3\nA B 5\nB C 3\nA C 10\nA", "2\nA B 1\nC B 1\nA"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Cheapest path across a grid",
        brief: `
Each square of a grid has a cost to step onto it. You start on the top-left square (its cost counts) and want to reach the bottom-right square as cheaply as possible, moving up, down, left or right.

Treat each square as a vertex, and stepping onto a square as an edge weighted by that square's cost. Use Dijkstra with \`heapq\` as the priority queue: push \`(distance, row, col)\` and pop the smallest.

Input the number of rows, then each row of single-digit costs with no spaces (like \`131\`). Print the cheapest total cost.`,
        starter: "import heapq\n",
        hints: [
          "Start with heap = [(grid[0][0], 0, 0)] and best = {(0, 0): grid[0][0]}.",
          "When you pop a square whose distance is bigger than best for it, skip it: a cheaper route was already found.",
        ],
        solution: `import heapq

rows = int(input())
grid = [[int(ch) for ch in input()] for i in range(rows)]
cols = len(grid[0])
best = {(0, 0): grid[0][0]}
heap = [(grid[0][0], 0, 0)]
while heap:
    d, r, c = heapq.heappop(heap)
    if (r, c) == (rows - 1, cols - 1):
        print(d)
        break
    if d > best[(r, c)]:
        continue
    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            nd = d + grid[nr][nc]
            if nd < best.get((nr, nc), float("inf")):
                best[(nr, nc)] = nd
                heapq.heappush(heap, (nd, nr, nc))`,
        inputs: ["3\n131\n151\n111", "1\n7", "3\n199\n119\n911", "2\n12\n34"],
      },
    ],
    homework: [
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "Quickest journey",
        brief: `
A train network's journey times (in minutes) are given as undirected edges. Input a whole number \`n\`, then \`n\` lines \`<station> <station> <minutes>\`, then a start station and a destination on two lines.

Use Dijkstra's algorithm to print \`<minutes> minutes\` for the quickest journey, or \`No route\`.`,
        starter: "",
        hints: [
          "Build an undirected weighted graph as a dictionary of dictionaries.",
          "You can stop as soon as the destination is chosen as the current vertex.",
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b, w = input().split()
    graph.setdefault(a, {})[b] = int(w)
    graph.setdefault(b, {})[a] = int(w)
start = input()
end = input()
INF = float("inf")
distance = {v: INF for v in graph}
distance[start] = 0
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w
print(str(distance[end]) + " minutes" if distance.get(end, INF) != INF else "No route")`,
        inputs: ["3\nLeeds York 25\nYork Hull 45\nLeeds Hull 80\nLeeds\nHull", "1\nA B 5\nB\nA", "2\nA B 1\nC D 1\nA\nD"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "Within reach",
        brief: `
Input an undirected weighted graph (a whole number \`n\`, then \`n\` lines \`<vertex> <vertex> <weight>\`), then a start vertex, then a maximum distance.

Use Dijkstra's algorithm to find every **other** vertex whose shortest distance from the start is at most the maximum. Print them alphabetically separated by spaces, or \`None\`.`,
        starter: "",
        hints: [
          "Run Dijkstra as usual, then filter the distances.",
          "Leave out the start vertex itself.",
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b, w = input().split()
    graph.setdefault(a, {})[b] = int(w)
    graph.setdefault(b, {})[a] = int(w)
start = input()
limit = int(input())
INF = float("inf")
distance = {v: INF for v in graph}
distance[start] = 0
visited = set()
while len(visited) < len(graph):
    current = min((v for v in graph if v not in visited), key=lambda v: (distance[v], v))
    if distance[current] == INF:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if distance[current] + w < distance[n]:
            distance[n] = distance[current] + w
near = sorted(v for v in graph if v != start and distance[v] <= limit)
print(" ".join(near) if near else "None")`,
        inputs: ["4\nA B 4\nA C 1\nC B 2\nB D 5\nA\n3", "4\nA B 4\nA C 1\nC B 2\nB D 5\nD\n1", "2\nX Y 2\nY Z 2\nY\n2"],
      },
    ],
  },
  {
    title: "A* search (OCR)",
    summary: "Dijkstra plus a sensible guess of the distance left, so it heads towards the goal instead of searching everywhere.",
    notes: `
*This lesson is on the OCR specification. AQA doesn't examine A*.*

Dijkstra's algorithm spreads out in every direction from the start. **A\\*** (A star) finds a shortest path to **one goal** more quickly by also using a **heuristic**: an estimate of how far each vertex is from the goal.

For each vertex A* keeps:
- **g**: the actual distance from the start so far (just like Dijkstra);
- **h**: the heuristic's estimate of the distance from it to the goal;
- **f = g + h**: the estimated length of the whole route through it.

At each step it visits the open vertex with the **smallest f**, instead of the smallest g. It stops as soon as the goal is chosen.

---

On a grid where you can move up, down, left and right, a good heuristic is the **Manhattan distance**: the number of rows plus the number of columns between the square and the goal, ignoring walls.

\`\`\`python
def h(r, c, goal_r, goal_c):
    return abs(r - goal_r) + abs(c - goal_c)
\`\`\`

A heuristic must never **overestimate** the real distance (it must be **admissible**); then A* is still guaranteed to find a shortest path. A heuristic of 0 everywhere turns A* back into Dijkstra. The better the heuristic, the fewer vertices A* has to look at.

In these tasks, when two open vertices tie on f, choose the one with the smaller h, then the one first alphabetically (or the smaller row, then column).
`,
    worked_example: `def manhattan(r, c, gr, gc):
    return abs(r - gr) + abs(c - gc)

goal = (4, 4)
for square in [(0, 0), (2, 3), (4, 4)]:
    print(square, manhattan(square[0], square[1], goal[0], goal[1]))`,
    worked_example_note:
      "The Manhattan distance counts how many moves you'd need with no walls in the way, so it never overestimates: it's admissible.",
    quiz: [
      {
        question: "In A*, what is f?",
        options: [
          "g + h: the distance so far plus the estimated distance left",
          "The number of vertices visited",
          "The heuristic on its own",
          "The final route's length",
        ],
        answer: "g + h: the distance so far plus the estimated distance left",
        explanation: "A* always visits the open vertex with the smallest f.",
      },
      {
        question: "What does it mean for a heuristic to be admissible?",
        options: [
          "It never overestimates the real distance to the goal",
          "It is always exactly right",
          "It is always 0",
          "It only works on grids",
        ],
        answer: "It never overestimates the real distance to the goal",
        explanation: "With an admissible heuristic, A* still finds a shortest path.",
      },
      {
        question: "If the heuristic is 0 for every vertex, A* behaves like which algorithm?",
        options: ["Dijkstra's algorithm", "Breadth-first search", "Binary search", "Merge sort"],
        answer: "Dijkstra's algorithm",
        explanation: "f is then just g, so A* picks the smallest distance so far, exactly as Dijkstra does.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 3,
        xp: 25,
        title: "Manhattan distance",
        brief: `
Write a function \`manhattan(r, c, goal_r, goal_c)\` that returns the number of rows plus the number of columns between square (r, c) and the goal square.

Input the goal as \`row col\` on one line. Then input a whole number \`n\` and \`n\` squares, each \`row col\`. For each square print \`h = <value>\`.`,
        starter: "def manhattan(r, c, goal_r, goal_c):\n    pass\n",
        hints: [
          "abs(r - goal_r) + abs(c - goal_c)",
          "Split each input line into two whole numbers.",
        ],
        solution: `def manhattan(r, c, goal_r, goal_c):
    return abs(r - goal_r) + abs(c - goal_c)

gr, gc = [int(x) for x in input().split()]
for i in range(int(input())):
    r, c = [int(x) for x in input().split()]
    print("h = " + str(manhattan(r, c, gr, gc)))`,
        inputs: ["4 4\n3\n0 0\n2 3\n4 4", "0 0\n1\n5 2", "2 2\n2\n2 0\n0 2"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "A* on a graph",
        brief: `
Input an undirected weighted graph: a whole number \`n\`, then \`n\` lines \`<vertex> <vertex> <weight>\`. Then input the heuristic: a whole number \`k\` and \`k\` lines \`<vertex> <h>\`. Finally input the start and the goal on two lines.

Run A*: keep \`g\` (like Dijkstra's distance, starting at infinity, 0 for the start) and a set of visited vertices. Each step, choose the unvisited vertex with a finite \`g\` and the smallest \`f = g + h\` (ties: smaller \`h\`, then alphabetical). Stop when the goal is chosen. Update neighbours just as Dijkstra does, recording \`previous\`.

Print the route joined by \` -> \` and then \`Cost: <g of goal>\`.`,
        starter: "",
        hints: [
          "Candidates are vertices not visited with g[v] < infinity.",
          "Choose with min(candidates, key=lambda v: (g[v] + h[v], h[v], v)).",
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b, w = input().split()
    graph.setdefault(a, {})[b] = int(w)
    graph.setdefault(b, {})[a] = int(w)
h = {}
for i in range(int(input())):
    v, est = input().split()
    h[v] = int(est)
start = input()
goal = input()
INF = float("inf")
g = {v: INF for v in graph}
g[start] = 0
previous = {}
visited = set()
while True:
    candidates = [v for v in graph if v not in visited and g[v] < INF]
    current = min(candidates, key=lambda v: (g[v] + h[v], h[v], v))
    if current == goal:
        break
    visited.add(current)
    for n, w in graph[current].items():
        if g[current] + w < g[n]:
            g[n] = g[current] + w
            previous[n] = current
route = [goal]
while route[-1] != start:
    route.append(previous[route[-1]])
route.reverse()
print(" -> ".join(route))
print("Cost: " + str(g[goal]))`,
        inputs: [
          "5\nS A 2\nS B 4\nA C 5\nB C 1\nC G 3\n5\nS 6\nA 6\nB 3\nC 3\nG 0\nS\nG",
          "1\nX Y 9\n2\nX 9\nY 0\nX\nY",
          "4\nA B 1\nB D 1\nA C 1\nC D 5\n4\nA 2\nB 1\nC 1\nD 0\nA\nD",
        ],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "A* through a maze",
        brief: `
A grid is made of \`.\` (open) and \`#\` (wall), with \`S\` and \`G\` (goal) on open squares. Moves are up, down, left or right, each costing 1.

Use A* with the Manhattan distance to G as \`h\`. Keep \`g\` for each square found so far; each step choose the open (found but not yet visited) square with the smallest \`f = g + h\`, ties broken by smaller \`h\`, then smaller row, then smaller column. Stop when G is chosen.

Input the number of rows, then each row. Print \`Moves: <g of G>\`, or \`No path\` if G can't be reached.`,
        starter: "",
        hints: [
          "g = {start: 0}; the open squares are those in g but not visited.",
          "min(open_squares, key=lambda s: (g[s] + h(s), h(s), s[0], s[1]))",
        ],
        solution: `rows = int(input())
grid = [input() for i in range(rows)]
for r in range(rows):
    for c in range(len(grid[r])):
        if grid[r][c] == "S":
            start = (r, c)
        if grid[r][c] == "G":
            goal = (r, c)

def h(s):
    return abs(s[0] - goal[0]) + abs(s[1] - goal[1])

g = {start: 0}
visited = set()
answer = None
while True:
    open_squares = [s for s in g if s not in visited]
    if not open_squares:
        break
    current = min(open_squares, key=lambda s: (g[s] + h(s), h(s), s[0], s[1]))
    if current == goal:
        answer = g[current]
        break
    visited.add(current)
    r, c = current
    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < len(grid[nr]) and grid[nr][nc] != "#":
            if g[current] + 1 < g.get((nr, nc), float("inf")):
                g[(nr, nc)] = g[current] + 1
print("Moves: " + str(answer) if answer is not None else "No path")`,
        inputs: ["3\nS..\n.#.\n..G", "3\nS#G\n.#.\n...", "2\nS#\n#G", "1\nSG"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        title: "How much work does the heuristic save?",
        brief: `
Run the same grid search twice and compare how many squares each **visits** (marks as visited, including the goal):
- once with A* using the Manhattan distance;
- once with \`h = 0\` everywhere, which is Dijkstra.

Use the same rules as the last task (ties: smaller \`h\`, then row, then column). Input the grid as before (it will always have a path). Print \`A*: <visited>\`, then \`Dijkstra: <visited>\`, then \`Moves: <moves>\` (both find the same length).`,
        starter: "",
        hints: [
          "Write one function search(grid, use_heuristic) that returns (visited count, moves).",
          "Count the goal as visited when it is chosen.",
        ],
        solution: `rows = int(input())
grid = [input() for i in range(rows)]
for r in range(rows):
    for c in range(len(grid[r])):
        if grid[r][c] == "S":
            start = (r, c)
        if grid[r][c] == "G":
            goal = (r, c)

def search(use_heuristic):
    def h(s):
        return abs(s[0] - goal[0]) + abs(s[1] - goal[1]) if use_heuristic else 0
    g = {start: 0}
    visited = set()
    while True:
        open_squares = [s for s in g if s not in visited]
        current = min(open_squares, key=lambda s: (g[s] + h(s), h(s), s[0], s[1]))
        visited.add(current)
        if current == goal:
            return len(visited), g[current]
        r, c = current
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < len(grid[nr]) and grid[nr][nc] != "#":
                if g[current] + 1 < g.get((nr, nc), float("inf")):
                    g[(nr, nc)] = g[current] + 1

a_visited, moves = search(True)
d_visited, d_moves = search(False)
print("A*: " + str(a_visited))
print("Dijkstra: " + str(d_visited))
print("Moves: " + str(moves))`,
        inputs: ["5\nS....\n.....\n.....\n.....\n....G", "3\nS.#\n..#\n..G", "1\nS...G"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Draw the path",
        brief: `
Extend A* through a maze (same rules as before) to record each square's \`previous\` square whenever its \`g\` is updated. When G is chosen, follow \`previous\` back to S and mark every square **between** them with \`*\` (leave S and G as they are).

Input the grid as before (it will always have a path). Print the grid with the path drawn on it, then \`Moves: <moves>\`.`,
        starter: "",
        hints: [
          "Store the grid as a list of lists so squares can be changed.",
          "Walk back: s = previous[goal]; while s != start: mark it, then s = previous[s].",
        ],
        solution: `rows = int(input())
grid = [list(input()) for i in range(rows)]
for r in range(rows):
    for c in range(len(grid[r])):
        if grid[r][c] == "S":
            start = (r, c)
        if grid[r][c] == "G":
            goal = (r, c)

def h(s):
    return abs(s[0] - goal[0]) + abs(s[1] - goal[1])

g = {start: 0}
previous = {}
visited = set()
while True:
    open_squares = [s for s in g if s not in visited]
    current = min(open_squares, key=lambda s: (g[s] + h(s), h(s), s[0], s[1]))
    if current == goal:
        break
    visited.add(current)
    r, c = current
    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < len(grid[nr]) and grid[nr][nc] != "#":
            if g[current] + 1 < g.get((nr, nc), float("inf")):
                g[(nr, nc)] = g[current] + 1
                previous[(nr, nc)] = current
s = previous.get(goal, start)
while s != start:
    grid[s[0]][s[1]] = "*"
    s = previous[s]
for row in grid:
    print("".join(row))
print("Moves: " + str(g[goal]))`,
        inputs: ["3\nS..\n##.\nG..", "3\nS.#\n..#\n..G", "1\nSG"],
      },
    ],
    homework: [
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Is the heuristic admissible?",
        brief: `
A heuristic is admissible if it never overestimates the real shortest distance to the goal.

Input a whole number \`n\`, then \`n\` lines \`<vertex> <h> <real>\`, where \`h\` is the heuristic's estimate and \`real\` is the true shortest distance to the goal. Print \`Admissible\` if every estimate is at most the real distance; otherwise print \`Overestimates at \` followed by each vertex where it overestimates, in input order, separated by spaces.`,
        starter: "",
        hints: [
          "Collect the vertices where h > real.",
          "An empty list means the heuristic is admissible.",
        ],
        solution: `bad = []
for i in range(int(input())):
    v, h, real = input().split()
    if int(h) > int(real):
        bad.append(v)
print("Admissible" if not bad else "Overestimates at " + " ".join(bad))`,
        inputs: ["3\nA 4 5\nB 2 2\nC 0 0", "2\nA 7 5\nB 3 1", "1\nG 0 0"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Which vertex next?",
        brief: `
Partway through an A* search, the open vertices have these values. Input a whole number \`n\`, then \`n\` lines \`<vertex> <g> <h>\`.

Print each vertex with its \`f\` value as \`<vertex>: f = <f>\`, in input order. Then print \`Next: \` and the vertex A* would choose: smallest \`f\`, ties broken by smaller \`h\`, then alphabetical.`,
        starter: "",
        hints: [
          "f = g + h for each vertex.",
          "Build a tuple (f, h, name) for each vertex: min() of the tuples breaks ties in exactly that order.",
        ],
        solution: `rows = []
for i in range(int(input())):
    v, g, h = input().split()
    f = int(g) + int(h)
    print(v + ": f = " + str(f))
    rows.append((f, int(h), v))
print("Next: " + min(rows)[2])`,
        inputs: ["3\nA 2 6\nB 4 3\nC 5 3", "2\nX 1 1\nY 0 2", "1\nG 9 0"],
      },
    ],
  },
];
