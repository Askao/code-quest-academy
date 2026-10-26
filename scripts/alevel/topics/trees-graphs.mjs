// A level: Trees and graphs. OCR H446 1.4.2 (graphs, trees, binary search
// trees) and 2.3.1 (tree traversals, breadth-first and depth-first search);
// AQA 7517 4.2.2 (graphs: adjacency matrix and list), 4.2.3 (trees, binary
// trees), 4.3.1 (graph traversal) and 4.3.2 (tree traversal).
export const topic = "trees-graphs";

const NODE = `class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def insert(root, value):
    if root is None:
        return Node(value)
    if value < root.value:
        root.left = insert(root.left, value)
    else:
        root.right = insert(root.right, value)
    return root
`;

const BUILD_GRAPH = `graph = {}
for i in range(int(input())):
    a, b = input().split()
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)
for v in graph:
    graph[v].sort()
`;

export const lessons = [
  {
    title: "Binary search trees",
    summary:
      "Trees where everything smaller goes left and everything bigger goes right, so searching halves the work at each step.",
    notes: `
A **tree** is a set of **nodes** joined by **edges**, with one **root** at the top and no cycles. A node's children hang below it; a node with no children is a **leaf**.

In a **binary tree** each node has at most two children: a **left** and a **right**. A **binary search tree (BST)** keeps them in order:

- everything in a node's **left** subtree is **smaller** than it;
- everything in its **right** subtree is **bigger** (or equal).

\`\`\`
        8
      /   \\
     3     10
    / \\      \\
   1   6      14
\`\`\`

---

**Inserting**: start at the root. Go left if the new value is smaller, right if not, until you reach an empty space, and put the new node there.

**Searching** works the same way: at each node you know which side the value must be on, so you skip the whole other half. A balanced tree with a million values needs only about 20 comparisons.

\`\`\`python
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def insert(root, value):
    if root is None:
        return Node(value)
    if value < root.value:
        root.left = insert(root.left, value)
    else:
        root.right = insert(root.right, value)
    return root
\`\`\`

The shape depends on the order values are inserted. Inserting 1, 2, 3, 4 in order gives a long thin chain, which is no faster to search than a list.
`,
    worked_example: `${NODE}
root = None
for v in [8, 3, 10, 1, 6, 14]:
    root = insert(root, v)
print(root.value, root.left.value, root.right.value)
print(root.left.right.value)`,
    worked_example_note:
      "8 becomes the root. 3 is smaller so it goes left; 10 goes right; 1 goes left of 3; 6 is smaller than 8 but bigger than 3, so it goes to 3's right.",
    quiz: [
      {
        question: "In a binary search tree, where are the values smaller than a node?",
        options: ["In its left subtree", "In its right subtree", "Above it", "Anywhere"],
        answer: "In its left subtree",
        explanation: "Smaller values go left and bigger ones go right, at every node.",
      },
      {
        question: "Insert 5, 2, 8, 1 into an empty BST. What is the left child of 2?",
        options: ["1", "8", "5", "It has none"],
        answer: "1",
        explanation:
          "5 is the root; 2 goes left of 5; 8 goes right; 1 is smaller than 5 and smaller than 2, so it is 2's left child.",
      },
      {
        question: "Why can inserting values in sorted order make a BST slow to search?",
        options: [
          "Every node goes on the same side, making a long chain",
          "Sorted values can't be inserted",
          "The root changes every time",
          "It makes the tree too wide",
        ],
        answer: "Every node goes on the same side, making a long chain",
        explanation:
          "1, 2, 3, 4 each go to the right of the last, so searching has to visit every node, like a list.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 3,
        xp: 25,
        title: "Is it in the tree?",
        brief: `
The starter code gives you a \`Node\` class and an \`insert\` function for a binary search tree.

Write a function \`search(root, value)\` that returns \`True\` if \`value\` is in the tree. At each node: if it's the value, return \`True\`; if the value is smaller, search the left subtree; otherwise search the right. An empty subtree (\`None\`) means it isn't there.

Input a line of whole numbers, insert them in order, then input a number to search for. Print \`Found\` or \`Not found\`.`,
        starter: NODE + "\ndef search(root, value):\n    pass\n",
        hints: [
          "Base cases: root is None returns False; root.value == value returns True.",
          "Then return search(root.left, value) or search(root.right, value), depending on which side it must be.",
        ],
        solution: `${NODE}
def search(root, value):
    if root is None:
        return False
    if value == root.value:
        return True
    if value < root.value:
        return search(root.left, value)
    return search(root.right, value)

root = None
for x in input().split():
    root = insert(root, int(x))
print("Found" if search(root, int(input())) else "Not found")`,
        inputs: ["8 3 10 1 6 14\n6", "8 3 10 1 6 14\n7", "5\n5", "1 2 3 4 5\n9"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Show the search path",
        brief: `
Using the starter code's binary search tree, input a line of whole numbers and insert them in order. Then input a number to search for.

Print every value you **visit** while searching, separated by \` -> \`, then on the next line \`Found\` or \`Not found\`. Start at the root and go left or right at each node, as a BST search does.

For example, with \`8 3 10 1 6 14\` and target \`6\`, the path is \`8 -> 3 -> 6\`.`,
        starter: NODE,
        hints: [
          "Use a loop: current = root, and while current is not None, record current.value and move left or right.",
          "Stop as soon as current.value equals the target.",
        ],
        solution: `${NODE}
root = None
for x in input().split():
    root = insert(root, int(x))
target = int(input())
path = []
current = root
found = False
while current is not None:
    path.append(str(current.value))
    if current.value == target:
        found = True
        break
    current = current.left if target < current.value else current.right
print(" -> ".join(path))
print("Found" if found else "Not found")`,
        inputs: ["8 3 10 1 6 14\n6", "8 3 10 1 6 14\n13", "50 30 70\n50", "4 2 6 1 3 5 7\n1"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Smallest and largest",
        brief: `
In a binary search tree, the smallest value is found by going left until you can't any more, and the largest by going right.

Using the starter code, input a line of whole numbers and insert them in order. Print \`Smallest: \` and \`Largest: \` on two lines. Don't use \`min\`, \`max\` or sort the input: walk the tree.`,
        starter: NODE,
        hints: [
          "current = root; while current.left is not None: current = current.left",
          "Do the same with .right for the largest.",
        ],
        solution: `${NODE}
root = None
for x in input().split():
    root = insert(root, int(x))
current = root
while current.left is not None:
    current = current.left
print("Smallest: " + str(current.value))
current = root
while current.right is not None:
    current = current.right
print("Largest: " + str(current.value))`,
        inputs: ["8 3 10 1 6 14", "42", "5 4 3 2 1", "-3 7 0 -10"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "How tall is the tree?",
        brief: `
The **height** of a tree is the number of nodes on the longest path from the root down to a leaf. An empty tree has height 0, and a tree with just a root has height 1.

Write a recursive function \`height(node)\`: 0 for \`None\`, otherwise 1 plus the larger of the left and right subtrees' heights.

Using the starter code, input a line of whole numbers, insert them in order, and print the tree's height. (Notice how inserting in sorted order makes it tall.)`,
        starter: NODE + "\ndef height(node):\n    pass\n",
        hints: [
          "if node is None: return 0",
          "return 1 + max(height(node.left), height(node.right))",
        ],
        solution: `${NODE}
def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))

root = None
for x in input().split():
    root = insert(root, int(x))
print(height(root))`,
        inputs: ["8 3 10 1 6 14", "1 2 3 4 5", "7", "4 2 6 1 3 5 7"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Count in a range, skipping branches",
        brief: `
Write a recursive function \`count_between(node, low, high)\` that counts the values in a BST from \`low\` to \`high\` inclusive. Make it efficient: a BST lets you skip whole branches.

- If \`node\` is \`None\`, the count is 0.
- If \`node.value\` is below \`low\`, nothing in its left subtree can be in range, so only count the right subtree.
- If \`node.value\` is above \`high\`, only count the left subtree.
- Otherwise count this node plus both subtrees.

Also count how many nodes the function **visits** (calls with a node that isn't \`None\`), in a global variable. Input a line of whole numbers to insert, then \`low\` and \`high\` on one line. Print the count, then \`Visited: \` and the number visited.`,
        starter: NODE,
        hints: [
          "Add 1 to the global visited counter right after the None check.",
          "The count for a node in range is 1 + count_between(left) + count_between(right).",
        ],
        solution: `${NODE}
visited = 0

def count_between(node, low, high):
    global visited
    if node is None:
        return 0
    visited = visited + 1
    if node.value < low:
        return count_between(node.right, low, high)
    if node.value > high:
        return count_between(node.left, low, high)
    return 1 + count_between(node.left, low, high) + count_between(node.right, low, high)

root = None
for x in input().split():
    root = insert(root, int(x))
low, high = [int(x) for x in input().split()]
print(count_between(root, low, high))
print("Visited: " + str(visited))`,
        inputs: [
          "8 3 10 1 6 14 4 7 13\n5 9",
          "8 3 10\n100 200",
          "5\n5 5",
          "50 30 70 20 40 60 80\n25 65",
        ],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "A tree of words",
        brief: `
Binary search trees work for words too: \`<\` compares words alphabetically. Using the starter code (which works for any values), input a line of words and insert them in order. Then input a word and print \`Found\` or \`Not found\` by searching the tree (not by checking the input list).`,
        starter: NODE,
        hints: [
          "Insert the words as strings: root = insert(root, word).",
          "Search with a loop that goes left when the target is smaller than the node.",
        ],
        solution: `${NODE}
root = None
for word in input().split():
    root = insert(root, word)
target = input()
current = root
while current is not None and current.value != target:
    current = current.left if target < current.value else current.right
print("Not found" if current is None else "Found")`,
        inputs: ["mango apple pear kiwi\nkiwi", "mango apple pear kiwi\nlime", "one\none"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Count the nodes",
        brief: `
Write a recursive function \`size(node)\` that returns how many nodes are in a tree: 0 for \`None\`, otherwise 1 plus the sizes of both subtrees.

Using the starter code, input a line of whole numbers, insert them, and print the tree's size. Then input another number, insert it, and print the size again.`,
        starter: NODE,
        hints: ["if node is None: return 0", "return 1 + size(node.left) + size(node.right)"],
        solution: `${NODE}
def size(node):
    if node is None:
        return 0
    return 1 + size(node.left) + size(node.right)

root = None
for x in input().split():
    root = insert(root, int(x))
print(size(root))
root = insert(root, int(input()))
print(size(root))`,
        inputs: ["8 3 10\n5", "1\n1", "4 2 6 1 3 5 7\n0"],
      },
    ],
  },
  {
    title: "Tree traversals",
    summary:
      "Visiting every node: pre-order, in-order, post-order and breadth-first, and what each is used for.",
    notes: `
To **traverse** a tree is to visit every node once. The three **depth-first** traversals differ only in *when* the node itself is visited compared with its subtrees:

- **Pre-order**: node, then left subtree, then right subtree. Used to copy a tree.
- **In-order**: left subtree, then node, then right subtree. On a BST this visits the values in **sorted order**.
- **Post-order**: left subtree, then right subtree, then node. Used to delete a tree, and to evaluate an expression tree.

\`\`\`python
def in_order(node):
    if node is not None:
        in_order(node.left)
        print(node.value)
        in_order(node.right)
\`\`\`

\`\`\`
        8
      /   \\
     3     10          Pre-order:  8 3 1 6 10 14
    / \\      \\         In-order:   1 3 6 8 10 14
   1   6      14       Post-order: 1 6 3 14 10 8
\`\`\`

---

A **breadth-first** traversal (level order) visits the root, then everything one level down, then the next level, and so on: 8 3 10 1 6 14. It uses a **queue**: take a node from the front, visit it, and add its children to the back.

**Expression trees** store a calculation: operators in the branches, numbers in the leaves. An in-order traversal (with brackets) gives the normal (infix) expression; a post-order traversal gives reverse Polish.
`,
    worked_example: `${NODE}
def pre_order(node, out):
    if node is not None:
        out.append(node.value)
        pre_order(node.left, out)
        pre_order(node.right, out)

root = None
for v in [8, 3, 10, 1, 6, 14]:
    root = insert(root, v)
result = []
pre_order(root, result)
print(result)`,
    worked_example_note:
      "Pre-order records each node before going into its subtrees, so the root comes first and each subtree's root comes before its children.",
    quiz: [
      {
        question: "Which traversal visits the values of a binary search tree in ascending order?",
        options: ["In-order", "Pre-order", "Post-order", "Breadth-first"],
        answer: "In-order",
        explanation:
          "Left subtree (smaller), node, right subtree (bigger), at every level, gives sorted order.",
      },
      {
        question: "In post-order, when is a node visited?",
        options: [
          "After both of its subtrees",
          "Before both of its subtrees",
          "Between its left and right subtrees",
          "Level by level",
        ],
        answer: "After both of its subtrees",
        explanation: "Post-order is left, right, then node, which is why the root comes last.",
      },
      {
        question: "Which data structure does a breadth-first traversal use?",
        options: ["A queue", "A stack", "A hash table", "A linked list only"],
        answer: "A queue",
        explanation:
          "Children join the back of the queue, so all of one level is visited before the next.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 3,
        xp: 25,
        title: "In-order sorts the tree",
        brief: `
Write a recursive function \`in_order(node, out)\` that visits a tree in-order (left subtree, node, right subtree), appending each value to the list \`out\`.

Using the starter code's BST, input a line of whole numbers, insert them, then print the in-order traversal separated by spaces. On a BST, this comes out sorted.`,
        starter: NODE + "\ndef in_order(node, out):\n    pass\n",
        hints: [
          "if node is not None: in_order(node.left, out); out.append(node.value); in_order(node.right, out)",
          "Call it with an empty list, then join the list's values.",
        ],
        solution: `${NODE}
def in_order(node, out):
    if node is not None:
        in_order(node.left, out)
        out.append(node.value)
        in_order(node.right, out)

root = None
for x in input().split():
    root = insert(root, int(x))
result = []
in_order(root, result)
print(" ".join(str(v) for v in result))`,
        inputs: ["8 3 10 1 6 14", "5 5 1", "9", "3 1 2"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 30,
        title: "Pre-order and post-order",
        brief: `
Write two recursive functions, \`pre_order(node, out)\` (node, left, right) and \`post_order(node, out)\` (left, right, node), each appending values to the list \`out\`.

Using the starter code's BST, input a line of whole numbers and insert them. Print \`Pre: \` followed by the pre-order traversal, and \`Post: \` followed by the post-order traversal, values separated by spaces.

For example, \`8 3 10 1 6 14\` prints \`Pre: 8 3 1 6 10 14\` and \`Post: 1 6 3 14 10 8\`.`,
        starter: NODE,
        hints: [
          "The only difference between the three traversals is where the append line goes.",
          "Pre-order appends before the two recursive calls; post-order appends after them.",
        ],
        solution: `${NODE}
def pre_order(node, out):
    if node is not None:
        out.append(node.value)
        pre_order(node.left, out)
        pre_order(node.right, out)

def post_order(node, out):
    if node is not None:
        post_order(node.left, out)
        post_order(node.right, out)
        out.append(node.value)

root = None
for x in input().split():
    root = insert(root, int(x))
pre = []
pre_order(root, pre)
post = []
post_order(root, post)
print("Pre: " + " ".join(str(v) for v in pre))
print("Post: " + " ".join(str(v) for v in post))`,
        inputs: ["8 3 10 1 6 14", "1 2 3", "4 2 6 1 3 5 7"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Level by level",
        brief: `
A breadth-first traversal visits the tree level by level, left to right. It uses a queue:
1. put the root in the queue;
2. while the queue isn't empty: take the front node, record its value, and add its left child and then its right child to the back (if they exist).

Using the starter code's BST, input a line of whole numbers, insert them, and print the breadth-first order separated by spaces.`,
        starter: NODE,
        hints: [
          "queue = [root], then node = queue.pop(0) inside the loop.",
          "Only append a child if it is not None.",
        ],
        solution: `${NODE}
root = None
for x in input().split():
    root = insert(root, int(x))
queue = [root]
order = []
while queue:
    node = queue.pop(0)
    order.append(str(node.value))
    if node.left is not None:
        queue.append(node.left)
    if node.right is not None:
        queue.append(node.right)
print(" ".join(order))`,
        inputs: ["8 3 10 1 6 14", "5", "4 2 6 1 3 5 7", "1 2 3"],
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "An expression tree",
        brief: `
The starter code builds an **expression tree** from a reverse Polish expression: each operator node has the two parts it combines as its left and right children, and numbers are leaves.

Write two recursive functions:
- \`infix(node)\` returns the expression written normally, with every operation in brackets: a leaf is just its number; an operator node is \`(\` + infix(left) + \` op \` + infix(right) + \`)\`. This is an in-order traversal.
- \`evaluate(node)\` works out the value (a post-order traversal: evaluate both children, then apply the operator). Operators are \`+\`, \`-\` and \`*\`.

Print the infix expression, then its value. For example, \`3 4 + 2 *\` prints \`((3 + 4) * 2)\` then \`14\`.`,
        starter: `class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def build(rpn):
    stack = []
    for token in rpn.split():
        if token in "+-*":
            right = stack.pop()
            left = stack.pop()
            stack.append(Node(token, left, right))
        else:
            stack.append(Node(token))
    return stack.pop()

root = build(input())
`,
        hints: [
          "A leaf has no children: if node.left is None: return node.value (as text for infix, as int for evaluate).",
          "evaluate: a = evaluate(node.left), b = evaluate(node.right), then apply node.value.",
        ],
        solution: `class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def build(rpn):
    stack = []
    for token in rpn.split():
        if token in "+-*":
            right = stack.pop()
            left = stack.pop()
            stack.append(Node(token, left, right))
        else:
            stack.append(Node(token))
    return stack.pop()

def infix(node):
    if node.left is None:
        return node.value
    return "(" + infix(node.left) + " " + node.value + " " + infix(node.right) + ")"

def evaluate(node):
    if node.left is None:
        return int(node.value)
    a = evaluate(node.left)
    b = evaluate(node.right)
    if node.value == "+":
        return a + b
    if node.value == "-":
        return a - b
    return a * b

root = build(input())
print(infix(root))
print(evaluate(root))`,
        inputs: ["3 4 + 2 *", "5 1 2 + 4 * + 3 -", "7", "10 2 3 * -"],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Delete from a binary search tree",
        brief: `
Write a recursive function \`delete(node, value)\` that removes \`value\` from a BST and returns the new root of that subtree. Find the node the usual way, then:
- **no children**: return \`None\`;
- **one child**: return that child, so it takes the node's place;
- **two children**: find the **in-order successor** (the smallest value in the right subtree), copy its value into this node, then delete that value from the right subtree.

If the value isn't in the tree, nothing changes. Using the starter code, input a line of whole numbers to insert, then a line of values to delete (in order). Print the in-order traversal after all the deletions, separated by spaces, or \`(empty)\`.`,
        starter: NODE,
        hints: [
          "When the value is smaller than node.value: node.left = delete(node.left, value), and return node.",
          "For two children: smallest = node.right, then go left until you can't; node.value = smallest.value; node.right = delete(node.right, smallest.value).",
        ],
        solution: `${NODE}
def delete(node, value):
    if node is None:
        return None
    if value < node.value:
        node.left = delete(node.left, value)
    elif value > node.value:
        node.right = delete(node.right, value)
    else:
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left
        smallest = node.right
        while smallest.left is not None:
            smallest = smallest.left
        node.value = smallest.value
        node.right = delete(node.right, smallest.value)
    return node

def in_order(node, out):
    if node is not None:
        in_order(node.left, out)
        out.append(str(node.value))
        in_order(node.right, out)

root = None
for x in input().split():
    root = insert(root, int(x))
for x in input().split():
    root = delete(root, int(x))
result = []
in_order(root, result)
print(" ".join(result) if result else "(empty)")`,
        inputs: [
          "8 3 10 1 6 14\n3",
          "8 3 10 1 6 14\n8 99 1",
          "5\n5",
          "50 30 70 20 40 60 80\n50 30 70",
        ],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Count the leaves",
        brief: `
A leaf is a node with no children. Write a recursive function \`leaves(node)\` that counts the leaves in a tree.

Using the starter code, input a line of whole numbers, insert them into a BST, and print the number of leaves.`,
        starter: NODE,
        hints: [
          "None has 0 leaves; a node with neither child is 1 leaf.",
          "Otherwise return leaves(node.left) + leaves(node.right).",
        ],
        solution: `${NODE}
def leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return leaves(node.left) + leaves(node.right)

root = None
for x in input().split():
    root = insert(root, int(x))
print(leaves(root))`,
        inputs: ["8 3 10 1 6 14", "1 2 3 4", "7", "4 2 6 1 3 5 7"],
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Tree sort",
        brief: `
Sort a line of words alphabetically **using a binary search tree**: insert every word, then do an in-order traversal.

Using the starter code, input a line of words and print them in alphabetical order separated by spaces. Don't use \`sorted\` or \`.sort()\`.`,
        starter: NODE,
        hints: [
          "Insert each word into the tree.",
          "An in-order traversal of a BST visits values in ascending order.",
        ],
        solution: `${NODE}
def in_order(node, out):
    if node is not None:
        in_order(node.left, out)
        out.append(node.value)
        in_order(node.right, out)

root = None
for word in input().split():
    root = insert(root, word)
result = []
in_order(root, result)
print(" ".join(result))`,
        inputs: ["pear apple mango kiwi", "zebra", "b a b a"],
      },
    ],
  },
  {
    title: "Representing graphs",
    summary:
      "Vertices and edges, directed and weighted graphs, and storing them as an adjacency matrix or list.",
    notes: `
A **graph** is a set of **vertices** (nodes) joined by **edges** (arcs). Graphs model anything with connections: road maps, social networks, the internet, computer networks.

- In an **undirected** graph, an edge goes both ways (a friendship).
- In a **directed** graph, each edge has a direction (one-way streets, following someone).
- In a **weighted** graph, each edge has a value, such as a distance, time or cost.

Unlike a tree, a graph can have cycles and needn't have a root.

---

Two ways to store a graph:

**Adjacency matrix**: a grid with a row and a column for each vertex. The cell at row A, column B holds 1 (or the weight) if there's an edge from A to B, and 0 if not. An undirected graph's matrix is symmetrical about its diagonal.

**Adjacency list**: for each vertex, a list of the vertices it connects to. In Python, a dictionary of lists:

\`\`\`python
graph = {"A": ["B", "C"], "B": ["A"], "C": ["A"]}
\`\`\`

A matrix makes checking "is there an edge from A to B?" instant, but uses space for every possible edge. A list only stores edges that exist, so it suits **sparse** graphs (few edges), while a matrix suits **dense** ones.

The **degree** of a vertex is the number of edges connected to it.
`,
    worked_example: `edges = [("A", "B"), ("A", "C"), ("B", "C"), ("C", "D")]
graph = {}
for a, b in edges:
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)
for vertex in sorted(graph):
    print(vertex, graph[vertex])`,
    worked_example_note:
      "Each undirected edge is added in both directions. setdefault creates an empty list the first time a vertex is seen.",
    quiz: [
      {
        question: "When does an adjacency list use much less memory than an adjacency matrix?",
        options: [
          "When the graph is sparse, with few edges",
          "When the graph is dense, with many edges",
          "When the graph is directed",
          "Never",
        ],
        answer: "When the graph is sparse, with few edges",
        explanation:
          "A matrix always stores a cell for every possible edge; a list only stores the edges that exist.",
      },
      {
        question: "What does a weighted graph have that an unweighted graph doesn't?",
        options: ["A value on each edge", "Arrows on its edges", "A root", "No cycles"],
        answer: "A value on each edge",
        explanation: "The weight is usually a distance, time or cost.",
      },
      {
        question: "Why is an undirected graph's adjacency matrix symmetrical?",
        options: [
          "Every edge from A to B is also an edge from B to A",
          "Every vertex connects to itself",
          "It has the same number of rows as columns",
          "Its weights are all 1",
        ],
        answer: "Every edge from A to B is also an edge from B to A",
        explanation: "So the cell at row A, column B always matches the cell at row B, column A.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 25,
        title: "Build an adjacency list",
        brief: `
Input a whole number \`n\`, then \`n\` lines, each two vertex names separated by a space, meaning an **undirected** edge between them.

Store the graph as an adjacency list (a dictionary from each vertex to a list of its neighbours). Then print every vertex in alphabetical order as \`<vertex>: \` followed by its neighbours in alphabetical order, separated by spaces.`,
        starter: "",
        hints: [
          "For each edge a b: graph.setdefault(a, []).append(b) and the same the other way round.",
          'Print with for v in sorted(graph): and " ".join(sorted(graph[v])).',
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b = input().split()
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)
for v in sorted(graph):
    print(v + ": " + " ".join(sorted(graph[v])))`,
        inputs: ["4\nA B\nA C\nB C\nC D", "1\nX Y", "3\nhub a\nhub b\nhub c"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 30,
        title: "Build an adjacency matrix",
        brief: `
Input a line of vertex names separated by spaces (this sets their order), then a whole number \`n\`, then \`n\` lines each with two vertex names, meaning an **undirected** edge.

Build the adjacency matrix: a list of lists of 0s, with a 1 in row i, column j (and row j, column i) for each edge. Print the matrix one row per line, with the numbers separated by spaces.`,
        starter: "",
        hints: [
          "Turn a name into its row number with names.index(name).",
          "matrix = [[0] * size for i in range(size)] makes separate rows.",
        ],
        solution: `names = input().split()
size = len(names)
matrix = [[0] * size for i in range(size)]
for i in range(int(input())):
    a, b = input().split()
    x = names.index(a)
    y = names.index(b)
    matrix[x][y] = 1
    matrix[y][x] = 1
for row in matrix:
    print(" ".join(str(v) for v in row))`,
        inputs: ["A B C D\n4\nA B\nA C\nB C\nC D", "P Q\n0", "X Y Z\n1\nZ X"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 30,
        title: "The best-connected vertex",
        brief: `
Input an undirected graph as a whole number \`n\` followed by \`n\` edges (two vertex names per line). The **degree** of a vertex is how many edges touch it.

Print every vertex in alphabetical order as \`<vertex>: <degree>\`, then \`Most connected: \` followed by the vertex with the highest degree. If several tie, choose the one that comes first alphabetically.`,
        starter: "",
        hints: [
          "Count with a dictionary: degree[a] = degree.get(a, 0) + 1, and the same for b.",
          "Looping over sorted vertices and only replacing the best on a strictly higher degree keeps the alphabetical tie-break.",
        ],
        solution: `degree = {}
for i in range(int(input())):
    a, b = input().split()
    degree[a] = degree.get(a, 0) + 1
    degree[b] = degree.get(b, 0) + 1
best = None
for v in sorted(degree):
    print(v + ": " + str(degree[v]))
    if best is None or degree[v] > degree[best]:
        best = v
print("Most connected: " + best)`,
        inputs: ["4\nA B\nA C\nB C\nC D", "1\nX Y", "3\nhub a\nhub b\nhub c"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "The cost of a route",
        brief: `
A **directed, weighted** graph stores one-way roads with their lengths. Input a whole number \`n\`, then \`n\` lines in the form \`<from> <to> <weight>\` (weights are whole numbers).

Store it as a dictionary of dictionaries, so \`graph["A"]["B"]\` is the weight of the road from A to B. Then input a route: vertex names separated by spaces. Print \`Total: \` and the route's total weight, or \`No route\` if any step along it has no road (remember the roads are one-way).`,
        starter: "",
        hints: [
          "graph.setdefault(a, {})[b] = weight",
          "Check each consecutive pair: route[i] to route[i + 1]. Use graph.get(a, {}) so a vertex with no roads out doesn't crash.",
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b, w = input().split()
    graph.setdefault(a, {})[b] = int(w)
route = input().split()
total = 0
ok = True
for i in range(len(route) - 1):
    roads = graph.get(route[i], {})
    if route[i + 1] not in roads:
        ok = False
        break
    total = total + roads[route[i + 1]]
print("Total: " + str(total) if ok else "No route")`,
        inputs: [
          "3\nA B 5\nB C 3\nC A 2\nA B C",
          "3\nA B 5\nB C 3\nC A 2\nB A",
          "1\nX Y 7\nX",
          "2\nP Q 1\nQ R 1\nP Q R",
        ],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Matrix to list",
        brief: `
Input a line of vertex names, then the adjacency matrix of an undirected graph: one row per line, numbers separated by spaces, in the same order as the names.

Print the adjacency list (each vertex in the given order, as \`<vertex>: \` followed by its neighbours in the matrix's column order). Then print \`Edges: \` and the number of edges. Each undirected edge appears twice in the matrix, so count only the cells above the diagonal.`,
        starter: "",
        hints: [
          "Row i's neighbours are the names[j] where matrix[i][j] == 1.",
          "Edges: count the cells with j > i that are 1.",
        ],
        solution: `names = input().split()
matrix = [[int(x) for x in input().split()] for name in names]
edges = 0
for i in range(len(names)):
    neighbours = [names[j] for j in range(len(names)) if matrix[i][j] == 1]
    print(names[i] + ": " + " ".join(neighbours))
    for j in range(i + 1, len(names)):
        if matrix[i][j] == 1:
            edges = edges + 1
print("Edges: " + str(edges))`,
        inputs: [
          "A B C\n0 1 1\n1 0 0\n1 0 0",
          "X Y\n0 0\n0 0",
          "P Q R S\n0 1 1 1\n1 0 1 0\n1 1 0 0\n1 0 0 0",
        ],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Followers and following",
        brief: `
On a social network, \`A B\` means A follows B: a **directed** edge. Input a whole number \`n\` and then \`n\` such lines, then one name.

Print \`Following: \` and how many people that name follows, then \`Followers: \` and how many people follow them.`,
        starter: "",
        hints: [
          "Following is the number of lines where the name is first; followers, where it is second.",
          "You can count while reading, without storing the whole graph.",
        ],
        solution: `edges = []
for i in range(int(input())):
    edges.append(input().split())
name = input()
following = sum(1 for a, b in edges if a == name)
followers = sum(1 for a, b in edges if b == name)
print("Following: " + str(following))
print("Followers: " + str(followers))`,
        inputs: ["3\nAda Sam\nSam Ada\nLi Ada\nAda", "1\nX Y\nZ", "2\nA B\nA C\nA"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Friends of friends",
        brief: `
Input an undirected friendship graph as a whole number \`n\` followed by \`n\` pairs of names, then one name.

Print, in alphabetical order separated by spaces, everyone who is a friend of one of that person's friends but **isn't** the person themselves or already their friend. Print \`Nobody\` if there's no one.`,
        starter: "",
        hints: [
          "Build an adjacency list, then loop over each friend's friends.",
          "Use a set to collect them, and leave out the person and their direct friends.",
        ],
        solution: `graph = {}
for i in range(int(input())):
    a, b = input().split()
    graph.setdefault(a, set()).add(b)
    graph.setdefault(b, set()).add(a)
name = input()
friends = graph.get(name, set())
suggest = set()
for f in friends:
    for ff in graph[f]:
        if ff != name and ff not in friends:
            suggest.add(ff)
print(" ".join(sorted(suggest)) if suggest else "Nobody")`,
        inputs: ["3\nAda Sam\nSam Li\nLi Jo\nAda", "2\nA B\nB C\nB", "1\nX Y\nZ"],
      },
    ],
  },
  {
    title: "Breadth-first and depth-first search",
    summary:
      "Exploring a graph one level at a time with a queue, or one path at a time with a stack.",
    notes: `
Two ways to visit every vertex you can reach from a starting vertex:

**Breadth-first search (BFS)** explores in rings: first every neighbour of the start, then every neighbour of those, and so on. It uses a **queue**:

\`\`\`python
visited = [start]
queue = [start]
while queue:
    v = queue.pop(0)
    for n in graph[v]:
        if n not in visited:
            visited.append(n)
            queue.append(n)
\`\`\`

Because it explores level by level, BFS finds the **shortest path** (fewest edges) in an unweighted graph.

---

**Depth-first search (DFS)** follows one path as far as it can, then **backtracks** to the last vertex with an unexplored neighbour. It uses a **stack**, or recursion (which uses the call stack):

\`\`\`python
def dfs(v, visited):
    visited.append(v)
    for n in graph[v]:
        if n not in visited:
            dfs(n, visited)
\`\`\`

DFS is used to solve mazes, check whether a graph is connected, and find cycles.

In both, the **visited** list stops a vertex being explored twice, which would otherwise loop forever round a cycle. In these tasks, neighbours are always looked at in **alphabetical order**, so the visiting order is fixed.
`,
    worked_example: `graph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}
visited = ["A"]
queue = ["A"]
while queue:
    v = queue.pop(0)
    for n in graph[v]:
        if n not in visited:
            visited.append(n)
            queue.append(n)
print(visited)`,
    worked_example_note:
      "A's neighbours B and C are visited first, then D (a neighbour of B). D is only added once, because the visited list already holds it when C is explored.",
    quiz: [
      {
        question: "Which search finds the route with the fewest edges in an unweighted graph?",
        options: ["Breadth-first search", "Depth-first search", "Both always do", "Neither"],
        answer: "Breadth-first search",
        explanation:
          "BFS reaches every vertex one edge away before any two edges away, so the first time it reaches a vertex is by a shortest route.",
      },
      {
        question: "Which data structure does depth-first search use?",
        options: ["A stack (or recursion)", "A queue", "A hash table", "A priority queue"],
        answer: "A stack (or recursion)",
        explanation: "DFS goes deep and backtracks: last in, first out.",
      },
      {
        question: "Why do both searches keep a visited list?",
        options: [
          "So no vertex is explored twice, which could loop forever round a cycle",
          "To sort the vertices",
          "To count the edges",
          "To find the start vertex",
        ],
        answer: "So no vertex is explored twice, which could loop forever round a cycle",
        explanation: "Without it, A to B to A to B... would never end.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 3,
        xp: 30,
        title: "Breadth-first order",
        brief: `
The starter code reads an undirected graph into an adjacency list, with each vertex's neighbours sorted alphabetically.

Then input a start vertex. Print the order a **breadth-first search** visits the vertices, separated by spaces, using a queue and a visited list as in the notes.`,
        starter: BUILD_GRAPH,
        hints: [
          "visited = [start] and queue = [start] to begin.",
          "Mark a neighbour as visited when you add it to the queue, not when you take it off.",
        ],
        solution: `${BUILD_GRAPH}
start = input()
visited = [start]
queue = [start]
while queue:
    v = queue.pop(0)
    for n in graph[v]:
        if n not in visited:
            visited.append(n)
            queue.append(n)
print(" ".join(visited))`,
        inputs: ["4\nA B\nA C\nB D\nC D\nA", "5\nA B\nA C\nB D\nC E\nD E\nB", "1\nX Y\nY"],
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 30,
        title: "Depth-first order",
        brief: `
Using the starter code's graph (neighbours in alphabetical order), input a start vertex and print the order a recursive **depth-first search** visits the vertices, separated by spaces.

Write \`dfs(v, visited)\`: add \`v\` to \`visited\`, then for each neighbour in order, if it hasn't been visited, call \`dfs\` on it.`,
        starter: BUILD_GRAPH,
        hints: [
          "def dfs(v, visited): visited.append(v); for n in graph[v]: if n not in visited: dfs(n, visited)",
          "Call it with an empty list, then print the list.",
        ],
        solution: `${BUILD_GRAPH}
def dfs(v, visited):
    visited.append(v)
    for n in graph[v]:
        if n not in visited:
            dfs(n, visited)

order = []
dfs(input(), order)
print(" ".join(order))`,
        inputs: [
          "4\nA B\nA C\nB D\nC D\nA",
          "5\nA B\nA C\nB D\nC E\nD E\nB",
          "3\nA B\nB C\nC A\nC",
        ],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Fewest steps",
        brief: `
Using the starter code's graph, input a start vertex and a target vertex on two lines. Use breadth-first search to find the smallest number of edges between them.

Keep a dictionary \`distance\` instead of a visited list: \`distance[start] = 0\`, and when you first reach a neighbour, set its distance to the current vertex's distance + 1. Print \`Steps: \` and the distance to the target, or \`No route\` if it is never reached.`,
        starter: BUILD_GRAPH,
        hints: [
          "A vertex has been visited if it is already a key in distance.",
          "graph.get(v, []) avoids a crash if the start vertex isn't in any edge.",
        ],
        solution: `${BUILD_GRAPH}
start = input()
target = input()
distance = {start: 0}
queue = [start]
while queue:
    v = queue.pop(0)
    for n in graph.get(v, []):
        if n not in distance:
            distance[n] = distance[v] + 1
            queue.append(n)
print("Steps: " + str(distance[target]) if target in distance else "No route")`,
        inputs: [
          "5\nA B\nA C\nB D\nC E\nD E\nA\nE",
          "2\nA B\nC D\nA\nD",
          "1\nX Y\nX\nX",
          "4\nA B\nB C\nC D\nA D\nA\nC",
        ],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "How many islands?",
        brief: `
A graph may be in several separate pieces, called **connected components**. Input a line of every vertex name, then a whole number \`n\`, then \`n\` undirected edges.

Count the components: go through the vertices in alphabetical order, and each time you find one that hasn't been visited yet, that's a new component; run a search (BFS or DFS) from it to mark everything it can reach. Print \`Components: \` and the count.`,
        starter: "",
        hints: [
          "Start every vertex with an empty neighbour list, so vertices with no edges still count.",
          "One visited set is shared across all the searches.",
        ],
        solution: `names = input().split()
graph = {v: [] for v in names}
for i in range(int(input())):
    a, b = input().split()
    graph[a].append(b)
    graph[b].append(a)
visited = set()
count = 0
for v in sorted(names):
    if v not in visited:
        count = count + 1
        stack = [v]
        visited.add(v)
        while stack:
            current = stack.pop()
            for n in graph[current]:
                if n not in visited:
                    visited.add(n)
                    stack.append(n)
print("Components: " + str(count))`,
        inputs: [
          "A B C D E\n2\nA B\nD E",
          "A B C\n3\nA B\nB C\nC A",
          "P Q R\n0",
          "A B C D\n1\nB C",
        ],
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Escape the maze",
        brief: `
A maze is a grid of \`.\` (open), \`#\` (wall), one \`S\` (start) and one \`E\` (exit). You can move up, down, left or right onto any square that isn't a wall.

Treat each open square as a vertex and use breadth-first search to find the fewest moves from S to E. Input the number of rows, then each row. Print \`Moves: \` and the number of moves, or \`No way out\`.`,
        starter: "",
        hints: [
          "Find S first. Then BFS from it, with a distance dictionary keyed by (row, col).",
          "For each square taken from the queue, try its four neighbours, skipping any outside the grid or a #.",
        ],
        solution: `rows = int(input())
grid = [input() for i in range(rows)]
start = None
for r in range(rows):
    for c in range(len(grid[r])):
        if grid[r][c] == "S":
            start = (r, c)
distance = {start: 0}
queue = [start]
answer = None
while queue:
    r, c = queue.pop(0)
    if grid[r][c] == "E":
        answer = distance[(r, c)]
        break
    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < len(grid[nr]) and grid[nr][nc] != "#" and (nr, nc) not in distance:
            distance[(nr, nc)] = distance[(r, c)] + 1
            queue.append((nr, nc))
print("Moves: " + str(answer) if answer is not None else "No way out")`,
        inputs: ["3\nS.#\n#.#\n#.E", "3\nS#.\n##.\n..E", "1\nSE", "4\nS...\n.##.\n.#E.\n...."],
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 30,
        title: "Who can I reach?",
        brief: `
Using the starter code's graph, input a start vertex. Print, in alphabetical order separated by spaces, every **other** vertex that can be reached from it (using either search), or \`Nobody\`.`,
        starter: BUILD_GRAPH,
        hints: [
          "Run a BFS or DFS from the start and collect everything visited.",
          "Remove the start itself before printing.",
        ],
        solution: `${BUILD_GRAPH}
start = input()
visited = {start}
queue = [start]
while queue:
    v = queue.pop(0)
    for n in graph.get(v, []):
        if n not in visited:
            visited.add(n)
            queue.append(n)
visited.discard(start)
print(" ".join(sorted(visited)) if visited else "Nobody")`,
        inputs: ["3\nA B\nB C\nD E\nA", "3\nA B\nB C\nD E\nE", "1\nX Y\nZ"],
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Depth-first without recursion",
        brief: `
Depth-first search can use an explicit stack instead of recursion. Using the starter code's graph, input a start vertex and print the depth-first order, separated by spaces, **without** a recursive function.

To match the recursive order: push the start; then repeatedly pop a vertex, skip it if it's already visited, otherwise visit it and push its unvisited neighbours in **reverse** alphabetical order (so the alphabetically first is popped next).`,
        starter: BUILD_GRAPH,
        hints: [
          "for n in reversed(graph[v]): if n not in visited: stack.append(n)",
          "Check visited when you pop, because a vertex can be pushed more than once.",
        ],
        solution: `${BUILD_GRAPH}
start = input()
visited = []
stack = [start]
while stack:
    v = stack.pop()
    if v in visited:
        continue
    visited.append(v)
    for n in reversed(graph[v]):
        if n not in visited:
            stack.append(n)
print(" ".join(visited))`,
        inputs: [
          "4\nA B\nA C\nB D\nC D\nA",
          "5\nA B\nA C\nB D\nC E\nD E\nB",
          "3\nA B\nB C\nC A\nC",
        ],
      },
    ],
  },
];
