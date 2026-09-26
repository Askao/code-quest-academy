// Practice tasks: Searching & Sorting. Expected outputs are produced by an
// independent JavaScript implementation of each algorithm; the Python
// reference solutions are then checked against them in real Pyodide.
const t = (stdin, expect) => ({ stdin, expect });
const lines = (...parts) => parts.flat().join("\n");
const withN = (arr) => [arr.length, ...arr];
const show = (arr) => arr.join(" ");

// --- JS reference implementations
const linearIndex = (a, x) => a.indexOf(x);
const linearChecks = (a, x) => (a.includes(x) ? a.indexOf(x) + 1 : a.length);
const positions = (a, x) => a.map((v, i) => (v === x ? i : -1)).filter((i) => i >= 0);
const binary = (a, x) => {
  let low = 0, high = a.length - 1, checks = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    checks++;
    if (a[mid] === x) return { index: mid, checks };
    if (a[mid] < x) low = mid + 1; else high = mid - 1;
  }
  return { index: -1, checks };
};
const bubblePass = (a) => {
  const b = [...a];
  let swaps = 0;
  for (let i = 0; i < b.length - 1; i++) if (b[i] > b[i + 1]) { [b[i], b[i + 1]] = [b[i + 1], b[i]]; swaps++; }
  return { list: b, swaps };
};
const bubbleAll = (a, desc = false) => {
  const b = [...a];
  let swaps = 0, passes = 0, swapped = true;
  while (swapped) {
    swapped = false; passes++;
    for (let i = 0; i < b.length - 1; i++) {
      if (desc ? b[i] < b[i + 1] : b[i] > b[i + 1]) { [b[i], b[i + 1]] = [b[i + 1], b[i]]; swaps++; swapped = true; }
    }
  }
  return { list: b, swaps, passes };
};
const insertion = (a) => {
  const b = [...a];
  const steps = [];
  let shifts = 0;
  for (let i = 1; i < b.length; i++) {
    const key = b[i];
    let j = i - 1;
    while (j >= 0 && b[j] > key) { b[j + 1] = b[j]; j--; shifts++; }
    b[j + 1] = key;
    steps.push([...b]);
  }
  return { list: b, steps, shifts };
};
const mergeSorted = (a, b) => {
  const out = []; let i = 0, j = 0;
  while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
  return [...out, ...a.slice(i), ...b.slice(j)];
};

export const tasks = [
  // ============================================================ linear search
  {
    slug: "gcse-searching-sorting-p-01", tier: 1, difficulty: 1, xp: 10, title: "Is it in the list?",
    brief: "Input a whole number N. Then input N whole numbers, one per line, to make a list. Finally input one more whole number, the number to search for.\n\nPrint `Found` if that number is in the list. Otherwise print `Not found`.\n\nFor example, the list 4, 9, 2 with the number 9 prints `Found`.",
    starter: "", hints: ["Store the N numbers in a list first, then read the number to search for.", "Python can check for you with `if target in numbers:`, or you can loop through the list and compare each item."],
    tests: [[4, 9, 2, 7], 9, [4, 9, 2, 7], 5, [1], 1, [3, 3, 3], 4].reduce((acc, _, i, arr) => (i % 2 === 0 ? [...acc, (() => { const a = arr[i], x = arr[i + 1]; return t(lines(withN(a), x), a.includes(x) ? "Found" : "Not found"); })()] : acc), []),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
if target in numbers:
    print("Found")
else:
    print("Not found")`,
  },
  {
    slug: "gcse-searching-sorting-p-02", tier: 1, difficulty: 2, xp: 15, title: "Find the position",
    brief: "Input a whole number N. Then input N whole numbers, one per line, to make a list. Finally input the number to search for.\n\nPrint the position of the first match. The first item in the list is at position 0. If the number is not in the list, print `-1`.\n\nFor example, the list 4, 9, 2, 9 with the number 9 prints `1`.",
    starter: "", hints: ["Loop through the positions 0, 1, 2 … with `for i in range(len(numbers))` so that you know where you are.", "Stop as soon as you find a match. If the loop finishes without finding one, print -1."],
    tests: [[[4, 9, 2, 9], 9], [[4, 9, 2, 9], 4], [[4, 9, 2, 9], 2], [[4, 9, 2, 9], 8], [[7], 7]].map(([a, x]) => t(lines(withN(a), x), String(linearIndex(a, x)))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
position = -1
for i in range(len(numbers)):
    if numbers[i] == target and position == -1:
        position = i
print(position)`,
  },
  {
    slug: "gcse-searching-sorting-p-03", tier: 2, difficulty: 2, xp: 15, title: "How many checks?",
    brief: "A linear search checks each item in the list in turn, from the first item, and stops as soon as it finds the number it is looking for.\n\nInput a whole number N, then N whole numbers (one per line) to make a list, then the number to search for.\n\nPrint how many items the linear search checks. If the number is not in the list, every item is checked.\n\nFor example, the list 6, 2, 8, 5 with the number 8 prints `3` (it checks 6, then 2, then 8).",
    starter: "", hints: ["Keep a counter that goes up by 1 for every item you look at.", "Stop the loop as soon as the item matches (use `break`). Count the item that matches too."],
    tests: [[[6, 2, 8, 5], 8], [[6, 2, 8, 5], 6], [[6, 2, 8, 5], 5], [[6, 2, 8, 5], 1], [[4], 4]].map(([a, x]) => t(lines(withN(a), x), String(linearChecks(a, x)))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
checks = 0
for item in numbers:
    checks = checks + 1
    if item == target:
        break
print(checks)`,
  },
  {
    slug: "gcse-searching-sorting-p-04", tier: 2, difficulty: 2, xp: 15, title: "Search a list of names",
    brief: "Input a whole number N. Then input N names, one per line. Finally input a name to search for.\n\nPrint `Found` if the name is in the list. Otherwise print `Not found`. Capital letters matter, so `ann` and `Ann` are different names.",
    starter: "", hints: ["This is the same idea as searching for a number, but the items are strings, so do not use `int()`.", "Use `==` to compare the names, or `in` to check the whole list."],
    tests: [[["Ann", "Ben", "Cara"], "Ben"], [["Ann", "Ben", "Cara"], "ben"], [["Ann", "Ben", "Cara"], "Dev"], [["Zoe"], "Zoe"]].map(([a, x]) => t(lines(withN(a), x), a.includes(x) ? "Found" : "Not found")),
    solution: `n = int(input())
names = []
for i in range(n):
    names.append(input())
wanted = input()
if wanted in names:
    print("Found")
else:
    print("Not found")`,
  },
  {
    slug: "gcse-searching-sorting-p-05", tier: 2, difficulty: 3, xp: 20, title: "How many times?",
    brief: "Input a whole number N. Then input N whole numbers, one per line, to make a list. Finally input the number to search for.\n\nPrint how many times that number appears in the list. Print `0` if it does not appear.\n\nFor example, the list 3, 7, 3, 3 with the number 3 prints `3`.",
    starter: "", hints: ["This time you cannot stop at the first match - you need to check every item.", "Keep a counter that starts at 0 and goes up by 1 each time an item equals the target."],
    tests: [[[3, 7, 3, 3], 3], [[3, 7, 3, 3], 7], [[3, 7, 3, 3], 9], [[5], 5]].map(([a, x]) => t(lines(withN(a), x), String(a.filter((v) => v === x).length))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
count = 0
for item in numbers:
    if item == target:
        count = count + 1
print(count)`,
  },
  {
    slug: "gcse-searching-sorting-p-06", tier: 3, difficulty: 3, xp: 25, title: "Every position",
    brief: "Input a whole number N. Then input N whole numbers, one per line, to make a list. Finally input the number to search for.\n\nPrint every position where the number appears, in order, on one line with a space between them. The first item is at position 0. If it does not appear, print `None`.\n\nFor example, the list 5, 2, 5, 9, 5 with the number 5 prints `0 2 4`.",
    starter: "", hints: ["Loop through the positions and collect the matching positions in a new list.", "At the end, if your new list is empty print `None`. Otherwise join the positions into one line: `\" \".join(str(p) for p in found)`."],
    tests: [[[5, 2, 5, 9, 5], 5], [[5, 2, 5, 9, 5], 9], [[5, 2, 5, 9, 5], 1], [[1, 1], 1], [[8], 3]].map(([a, x]) => { const p = positions(a, x); return t(lines(withN(a), x), p.length ? show(p) : "None"); }),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
found = []
for i in range(len(numbers)):
    if numbers[i] == target:
        found.append(i)
if len(found) == 0:
    print("None")
else:
    print(" ".join(str(p) for p in found))`,
  },
  {
    slug: "gcse-searching-sorting-p-07", tier: 3, difficulty: 3, xp: 25, title: "The last match",
    brief: "Input a whole number N. Then input N whole numbers, one per line, to make a list. Finally input the number to search for.\n\nPrint the position of the **last** place the number appears in the list (the first item is at position 0). If it is not in the list, print `-1`.\n\nFor example, the list 4, 9, 2, 9 with the number 9 prints `3`.",
    starter: "", hints: ["You could loop through the whole list and remember the latest position where you found a match.", "Or search from the end of the list backwards: `for i in range(len(numbers) - 1, -1, -1)`."],
    tests: [[[4, 9, 2, 9], 9], [[4, 9, 2, 9], 4], [[4, 9, 2, 9], 1], [[6], 6]].map(([a, x]) => t(lines(withN(a), x), String(a.lastIndexOf(x)))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
last = -1
for i in range(len(numbers)):
    if numbers[i] == target:
        last = i
print(last)`,
  },
  {
    slug: "gcse-searching-sorting-p-08", tier: 3, difficulty: 4, xp: 30, title: "Price lookup",
    brief: "A shop stores its stock as pairs: an item name and its price.\n\nInput a whole number N. Then input N pairs of lines: first the item name, then its price (as text, for example `1.50`). Finally input the name of an item to look up.\n\nPrint the price of that item. If the shop does not stock it, print `Not stocked`.\n\nFor example, with the items `pen 0.80` and `book 3.25`, looking up `book` prints `3.25`.",
    starter: "", hints: ["Store the names in one list and the prices in another list, so that the item at position 2 in `names` matches position 2 in `prices`.", "Search the names list for the wanted item, then print the price at the same position."],
    tests: [
      t(lines(2, "pen", "0.80", "book", "3.25", "book"), "3.25"),
      t(lines(2, "pen", "0.80", "book", "3.25", "pen"), "0.80"),
      t(lines(2, "pen", "0.80", "book", "3.25", "ruler"), "Not stocked"),
      t(lines(1, "glue", "1.10", "glue"), "1.10"),
    ],
    solution: `n = int(input())
names = []
prices = []
for i in range(n):
    names.append(input())
    prices.append(input())
wanted = input()
answer = "Not stocked"
for i in range(len(names)):
    if names[i] == wanted:
        answer = prices[i]
print(answer)`,
  },

  // ============================================================ binary search
  {
    slug: "gcse-searching-sorting-p-09", tier: 1, difficulty: 2, xp: 15, title: "The middle item",
    brief: "A binary search starts by checking the item in the middle of the list.\n\nInput a whole number N. Then input N whole numbers, one per line, already in ascending order. The first item is at position 0 and the last item is at position N − 1.\n\nWork out the middle position as `(0 + last position) DIV 2` (whole-number division). Print the item at that position.\n\nFor example, the list 3, 8, 12, 20, 25 has last position 4, so the middle position is 2 and the item printed is `12`.",
    starter: "", hints: ["The last position is `n - 1`. Add 0 to it, then divide by 2 using `//` so you get a whole number.", "Use the middle position as an index into your list: `numbers[middle]`."],
    tests: [[3, 8, 12, 20, 25], [2, 4, 6, 8], [10], [1, 5]].map((a) => t(lines(withN(a)), String(a[Math.floor((a.length - 1) / 2)]))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
middle = (0 + (n - 1)) // 2
print(numbers[middle])`,
  },
  {
    slug: "gcse-searching-sorting-p-10", tier: 2, difficulty: 3, xp: 20, title: "Is it in the sorted list?",
    brief: "Input a whole number N. Then input N whole numbers, one per line, already in ascending order. Finally input the number to search for.\n\nUse a **binary search** to look for the number. Print `Found` if it is in the list, otherwise print `Not found`.\n\nA binary search keeps a `low` position (start 0) and a `high` position (start N − 1). It checks the middle item `(low + high) DIV 2`. If that is the number it is done. If the number is bigger it moves `low` up to just after the middle. If the number is smaller it moves `high` down to just before the middle. It stops when `low` is more than `high`.",
    starter: "", hints: ["Use a `while low <= high:` loop, and calculate `mid = (low + high) // 2` inside it.", "If `numbers[mid] < target` set `low = mid + 1`; if it is bigger set `high = mid - 1`; if it matches you have found it."],
    tests: [[[3, 8, 12, 20, 25], 20], [[3, 8, 12, 20, 25], 3], [[3, 8, 12, 20, 25], 25], [[3, 8, 12, 20, 25], 9], [[7], 7], [[7], 5]].map(([a, x]) => t(lines(withN(a), x), binary(a, x).index >= 0 ? "Found" : "Not found")),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
low = 0
high = n - 1
found = False
while low <= high and not found:
    mid = (low + high) // 2
    if numbers[mid] == target:
        found = True
    elif numbers[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
if found:
    print("Found")
else:
    print("Not found")`,
  },
  {
    slug: "gcse-searching-sorting-p-11", tier: 3, difficulty: 3, xp: 25, title: "Binary search: where is it?",
    brief: "Input a whole number N. Then input N different whole numbers, one per line, already in ascending order. Finally input the number to search for.\n\nUse a binary search (low starts at 0, high starts at N − 1, middle is `(low + high) DIV 2`). Print the position of the number, where the first item is at position 0. If it is not in the list, print `-1`.\n\nFor example, the list 3, 8, 12, 20, 25 with the number 20 prints `3`.",
    starter: "", hints: ["Use the same loop as a normal binary search, but remember the value of `mid` when you find the number.", "Start with `position = -1` and only change it when the middle item equals the target."],
    tests: [[[3, 8, 12, 20, 25], 20], [[3, 8, 12, 20, 25], 3], [[3, 8, 12, 20, 25], 25], [[3, 8, 12, 20, 25], 4], [[9], 9], [[2, 4, 6, 8, 10, 12], 10]].map(([a, x]) => t(lines(withN(a), x), String(binary(a, x).index))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
low = 0
high = n - 1
position = -1
while low <= high and position == -1:
    mid = (low + high) // 2
    if numbers[mid] == target:
        position = mid
    elif numbers[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
print(position)`,
  },
  {
    slug: "gcse-searching-sorting-p-12", tier: 3, difficulty: 4, xp: 30, title: "Count the binary search checks",
    brief: "Input a whole number N. Then input N different whole numbers, one per line, already in ascending order. Finally input the number to search for.\n\nUse a binary search (low starts at 0, high starts at N − 1, middle is `(low + high) DIV 2`). Print how many items the search checks. An item is checked each time the middle item is compared with the number, including the check that finds it. If the number is not in the list, print how many checks it took before the search gave up.\n\nFor example, the list 3, 8, 12, 20, 25 with the number 25 prints `3` (it checks 12, then 20, then 25).",
    starter: "", hints: ["Use the binary search loop and add 1 to a counter every time you look at `numbers[mid]`.", "If the search fails, the loop ends when `low` is more than `high`. Print the counter either way."],
    tests: [[[3, 8, 12, 20, 25], 25], [[3, 8, 12, 20, 25], 12], [[3, 8, 12, 20, 25], 8], [[3, 8, 12, 20, 25], 1], [[3, 8, 12, 20, 25], 30], [[4], 4]].map(([a, x]) => t(lines(withN(a), x), String(binary(a, x).checks))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
low = 0
high = n - 1
checks = 0
found = False
while low <= high and not found:
    mid = (low + high) // 2
    checks = checks + 1
    if numbers[mid] == target:
        found = True
    elif numbers[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
print(checks)`,
  },
  {
    slug: "gcse-searching-sorting-p-13", tier: 2, difficulty: 2, xp: 15, title: "Can we use a binary search?",
    brief: "A binary search only works if the list is in order.\n\nInput a whole number N. Then input N whole numbers, one per line.\n\nPrint `Sorted` if every number is bigger than or equal to the one before it (ascending order). Otherwise print `Not sorted`.\n\nFor example, 2, 5, 5, 9 prints `Sorted` and 2, 9, 5 prints `Not sorted`.",
    starter: "", hints: ["Compare each item with the one before it. You only need to find one pair that is the wrong way round.", "Loop from position 1 to the end and check `numbers[i] < numbers[i - 1]`."],
    tests: [[2, 5, 5, 9], [2, 9, 5], [7], [1, 2, 3, 4, 5], [5, 4, 3], [1, 3, 2, 4]].map((a) => t(lines(withN(a)), a.every((v, i) => i === 0 || v >= a[i - 1]) ? "Sorted" : "Not sorted")),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
ordered = True
for i in range(1, n):
    if numbers[i] < numbers[i - 1]:
        ordered = False
if ordered:
    print("Sorted")
else:
    print("Not sorted")`,
  },

  // ============================================================ bubble sort
  {
    slug: "gcse-searching-sorting-p-14", tier: 2, difficulty: 2, xp: 15, title: "One bubble sort pass",
    brief: "One pass of a bubble sort goes through the list once. It compares each item with the next item, and swaps them if the first is bigger.\n\nInput a whole number N, then N whole numbers (one per line). Do **one** pass only, then print the list on one line with a space between the numbers.\n\nFor example, 5, 3, 8, 1 becomes `3 5 1 8` after one pass.",
    starter: "", hints: ["Loop `i` from 0 to `n - 2` and compare `numbers[i]` with `numbers[i + 1]`.", "To swap, use `numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]`."],
    tests: [[5, 3, 8, 1], [1, 2, 3], [3, 2, 1], [4, 4, 2], [9, 1]].map((a) => t(lines(withN(a)), show(bubblePass(a).list))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
for i in range(n - 1):
    if numbers[i] > numbers[i + 1]:
        numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]
print(" ".join(str(x) for x in numbers))`,
  },
  {
    slug: "gcse-searching-sorting-p-15", tier: 2, difficulty: 3, xp: 20, title: "Count the swaps",
    brief: "Input a whole number N, then N whole numbers (one per line).\n\nSort the list into ascending order using a bubble sort (keep making passes until a whole pass makes no swaps). Print the total number of swaps made altogether.\n\nFor example, 3, 2, 1 needs `3` swaps.",
    starter: "", hints: ["Use a counter for swaps, and add 1 every time you swap two items.", "Keep a variable such as `swapped` that is set to True when a swap happens in a pass. Stop when a whole pass leaves it False."],
    tests: [[3, 2, 1], [1, 2, 3], [5, 3, 8, 1], [2, 2, 2], [4, 1], [6, 5, 4, 3, 2, 1]].map((a) => t(lines(withN(a)), String(bubbleAll(a).swaps))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
swaps = 0
swapped = True
while swapped:
    swapped = False
    for i in range(n - 1):
        if numbers[i] > numbers[i + 1]:
            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]
            swaps = swaps + 1
            swapped = True
print(swaps)`,
  },
  {
    slug: "gcse-searching-sorting-p-16", tier: 3, difficulty: 3, xp: 25, title: "Bubble sort a list",
    brief: "Input a whole number N, then N whole numbers (one per line).\n\nSort the list into ascending order using a bubble sort, then print it on one line with a space between the numbers.\n\nFor example, 5, 3, 8, 1 prints `1 3 5 8`.",
    starter: "", hints: ["Put the one-pass code inside a loop that repeats until no swaps happen in a pass.", "After the loop finishes the list is sorted. Print it with `\" \".join(str(x) for x in numbers)`."],
    tests: [[5, 3, 8, 1], [1, 2, 3], [9, 7, 7, 3], [4], [2, 1], [10, -3, 0, 5]].map((a) => t(lines(withN(a)), show(bubbleAll(a).list))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
swapped = True
while swapped:
    swapped = False
    for i in range(n - 1):
        if numbers[i] > numbers[i + 1]:
            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]
            swapped = True
print(" ".join(str(x) for x in numbers))`,
  },
  {
    slug: "gcse-searching-sorting-p-17", tier: 3, difficulty: 4, xp: 30, title: "How many passes?",
    brief: "A bubble sort keeps making passes through the list until a whole pass makes no swaps.\n\nInput a whole number N, then N whole numbers (one per line). Print how many passes the bubble sort makes. Count the last pass too, the one where nothing is swapped.\n\nFor example, 1, 2, 3 is already in order so it makes `1` pass. 3, 2, 1 makes `3` passes.",
    starter: "", hints: ["Add 1 to a `passes` counter at the start of every pass.", "The list is finished after the first pass in which no swap happens - that pass is still counted."],
    tests: [[1, 2, 3], [3, 2, 1], [5, 3, 8, 1], [2, 1, 3, 4], [4], [2, 3, 4, 1]].map((a) => t(lines(withN(a)), String(bubbleAll(a).passes))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
passes = 0
swapped = True
while swapped:
    swapped = False
    passes = passes + 1
    for i in range(n - 1):
        if numbers[i] > numbers[i + 1]:
            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]
            swapped = True
print(passes)`,
  },
  {
    slug: "gcse-searching-sorting-p-18", tier: 3, difficulty: 3, xp: 25, title: "Biggest first",
    brief: "Input a whole number N, then N whole numbers (one per line).\n\nSort the list into **descending** order (biggest first) using a bubble sort. Print it on one line with a space between the numbers.\n\nFor example, 5, 3, 8, 1 prints `8 5 3 1`.",
    starter: "", hints: ["It is the same as an ordinary bubble sort, but you swap when the first item is **smaller** than the next one.", "Change the comparison from `>` to `<`."],
    tests: [[5, 3, 8, 1], [1, 2, 3], [3, 3, 1], [6], [-1, 4, 0]].map((a) => t(lines(withN(a)), show(bubbleAll(a, true).list))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
swapped = True
while swapped:
    swapped = False
    for i in range(n - 1):
        if numbers[i] < numbers[i + 1]:
            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]
            swapped = True
print(" ".join(str(x) for x in numbers))`,
  },

  // ========================================================== insertion sort
  {
    slug: "gcse-searching-sorting-p-19", tier: 2, difficulty: 3, xp: 20, title: "Insert into a sorted list",
    brief: "Input a whole number N. Then input N whole numbers, one per line, already in ascending order. Finally input one more whole number.\n\nInsert that number into the list so that the list stays in ascending order. Print the new list on one line with a space between the numbers.\n\nFor example, the list 2, 6, 9 with the number 7 prints `2 6 7 9`.",
    starter: "", hints: ["Find the first item that is bigger than the new number. The new number goes just before it.", "If no item is bigger, the new number goes on the end. `list.insert(position, value)` puts a value in at a position."],
    tests: [[[2, 6, 9], 7], [[2, 6, 9], 1], [[2, 6, 9], 10], [[2, 6, 9], 6], [[5], 3]].map(([a, x]) => { const b = [...a]; let p = b.findIndex((v) => v > x); if (p < 0) p = b.length; b.splice(p, 0, x); return t(lines(withN(a), x), show(b)); }),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
new = int(input())
position = len(numbers)
for i in range(len(numbers)):
    if numbers[i] > new and position == len(numbers):
        position = i
numbers.insert(position, new)
print(" ".join(str(x) for x in numbers))`,
  },
  {
    slug: "gcse-searching-sorting-p-20", tier: 3, difficulty: 3, xp: 25, title: "Insertion sort a list",
    brief: "An insertion sort takes each item in turn, starting with the second, and inserts it into the correct place among the items before it.\n\nInput a whole number N, then N whole numbers (one per line). Sort the list into ascending order using an insertion sort, then print it on one line with a space between the numbers.\n\nFor example, 4, 9, 2, 6 prints `2 4 6 9`.",
    starter: "", hints: ["Loop `i` from 1 to the end. Store `key = numbers[i]`, then move bigger items on the left one place to the right.", "Use a `while j >= 0 and numbers[j] > key:` loop, then put `key` into the gap at `numbers[j + 1]`."],
    tests: [[4, 9, 2, 6], [1, 2, 3], [3, 2, 1], [5], [7, 7, 1], [-2, 5, -9, 0]].map((a) => t(lines(withN(a)), show(insertion(a).list))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
for i in range(1, n):
    key = numbers[i]
    j = i - 1
    while j >= 0 and numbers[j] > key:
        numbers[j + 1] = numbers[j]
        j = j - 1
    numbers[j + 1] = key
print(" ".join(str(x) for x in numbers))`,
  },
  {
    slug: "gcse-searching-sorting-p-21", tier: 3, difficulty: 4, xp: 30, title: "Show the insertion sort steps",
    brief: "Input a whole number N (at least 2), then N whole numbers (one per line).\n\nSort the list with an insertion sort. Each time an item has been inserted into its correct place, print the whole list on its own line, with a space between the numbers. That means N − 1 lines of output.\n\nFor example, 4, 9, 2, 6 prints:\n```\n4 9 2 6\n2 4 9 6\n2 4 6 9\n```",
    starter: "", hints: ["Do the insertion sort as usual, but print the whole list at the end of each turn of the outer loop.", "The first line is printed after the second item has been placed - it can look unchanged if that item was already in the right place."],
    tests: [[4, 9, 2, 6], [1, 2, 3], [3, 2, 1], [5, 1]].map((a) => t(lines(withN(a)), insertion(a).steps.map(show).join("\n"))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
for i in range(1, n):
    key = numbers[i]
    j = i - 1
    while j >= 0 and numbers[j] > key:
        numbers[j + 1] = numbers[j]
        j = j - 1
    numbers[j + 1] = key
    print(" ".join(str(x) for x in numbers))`,
  },
  {
    slug: "gcse-searching-sorting-p-22", tier: 3, difficulty: 4, xp: 30, title: "Count the shifts",
    brief: "When an insertion sort inserts an item, it moves every bigger item on its left one place to the right. Each of those moves is one **shift**.\n\nInput a whole number N, then N whole numbers (one per line). Sort the list with an insertion sort and print the total number of shifts.\n\nFor example, 3, 2, 1 needs `3` shifts. A list that is already in order needs `0`.",
    starter: "", hints: ["Add 1 to a `shifts` counter each time you copy an item one place to the right inside the inner loop.", "Placing the key into its final gap is not a shift - only count the moves of the bigger items."],
    tests: [[3, 2, 1], [1, 2, 3], [4, 9, 2, 6], [5, 5, 5], [2, 1], [8]].map((a) => t(lines(withN(a)), String(insertion(a).shifts))),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
shifts = 0
for i in range(1, n):
    key = numbers[i]
    j = i - 1
    while j >= 0 and numbers[j] > key:
        numbers[j + 1] = numbers[j]
        j = j - 1
        shifts = shifts + 1
    numbers[j + 1] = key
print(shifts)`,
  },

  // ================================================================= stretch
  {
    slug: "gcse-searching-sorting-p-s1", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Merge two sorted lists",
    brief: "Input a whole number A, then A whole numbers (one per line) in ascending order. Then input a whole number B, then B whole numbers (one per line), also in ascending order.\n\nMerge the two lists into one ascending list **without sorting the joined list**. Do it the way a merge sort does: compare the first unused item of each list and take the smaller one, repeating until one list is used up, then add on what is left of the other. Print the merged list on one line with a space between the numbers.\n\nFor example, 2, 6, 9 and 1, 7 prints `1 2 6 7 9`.",
    starter: "", hints: ["Keep one position for each list (`i` and `j`, both starting at 0). Compare `first[i]` with `second[j]`.", "When the loop stops, one list still has items left. Add the rest of that list to the end of the result."],
    tests: [[[2, 6, 9], [1, 7]], [[1, 2], [3, 4]], [[5], [5]], [[4, 8], [1, 2, 3]], [[1], [2, 3, 4]]].map(([a, b]) => t(lines(withN(a), withN(b)), show(mergeSorted(a, b)))),
    solution: `a = int(input())
first = []
for k in range(a):
    first.append(int(input()))
b = int(input())
second = []
for k in range(b):
    second.append(int(input()))
result = []
i = 0
j = 0
while i < len(first) and j < len(second):
    if first[i] <= second[j]:
        result.append(first[i])
        i = i + 1
    else:
        result.append(second[j])
        j = j + 1
while i < len(first):
    result.append(first[i])
    i = i + 1
while j < len(second):
    result.append(second[j])
    j = j + 1
print(" ".join(str(x) for x in result))`,
  },
  {
    slug: "gcse-searching-sorting-p-s2", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 The first split of a merge sort",
    brief: "A merge sort starts by splitting the list into two halves. The left half gets the first N DIV 2 items and the right half gets all the rest.\n\nInput a whole number N (at least 2), then N whole numbers (one per line). Split the list, then print two lines:\n```\nLeft: <left half>\nRight: <right half>\n```\nEach half is printed with a space between its numbers.\n\nFor example, 8, 3, 5, 1, 9 (N is 5, so the left half has 2 items) prints:\n```\nLeft: 8 3\nRight: 5 1 9\n```",
    starter: "", hints: ["Work out the middle with `n // 2`.", "A list slice takes the first part and the rest: `numbers[:middle]` and `numbers[middle:]`."],
    tests: [[8, 3, 5, 1, 9], [4, 2], [7, 6, 5, 4], [1, 2, 3]].map((a) => { const m = Math.floor(a.length / 2); return t(lines(withN(a)), `Left: ${show(a.slice(0, m))}\nRight: ${show(a.slice(m))}`); }),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
middle = n // 2
left = numbers[:middle]
right = numbers[middle:]
print("Left: " + " ".join(str(x) for x in left))
print("Right: " + " ".join(str(x) for x in right))`,
  },
  {
    slug: "gcse-searching-sorting-p-s3", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Sort, then search",
    brief: "Input a whole number N, then N different whole numbers (one per line) in any order. Finally input a number to search for.\n\nFirst sort the list into ascending order (use any sorting method you like). Then print the position of the number **in the sorted list**, where the first item is at position 0. If the number is not in the list, print `-1`.\n\nFor example, the list 9, 2, 7, 4 sorts to 2, 4, 7, 9, so searching for 7 prints `2`.",
    starter: "", hints: ["Sort first. Then a search of the sorted list can use either a linear or a binary search.", "Remember the position you print is the one in the sorted list, not the one in the list as it was typed in."],
    tests: [[[9, 2, 7, 4], 7], [[9, 2, 7, 4], 9], [[9, 2, 7, 4], 2], [[9, 2, 7, 4], 5], [[6], 6]].map(([a, x]) => { const s = [...a].sort((p, q) => p - q); return t(lines(withN(a), x), String(s.indexOf(x))); }),
    solution: `n = int(input())
numbers = []
for i in range(n):
    numbers.append(int(input()))
target = int(input())
numbers.sort()
position = -1
for i in range(n):
    if numbers[i] == target:
        position = i
print(position)`,
  },
  {
    slug: "gcse-searching-sorting-p-s4", tier: 4, difficulty: 5, xp: 40, stretch: true, title: "🌟 Sort the names",
    brief: "Input a whole number N, then N names (one per line). Sort the names into alphabetical order and print them, one per line.\n\nAll the names start with a capital letter and have no spaces, so you can compare them with `<` and `>` as you would compare numbers.\n\nFor example, Cara, Ann, Ben prints:\n```\nAnn\nBen\nCara\n```",
    starter: "", hints: ["You can use any sorting method. A bubble sort works on names in exactly the same way as on numbers.", "Compare with `names[i] > names[i + 1]` to see if two names are in the wrong order."],
    tests: [["Cara", "Ann", "Ben"], ["Zoe"], ["Bo", "Al", "Al"], ["Sam", "Sam2", "Sad", "Sa"]].map((a) => t(lines(withN(a)), [...a].sort().join("\n"))),
    solution: `n = int(input())
names = []
for i in range(n):
    names.append(input())
swapped = True
while swapped:
    swapped = False
    for i in range(n - 1):
        if names[i] > names[i + 1]:
            names[i], names[i + 1] = names[i + 1], names[i]
            swapped = True
for name in names:
    print(name)`,
  },
];
