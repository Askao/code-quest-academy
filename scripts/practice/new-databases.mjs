// Practice pool for "Databases & SQL" (AQA only). Scoped tightly to what the
// two existing lessons actually teach - SELECT (all/some/reordered columns),
// WHERE (equality, comparisons, AND, OR) and ORDER BY - nothing further
// (no aggregates, GROUP BY or joins) since neither lesson covers them yet.
// Three small sample tables, reused across tasks like the lessons do.

const STUDENTS = `-- Sample database: a students table
CREATE TABLE students (id INTEGER, name TEXT, year INTEGER, house TEXT);
INSERT INTO students VALUES
  (1, 'Ada', 10, 'Turing'),
  (2, 'Grace', 11, 'Lovelace'),
  (3, 'Alan', 10, 'Hopper'),
  (4, 'Margaret', 9, 'Hopper'),
  (5, 'Tim', 11, 'Lovelace'),
  (6, 'Rosa', 9, 'Turing'),
  (7, 'Kwame', 10, 'Turing');

-- Write your query below this line:
`;

const BOOKS = `-- Sample database: a library's books table (price in pounds)
CREATE TABLE books (id INTEGER, title TEXT, author TEXT, year_published INTEGER, price INTEGER);
INSERT INTO books VALUES
  (1, 'The Hobbit', 'J.R.R. Tolkien', 1937, 8),
  (2, 'Charlotte''s Web', 'E.B. White', 1952, 4),
  (3, 'Matilda', 'Roald Dahl', 1988, 7),
  (4, 'Holes', 'Louis Sachar', 1998, 6),
  (5, 'The Giver', 'Lois Lowry', 1993, 3),
  (6, 'Wonder', 'R.J. Palacio', 2012, 9),
  (7, 'Percy Jackson and the Lightning Thief', 'Rick Riordan', 2005, 5),
  (8, 'Diary of a Wimpy Kid', 'Jeff Kinney', 2007, 11);

-- Write your query below this line:
`;

const STAFF = `-- Sample database: a school office staff table
CREATE TABLE staff (id INTEGER, name TEXT, department TEXT, salary INTEGER);
INSERT INTO staff VALUES
  (1, 'Priya Shah', 'IT', 34000),
  (2, 'Tom Reid', 'Admin', 24000),
  (3, 'Freya Marsh', 'IT', 41000),
  (4, 'Jayden Price', 'Admin', 26000),
  (5, 'Noor Ahmed', 'Science', 38000),
  (6, 'Lily Byrne', 'IT', 29000);

-- Write your query below this line:
`;

export const tasks = [
  {
    key: "01", tier: 1, difficulty: 1, xp: 10, title: "Just the year 10s",
    brief: "Below is a table called `students`. Write a query that selects every column, for every student in year 10.",
    hints: ["`WHERE` filters rows down to the ones you ask for, instead of returning every row.", "`SELECT * FROM students WHERE year = 10;`"],
    schema: STUDENTS,
    query: "SELECT * FROM students WHERE year = 10;",
  },
  {
    key: "02", tier: 1, difficulty: 1, xp: 10, title: "Everything about the books",
    brief: "Below is a table called `books`. Write a query that selects every column, for every book.",
    hints: ["`SELECT *` returns every column, so you don't have to name them one by one.", "`SELECT * FROM books;`"],
    schema: BOOKS,
    query: "SELECT * FROM books;",
  },
  {
    key: "03", tier: 2, difficulty: 2, xp: 15, title: "Just the titles",
    brief: "Using the `books` table, write a query that selects only the `title` column, for every book.",
    hints: ["Name the one column you want, instead of using `*`.", "`SELECT title FROM books;`"],
    schema: BOOKS,
    query: "SELECT title FROM books;",
  },
  {
    key: "04", tier: 2, difficulty: 2, xp: 15, title: "The cheap ones",
    brief: "Using the `books` table, write a query that selects the `title` and `price` of every book that costs less than £5.",
    hints: ["Combine a comparison in `WHERE` with picking specific columns in `SELECT`.", "`SELECT title, price FROM books WHERE price < 5;`"],
    schema: BOOKS,
    query: "SELECT title, price FROM books WHERE price < 5;",
  },
  {
    key: "05", tier: 2, difficulty: 2, xp: 15, title: "Turing house",
    brief: "Using the `students` table, write a query that selects the `name` of every student in Turing house.",
    hints: ["Text values in `WHERE` go in single quotes: `WHERE house = 'Turing'`.", "`SELECT name FROM students WHERE house = 'Turing';`"],
    schema: STUDENTS,
    query: "SELECT name FROM students WHERE house = 'Turing';",
  },
  {
    key: "06", tier: 3, difficulty: 2, xp: 20, title: "Cheapest first",
    brief: "Using the `books` table, write a query that selects the `title` and `price` of every book, ordered from cheapest to most expensive.",
    hints: ["`ORDER BY` sorts the results. On its own, it sorts smallest (or earliest, or A to Z) first.", "`SELECT title, price FROM books ORDER BY price;`"],
    schema: BOOKS,
    query: "SELECT title, price FROM books ORDER BY price;",
  },
  {
    key: "07", tier: 3, difficulty: 3, xp: 20, title: "Newest first",
    brief: "Using the `books` table, write a query that selects the `title` and `year_published` of every book, with the newest book first.",
    hints: ["`ORDER BY` sorts oldest/smallest first by default. Add `DESC` to reverse it.", "`SELECT title, year_published FROM books ORDER BY year_published DESC;`"],
    schema: BOOKS,
    query: "SELECT title, year_published FROM books ORDER BY year_published DESC;",
  },
  {
    key: "08", tier: 3, difficulty: 3, xp: 20, title: "Year 10 Turing",
    brief: "Using the `students` table, write a query that selects the `name` of every student who is in year 10 AND in Turing house.",
    hints: ["`AND` between two conditions in `WHERE` means both have to be true for a row to be included.", "`SELECT name FROM students WHERE year = 10 AND house = 'Turing';`"],
    schema: STUDENTS,
    query: "SELECT name FROM students WHERE year = 10 AND house = 'Turing';",
  },
  {
    key: "09", tier: 4, difficulty: 3, xp: 25, title: "Turing or Hopper",
    brief: "Using the `students` table, write a query that selects the `name` of every student who is in Turing house OR Hopper house.",
    hints: ["`OR` between two conditions means a row is included if either one is true.", "`SELECT name FROM students WHERE house = 'Turing' OR house = 'Hopper';`"],
    schema: STUDENTS,
    query: "SELECT name FROM students WHERE house = 'Turing' OR house = 'Hopper';",
  },
  {
    key: "10", tier: 4, difficulty: 4, xp: 25, title: "Well-paid staff",
    brief: "Below is a table called `staff`. Write a query that selects the `name`, `department` and `salary` of every staff member earning over £30,000, with the highest earner first.",
    hints: ["You need a `WHERE` condition and an `ORDER BY`, both in the same query, with `ORDER BY` last.", "`SELECT name, department, salary FROM staff WHERE salary > 30000 ORDER BY salary DESC;`"],
    schema: STAFF,
    query: "SELECT name, department, salary FROM staff WHERE salary > 30000 ORDER BY salary DESC;",
  },
  {
    key: "s1", tier: 4, difficulty: 5, xp: 35, stretch: true, title: "🌟 IT department, A to Z",
    brief: "Using the `staff` table, write a query that selects the `name` and `salary` of everyone in the IT department, in alphabetical order by name.",
    hints: ["Filter to the department first with `WHERE`, then sort by name - `ORDER BY` sorts text alphabetically the same way it sorts numbers.", "`SELECT name, salary FROM staff WHERE department = 'IT' ORDER BY name;`"],
    schema: STAFF,
    query: "SELECT name, salary FROM staff WHERE department = 'IT' ORDER BY name;",
  },
  {
    key: "s2", tier: 4, difficulty: 5, xp: 35, stretch: true, title: "🌟 Recent bargains",
    brief: "Using the `books` table, write a query that selects the `title` and `price` of every book published after the year 2000 AND costing less than £10, with the most expensive of those first.",
    hints: ["Two conditions joined with `AND`, then an `ORDER BY` with `DESC` to put the priciest first - `ORDER BY` still comes last.", "`SELECT title, price FROM books WHERE year_published > 2000 AND price < 10 ORDER BY price DESC;`"],
    schema: BOOKS,
    query: "SELECT title, price FROM books WHERE year_published > 2000 AND price < 10 ORDER BY price DESC;",
  },
];
