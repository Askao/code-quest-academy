// A level: SQL & databases. OCR H446 1.3.2 (relational databases, SQL:
// SELECT, FROM, WHERE, LIKE, AND, OR, DELETE, INSERT, DROP, JOIN; referential
// integrity); AQA 7517 4.10.3-4.10.4 (relational databases, SQL: retrieve,
// update, insert and delete data from multiple tables; define a table with
// CREATE TABLE). Every task runs in SQLite (sql.js), the same as the browser.
export const topic = "alevel-sql";

const SCHOOL_TABLES = `CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, year INTEGER, form TEXT);
INSERT INTO students VALUES
  (1, 'Ada', 12, 'Turing'),
  (2, 'Ben', 13, 'Hopper'),
  (3, 'Cara', 12, 'Hopper'),
  (4, 'Dev', 13, 'Turing'),
  (5, 'Eve', 12, 'Lovelace'),
  (6, 'Finn', 13, 'Lovelace'),
  (7, 'Gus', 12, 'Turing');

CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, teacher TEXT);
INSERT INTO courses VALUES
  (1, 'Computer Science', 'Mr Shah'),
  (2, 'Maths', 'Ms Okafor'),
  (3, 'Physics', 'Dr Reid'),
  (4, 'History', 'Mrs Bell'),
  (5, 'Art', 'Ms Lowe');

-- One row for each student on each course, with their latest test mark.
CREATE TABLE enrolments (student_id INTEGER, course_id INTEGER, mark INTEGER);
INSERT INTO enrolments VALUES
  (1, 1, 82), (1, 2, 74),
  (2, 1, 65), (2, 3, 58),
  (3, 2, 91), (3, 3, 77),
  (4, 1, 70), (4, 2, 55), (4, 4, 68),
  (5, 4, 88),
  (6, 1, 45);
`;

const SCHOOL = `-- Sample database: students, courses, and enrolments (who takes what)
${SCHOOL_TABLES}
-- Write your query below this line:
`;

const SETUP = SCHOOL_TABLES;

export const lessons = [
  {
    title: "Joining tables",
    summary:
      "Using primary and foreign keys to combine rows from two or three tables in one query.",
    notes: `
A **relational database** stores data in several **tables** that are linked together, instead of one huge table full of repeated data.

The sample database for this topic has three tables:
- \`students\` (id, name, year, form)
- \`courses\` (id, title, teacher)
- \`enrolments\` (student_id, course_id, mark): one row for each student on each course.

Each table's **primary key** (\`id\`) identifies a row uniquely. \`enrolments.student_id\` is a **foreign key**: it holds the primary key of a row in another table, which is what links the tables. **Referential integrity** means every foreign key must point at a row that really exists.

---

A **join** combines rows from two tables where the linking columns match:

\`\`\`sql
SELECT students.name, enrolments.mark
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id;
\`\`\`

- Write \`table.column\` when the same column name could come from more than one table.
- Join a third table by adding another \`INNER JOIN ... ON ...\`.
- You may also see the older style, which means the same: \`FROM students, enrolments WHERE students.id = enrolments.student_id\`.

An **INNER JOIN** only keeps rows that have a match in both tables. A **LEFT JOIN** keeps *every* row of the first table, and fills the other table's columns with \`NULL\` when there is no match: that's how you find students on no course.

Use \`ORDER BY\` whenever the order of rows matters; without it, the database may return them in any order.
`,
    worked_example_setup: SETUP,
    worked_example: `SELECT students.name, courses.title, enrolments.mark
FROM enrolments
INNER JOIN students ON students.id = enrolments.student_id
INNER JOIN courses ON courses.id = enrolments.course_id
WHERE enrolments.mark >= 80
ORDER BY enrolments.mark DESC;`,
    worked_example_note:
      "enrolments only holds id numbers. Joining it to students and courses swaps those numbers for the names and titles they point at.",
    quiz: [
      {
        question: "What is a foreign key?",
        options: [
          "A field that holds the primary key of a row in another table",
          "A field that is unique in its own table",
          "A key used to encrypt the database",
          "Any field that is not a number",
        ],
        answer: "A field that holds the primary key of a row in another table",
        explanation:
          "enrolments.student_id holds a students.id: that is what links the two tables.",
      },
      {
        question:
          "Which join keeps every row of the first table, even when nothing matches in the second?",
        options: ["LEFT JOIN", "INNER JOIN", "GROUP BY", "ORDER BY"],
        answer: "LEFT JOIN",
        explanation: "Missing values from the second table come back as NULL.",
      },
      {
        question: "What does referential integrity mean?",
        options: [
          "Every foreign key refers to a row that exists",
          "Every table has the same number of rows",
          "No field is ever empty",
          "The data is backed up",
        ],
        answer: "Every foreign key refers to a row that exists",
        explanation:
          "For example, an enrolment can't refer to a student who isn't in the students table.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "Computer Science marks",
        brief: `
Write a query that shows the **name** and **mark** of every student on course 1 (Computer Science), highest mark first.

You'll need to join \`students\` to \`enrolments\`.`,
        starter: SCHOOL,
        hints: [
          "FROM students INNER JOIN enrolments ON students.id = enrolments.student_id",
          "WHERE enrolments.course_id = 1 ORDER BY enrolments.mark DESC",
        ],
        query: `SELECT students.name, enrolments.mark
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.course_id = 1
ORDER BY enrolments.mark DESC;`,
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Names, courses and marks",
        brief: `
Write a query that shows every enrolment as the student's **name**, the course **title** and the **mark**, ordered by name and then by course title (both A to Z).

Join all three tables.`,
        starter: SCHOOL,
        hints: [
          "Start FROM enrolments, then join students and courses to it.",
          "ORDER BY students.name, courses.title",
        ],
        query: `SELECT students.name, courses.title, enrolments.mark
FROM enrolments
INNER JOIN students ON students.id = enrolments.student_id
INNER JOIN courses ON courses.id = enrolments.course_id
ORDER BY students.name, courses.title;`,
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Mr Shah's class list",
        brief: `
Mr Shah wants a list of the students he teaches. Write a query that shows the **name** and **form** of every student on a course taught by \`'Mr Shah'\`, in alphabetical order of name.

Don't use the course's id number: find it through the teacher's name.`,
        starter: SCHOOL,
        hints: [
          "You need all three tables: the teacher is in courses, the name is in students.",
          "WHERE courses.teacher = 'Mr Shah' ORDER BY students.name",
        ],
        query: `SELECT students.name, students.form
FROM enrolments
INNER JOIN students ON students.id = enrolments.student_id
INNER JOIN courses ON courses.id = enrolments.course_id
WHERE courses.teacher = 'Mr Shah'
ORDER BY students.name;`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Not on any course",
        brief: `
One student hasn't been put on any course yet. Write a query using a **LEFT JOIN** from \`students\` to \`enrolments\` that shows the **name** of every student who has no enrolments.

A student with no match has \`NULL\` in the enrolment columns.`,
        starter: SCHOOL,
        hints: [
          "FROM students LEFT JOIN enrolments ON students.id = enrolments.student_id",
          "WHERE enrolments.student_id IS NULL (use IS NULL, not = NULL)",
        ],
        query: `SELECT students.name
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.student_id IS NULL;`,
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Form partners",
        brief: `
A table can be joined to **itself**, using two different short names (aliases) for it: \`FROM students AS a INNER JOIN students AS b ON ...\`.

Write a query that lists every pair of different students in the **same form**, as \`a.name\`, \`b.name\` and the form. Show each pair only once, by keeping only the rows where \`a.id < b.id\`. Order by form, then by the first name, then the second.`,
        starter: SCHOOL,
        hints: ["ON a.form = b.form AND a.id < b.id", "ORDER BY a.form, a.name, b.name"],
        query: `SELECT a.name, b.name, a.form
FROM students AS a
INNER JOIN students AS b ON a.form = b.form AND a.id < b.id
ORDER BY a.form, a.name, b.name;`,
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Hopper form report",
        brief: `
Write a query that shows the **name**, course **title** and **mark** for every enrolment of a student in the \`'Hopper'\` form, highest mark first.`,
        starter: SCHOOL,
        hints: [
          "Join all three tables, then filter on students.form.",
          "ORDER BY enrolments.mark DESC",
        ],
        query: `SELECT students.name, courses.title, enrolments.mark
FROM enrolments
INNER JOIN students ON students.id = enrolments.student_id
INNER JOIN courses ON courses.id = enrolments.course_id
WHERE students.form = 'Hopper'
ORDER BY enrolments.mark DESC;`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "An empty course",
        brief: `
One course has nobody on it. Write a query using a LEFT JOIN from \`courses\` to \`enrolments\` that shows the **title** and **teacher** of every course with no enrolments.`,
        starter: SCHOOL,
        hints: [
          "FROM courses LEFT JOIN enrolments ON courses.id = enrolments.course_id",
          "WHERE enrolments.course_id IS NULL",
        ],
        query: `SELECT courses.title, courses.teacher
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
WHERE enrolments.course_id IS NULL;`,
      },
    ],
  },
  {
    title: "Grouping and totals",
    summary:
      "COUNT, SUM, AVG, MIN and MAX, with GROUP BY to work out a total for each group and HAVING to filter the groups.",
    notes: `
**Aggregate functions** work out one value from many rows:

| Function | Gives |
|---|---|
| \`COUNT(*)\` | the number of rows |
| \`SUM(mark)\` | the total |
| \`AVG(mark)\` | the mean |
| \`MIN(mark)\`, \`MAX(mark)\` | the smallest and largest |

\`SELECT AVG(mark) FROM enrolments;\` gives one row: the average of every mark. Use \`ROUND(AVG(mark), 1)\` to round to 1 decimal place.

---

**GROUP BY** splits the rows into groups that share a value, and works out the aggregate for **each group**:

\`\`\`sql
SELECT course_id, COUNT(*), AVG(mark)
FROM enrolments
GROUP BY course_id;
\`\`\`

Every column in the \`SELECT\` should either be in the \`GROUP BY\` or inside an aggregate function.

**WHERE** filters rows *before* they're grouped. **HAVING** filters the groups *afterwards*, so it can use an aggregate:

\`\`\`sql
SELECT student_id, COUNT(*) FROM enrolments
GROUP BY student_id
HAVING COUNT(*) > 1;
\`\`\`

\`AS\` gives a column a name, which you can then use in \`ORDER BY\`: \`SELECT form, COUNT(*) AS size ... ORDER BY size DESC\`.

\`COUNT(*)\` counts rows, but \`COUNT(column)\` counts only the rows where that column isn't \`NULL\`. That matters after a LEFT JOIN.
`,
    worked_example_setup: SETUP,
    worked_example: `SELECT courses.title, COUNT(*) AS students, MAX(enrolments.mark) AS top
FROM enrolments
INNER JOIN courses ON courses.id = enrolments.course_id
GROUP BY courses.title
ORDER BY students DESC, courses.title;`,
    worked_example_note:
      "GROUP BY makes one output row per course title. COUNT and MAX are then worked out separately for each course's enrolments.",
    quiz: [
      {
        question: "What is the difference between WHERE and HAVING?",
        options: [
          "WHERE filters rows before grouping; HAVING filters groups after",
          "They are the same",
          "HAVING filters rows before grouping; WHERE filters groups after",
          "HAVING can only be used with ORDER BY",
        ],
        answer: "WHERE filters rows before grouping; HAVING filters groups after",
        explanation: "So a condition on COUNT(*) or AVG(...) has to go in HAVING.",
      },
      {
        question: "SELECT form, COUNT(*) FROM students GROUP BY form; returns how many rows?",
        options: [
          "One for each different form",
          "One for each student",
          "Exactly one",
          "One for each column",
        ],
        answer: "One for each different form",
        explanation: "GROUP BY makes one group, and one result row, per distinct value.",
      },
      {
        question: "After a LEFT JOIN, why might COUNT(enrolments.student_id) differ from COUNT(*)?",
        options: [
          "COUNT(column) doesn't count NULLs",
          "COUNT(*) skips NULL rows",
          "COUNT(column) counts distinct values only",
          "They can never differ",
        ],
        answer: "COUNT(column) doesn't count NULLs",
        explanation:
          "A course with no enrolments still has one row after the LEFT JOIN, but its student_id is NULL.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "How big is each form?",
        brief: `
Write a query that shows each **form** and the **number of students** in it, in alphabetical order of form.`,
        starter: SCHOOL,
        hints: ["SELECT form, COUNT(*) FROM students", "GROUP BY form ORDER BY form"],
        query: `SELECT form, COUNT(*)
FROM students
GROUP BY form
ORDER BY form;`,
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Average mark per course",
        brief: `
Write a query that shows each course's **title** and its **average mark**, rounded to 1 decimal place, with the highest average first. Only courses with enrolments will appear.`,
        starter: SCHOOL,
        hints: [
          "Join courses to enrolments and GROUP BY courses.title.",
          "ROUND(AVG(enrolments.mark), 1) AS average, then ORDER BY average DESC",
        ],
        query: `SELECT courses.title, ROUND(AVG(enrolments.mark), 1) AS average
FROM enrolments
INNER JOIN courses ON courses.id = enrolments.course_id
GROUP BY courses.title
ORDER BY average DESC;`,
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Taking more than one course",
        brief: `
Write a query that shows the **name** of each student taking **more than one** course, and **how many** courses they take, in alphabetical order of name.`,
        starter: SCHOOL,
        hints: ["Join students to enrolments and GROUP BY students.name.", "HAVING COUNT(*) > 1"],
        query: `SELECT students.name, COUNT(*)
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id
GROUP BY students.name
HAVING COUNT(*) > 1
ORDER BY students.name;`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Lowest and highest",
        brief: `
For each **teacher**, show the teacher's name, the **lowest** mark and the **highest** mark among their students, and the **gap** between them (highest minus lowest). Order by the gap, largest first. Only teachers with students will appear.`,
        starter: SCHOOL,
        hints: [
          "MIN(enrolments.mark), MAX(enrolments.mark), and MAX(...) - MIN(...) AS gap",
          "GROUP BY courses.teacher ORDER BY gap DESC",
        ],
        query: `SELECT courses.teacher, MIN(enrolments.mark), MAX(enrolments.mark),
       MAX(enrolments.mark) - MIN(enrolments.mark) AS gap
FROM enrolments
INNER JOIN courses ON courses.id = enrolments.course_id
GROUP BY courses.teacher
ORDER BY gap DESC;`,
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Every course, even the empty one",
        brief: `
Write a query that shows **every** course's **title** and **how many students** are on it, **including** a course with nobody on it (which should show 0). Order by the number of students, most first, and then by title A to Z.

An INNER JOIN would leave the empty course out, and \`COUNT(*)\` would count it as 1.`,
        starter: SCHOOL,
        hints: [
          "FROM courses LEFT JOIN enrolments ON courses.id = enrolments.course_id",
          "COUNT(enrolments.student_id) AS students counts only the matched rows.",
        ],
        query: `SELECT courses.title, COUNT(enrolments.student_id) AS students
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.title
ORDER BY students DESC, courses.title;`,
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Form averages",
        brief: `
Write a query that shows each **form** and the **average mark** of every enrolment by students in that form, rounded to 1 decimal place, in alphabetical order of form.`,
        starter: SCHOOL,
        hints: [
          "Join students to enrolments, then GROUP BY students.form.",
          "ROUND(AVG(enrolments.mark), 1)",
        ],
        query: `SELECT students.form, ROUND(AVG(enrolments.mark), 1)
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id
GROUP BY students.form
ORDER BY students.form;`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Busy teachers",
        brief: `
Write a query that shows each **teacher** with **at least 3** students, with the number of students and their students' **total** marks. Order by the number of students, most first.`,
        starter: SCHOOL,
        hints: [
          "GROUP BY courses.teacher, then HAVING COUNT(*) >= 3.",
          "SUM(enrolments.mark) gives the total.",
        ],
        query: `SELECT courses.teacher, COUNT(*) AS students, SUM(enrolments.mark)
FROM enrolments
INNER JOIN courses ON courses.id = enrolments.course_id
GROUP BY courses.teacher
HAVING COUNT(*) >= 3
ORDER BY students DESC;`,
      },
    ],
  },
  {
    title: "Nested queries",
    summary:
      "Putting one SELECT inside another, to compare with an average, test membership with IN, or find the top in each group.",
    notes: `
A **nested query** (or **subquery**) is a \`SELECT\` inside another query, in brackets. The inner query runs first and its result is used by the outer one.

**Comparing with a single value**: the subquery must return one value.

\`\`\`sql
SELECT student_id, mark FROM enrolments
WHERE mark > (SELECT AVG(mark) FROM enrolments);
\`\`\`

**IN and NOT IN**: the subquery returns a list of values.

\`\`\`sql
SELECT name FROM students
WHERE id IN (SELECT student_id FROM enrolments WHERE course_id = 3);
\`\`\`

\`NOT IN\` finds the rows whose value is *not* in the list.

---

A **correlated subquery** refers to the outer query's row, so it is worked out again for each row. This finds the top mark in each course:

\`\`\`sql
SELECT course_id, student_id, mark FROM enrolments AS e
WHERE mark = (SELECT MAX(mark) FROM enrolments
              WHERE course_id = e.course_id);
\`\`\`

For each enrolment, the inner query finds the best mark *on that enrolment's course*, and the row is kept only if it is that mark.

A subquery can often be written as a join instead. Use whichever is clearer: subqueries are good for "more than the average" and "not in this list" questions.
`,
    worked_example_setup: SETUP,
    worked_example: `SELECT name FROM students
WHERE id NOT IN (SELECT student_id FROM enrolments WHERE course_id = 1)
ORDER BY name;`,
    worked_example_note:
      "The inner query lists the ids of everyone on Computer Science (1, 2, 4 and 6). The outer query keeps every student whose id isn't in that list.",
    quiz: [
      {
        question: "In a nested query, which SELECT is worked out first?",
        options: [
          "The inner one, in brackets",
          "The outer one",
          "Whichever is shorter",
          "They run at the same time",
        ],
        answer: "The inner one, in brackets",
        explanation: "Its result is then used by the outer query.",
      },
      {
        question: "WHERE mark > (SELECT AVG(mark) FROM enrolments) keeps which rows?",
        options: [
          "Marks above the average of all marks",
          "Marks above each student's own average",
          "The single highest mark",
          "Every mark",
        ],
        answer: "Marks above the average of all marks",
        explanation: "The subquery returns one number: the average of every row in enrolments.",
      },
      {
        question: "What makes a subquery 'correlated'?",
        options: [
          "It refers to a column of the outer query's current row",
          "It uses GROUP BY",
          "It returns more than one row",
          "It is used with IN",
        ],
        answer: "It refers to a column of the outer query's current row",
        explanation: "So it is worked out again for each row of the outer query.",
      },
    ],
    tasks: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Above average",
        brief: `
Write a query that shows the **name** and **mark** for every enrolment whose mark is **higher than the average of all marks**, highest mark first. Use a subquery to work out the average.`,
        starter: SCHOOL,
        hints: [
          "WHERE enrolments.mark > (SELECT AVG(mark) FROM enrolments)",
          "Join students to enrolments for the name.",
        ],
        query: `SELECT students.name, enrolments.mark
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.mark > (SELECT AVG(mark) FROM enrolments)
ORDER BY enrolments.mark DESC;`,
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Who takes Physics?",
        brief: `
Write a query that shows the **name** of every student who takes Physics, in alphabetical order. Don't use a join: use \`IN\` with a subquery on \`enrolments\`, and a second subquery to find Physics's course id from its title.`,
        starter: SCHOOL,
        hints: [
          "WHERE id IN (SELECT student_id FROM enrolments WHERE course_id = ...)",
          "The ... is (SELECT id FROM courses WHERE title = 'Physics').",
        ],
        query: `SELECT name FROM students
WHERE id IN (SELECT student_id FROM enrolments
             WHERE course_id = (SELECT id FROM courses WHERE title = 'Physics'))
ORDER BY name;`,
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "Not doing Maths",
        brief: `
Write a query that shows the **name** and **year** of every student who does **not** take Maths (course 2), in alphabetical order of name. Students on no course at all should be included.`,
        starter: SCHOOL,
        hints: [
          "NOT IN (SELECT student_id FROM enrolments WHERE course_id = 2)",
          "A LEFT JOIN isn't needed: NOT IN already includes students with no enrolments.",
        ],
        query: `SELECT name, year FROM students
WHERE id NOT IN (SELECT student_id FROM enrolments WHERE course_id = 2)
ORDER BY name;`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 40,
        title: "Top of each course",
        brief: `
Write a query that shows, for each course with enrolments, the course **title**, the **name** of the student with the highest mark on that course, and that **mark**, in alphabetical order of title.

Use a **correlated subquery**: keep an enrolment only if its mark equals the highest mark on the same course.`,
        starter: SCHOOL,
        hints: [
          "Give the outer enrolments an alias: FROM enrolments AS e",
          "WHERE e.mark = (SELECT MAX(mark) FROM enrolments WHERE course_id = e.course_id)",
        ],
        query: `SELECT courses.title, students.name, e.mark
FROM enrolments AS e
INNER JOIN students ON students.id = e.student_id
INNER JOIN courses ON courses.id = e.course_id
WHERE e.mark = (SELECT MAX(mark) FROM enrolments WHERE course_id = e.course_id)
ORDER BY courses.title;`,
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Better than the school",
        brief: `
Write a query that shows the **name** of each student whose **own average mark** is higher than the **average of all marks**, along with their average rounded to 1 decimal place. Highest average first.

You'll need \`GROUP BY\`, and \`HAVING\` with a subquery.`,
        starter: SCHOOL,
        hints: [
          "GROUP BY students.name, then HAVING AVG(enrolments.mark) > (SELECT AVG(mark) FROM enrolments)",
          "ROUND(AVG(enrolments.mark), 1) AS average ... ORDER BY average DESC",
        ],
        query: `SELECT students.name, ROUND(AVG(enrolments.mark), 1) AS average
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id
GROUP BY students.name
HAVING AVG(enrolments.mark) > (SELECT AVG(mark) FROM enrolments)
ORDER BY average DESC;`,
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "The best mark in the school",
        brief: `
Write a query that shows the **name**, course **title** and **mark** of the single highest mark in the school. Use a subquery with \`MAX\` rather than \`ORDER BY\` and \`LIMIT\`.`,
        starter: SCHOOL,
        hints: [
          "WHERE enrolments.mark = (SELECT MAX(mark) FROM enrolments)",
          "Join all three tables for the name and title.",
        ],
        query: `SELECT students.name, courses.title, enrolments.mark
FROM enrolments
INNER JOIN students ON students.id = enrolments.student_id
INNER JOIN courses ON courses.id = enrolments.course_id
WHERE enrolments.mark = (SELECT MAX(mark) FROM enrolments);`,
      },
      {
        tier: 4,
        difficulty: 4,
        xp: 40,
        title: "Most popular course",
        brief: `
Write a query that shows the **title** of the course with the **most** students, and how many it has. Don't use \`LIMIT\`: if two courses tied, both should appear.

A subquery can itself be used as a table: \`SELECT MAX(n) FROM (SELECT COUNT(*) AS n FROM enrolments GROUP BY course_id)\` finds the biggest count.`,
        starter: SCHOOL,
        hints: [
          "GROUP BY courses.title, then HAVING COUNT(*) = (the subquery from the brief).",
          "Join courses to enrolments for the title.",
        ],
        query: `SELECT courses.title, COUNT(*)
FROM enrolments
INNER JOIN courses ON courses.id = enrolments.course_id
GROUP BY courses.title
HAVING COUNT(*) = (SELECT MAX(n) FROM (SELECT COUNT(*) AS n FROM enrolments GROUP BY course_id));`,
      },
    ],
  },
  {
    title: "Changing data and creating tables",
    summary:
      "INSERT, UPDATE and DELETE to change the data, and CREATE TABLE to define a new table with keys.",
    notes: `
**Adding a row**:
\`\`\`sql
INSERT INTO students (id, name, year, form) VALUES (8, 'Hana', 12, 'Hopper');
\`\`\`
You can leave out the column list if you give a value for every column, in order.

**Changing rows**: \`SET\` the new values, and \`WHERE\` says which rows.
\`\`\`sql
UPDATE enrolments SET mark = mark + 5 WHERE course_id = 3;
\`\`\`

**Removing rows**:
\`\`\`sql
DELETE FROM enrolments WHERE student_id = 2;
\`\`\`

**Always include a WHERE** with UPDATE and DELETE: without one, *every* row in the table is changed or deleted.

To keep referential integrity, delete the rows that point at a record (its enrolments) before deleting the record itself (the student).

---

**Creating a table** gives each column a name and a data type, and can set keys:

\`\`\`sql
CREATE TABLE clubs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  room TEXT
);
CREATE TABLE members (
  student_id INTEGER,
  club_id INTEGER,
  PRIMARY KEY (student_id, club_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);
\`\`\`

- \`NOT NULL\` means the field must have a value.
- A primary key made of two columns is a **composite key**: a student can join many clubs, but each club only once.
- Other data types you'll meet in exams: \`VARCHAR(n)\` (text of at most n characters), \`DATE\`, \`REAL\` or \`FLOAT\`, \`BOOLEAN\`.
- \`DROP TABLE clubs;\` deletes a whole table.

**In these tasks**, after changing the data, finish with a \`SELECT\` that shows the result, as each brief describes. The marking checks what that last SELECT shows.
`,
    worked_example_setup: SETUP,
    worked_example: `UPDATE enrolments SET mark = mark + 5 WHERE course_id = 3;
SELECT student_id, mark FROM enrolments WHERE course_id = 3 ORDER BY student_id;`,
    worked_example_note:
      "Both Physics marks go up by 5 (58 becomes 63 and 77 becomes 82). Every other course is untouched because of the WHERE.",
    quiz: [
      {
        question: "What happens if you run UPDATE enrolments SET mark = 0; with no WHERE?",
        options: [
          "Every row's mark becomes 0",
          "Nothing happens",
          "Only the first row changes",
          "An error is shown",
        ],
        answer: "Every row's mark becomes 0",
        explanation: "Without WHERE, the change applies to every row in the table.",
      },
      {
        question: "Why delete a student's enrolments before deleting the student?",
        options: [
          "So no enrolment is left pointing at a student who doesn't exist",
          "Because DELETE only works on one table a day",
          "To make the query faster",
          "It doesn't matter which order",
        ],
        answer: "So no enrolment is left pointing at a student who doesn't exist",
        explanation: "That would break referential integrity.",
      },
      {
        question: "PRIMARY KEY (student_id, club_id) is an example of what?",
        options: ["A composite key", "A foreign key", "A secondary index", "A data type"],
        answer: "A composite key",
        explanation: "The two fields together identify each row uniquely.",
      },
    ],
    tasks: [
      {
        tier: 1,
        difficulty: 2,
        xp: 20,
        title: "A new student",
        brief: `
A new student has joined. Add a row to \`students\` with id **8**, name **Hana**, year **12** and form **Hopper**.

Then show every column of every student in the Hopper form, ordered by id.`,
        starter: SCHOOL,
        hints: [
          "INSERT INTO students VALUES (8, 'Hana', 12, 'Hopper');",
          "SELECT * FROM students WHERE form = 'Hopper' ORDER BY id;",
        ],
        query: `INSERT INTO students VALUES (8, 'Hana', 12, 'Hopper');
SELECT * FROM students WHERE form = 'Hopper' ORDER BY id;`,
      },
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Correct a mark",
        brief: `
Finn's Computer Science mark was typed in wrongly: it should be **54**, not 45. Finn's student id is 6 and Computer Science is course 1.

Update just that one mark. Then show the \`student_id\` and \`mark\` of every Computer Science enrolment, ordered by student_id.`,
        starter: SCHOOL,
        hints: [
          "The WHERE needs both conditions: student_id = 6 AND course_id = 1.",
          "Then SELECT student_id, mark FROM enrolments WHERE course_id = 1 ORDER BY student_id;",
        ],
        query: `UPDATE enrolments SET mark = 54 WHERE student_id = 6 AND course_id = 1;
SELECT student_id, mark FROM enrolments WHERE course_id = 1 ORDER BY student_id;`,
      },
      {
        tier: 3,
        difficulty: 3,
        xp: 30,
        title: "A student leaves",
        brief: `
Ben (id 2) has left the school. Delete his enrolments, and then delete Ben from \`students\`, in that order.

Then show how many students and how many enrolments are left, as one row with two numbers: \`SELECT (SELECT COUNT(*) FROM students), (SELECT COUNT(*) FROM enrolments);\``,
        starter: SCHOOL,
        hints: [
          "DELETE FROM enrolments WHERE student_id = 2;",
          "DELETE FROM students WHERE id = 2;",
        ],
        query: `DELETE FROM enrolments WHERE student_id = 2;
DELETE FROM students WHERE id = 2;
SELECT (SELECT COUNT(*) FROM students), (SELECT COUNT(*) FROM enrolments);`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "Moderation",
        brief: `
The exam board has moderated the History marks up by **10%**. Update every History mark (course 4) to be its old mark multiplied by 1.1, rounded to the nearest whole number. Leave other courses alone.

Then show the \`name\` and new \`mark\` of every History student, highest mark first.`,
        starter: SCHOOL,
        hints: [
          "UPDATE enrolments SET mark = ROUND(mark * 1.1) WHERE course_id = 4;",
          "Join students to enrolments for the final SELECT, filtering on course_id = 4.",
        ],
        query: `UPDATE enrolments SET mark = ROUND(mark * 1.1) WHERE course_id = 4;
SELECT students.name, enrolments.mark
FROM students
INNER JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.course_id = 4
ORDER BY enrolments.mark DESC;`,
      },
      {
        tier: 4,
        difficulty: 5,
        xp: 45,
        stretch: true,
        title: "Clubs",
        brief: `
Create two new tables:
- \`clubs\`: \`id\` (whole number, the primary key) and \`name\` (text, must have a value).
- \`members\`: \`student_id\` and \`club_id\` (both whole numbers, foreign keys to \`students\` and \`clubs\`), with the pair of them as a composite primary key.

Add two clubs: **1, Chess** and **2, Robotics**. Then add members: Ada (1), Dev (4) and Eve (5) to Chess, and Ada (1) and Gus (7) to Robotics.

Finally show each club's **name** and its members' **names**, ordered by club name and then student name.`,
        starter: SCHOOL,
        hints: [
          "PRIMARY KEY (student_id, club_id), FOREIGN KEY (club_id) REFERENCES clubs(id)",
          "The final SELECT joins members to both clubs and students.",
        ],
        query: `CREATE TABLE clubs (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE members (
  student_id INTEGER,
  club_id INTEGER,
  PRIMARY KEY (student_id, club_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);
INSERT INTO clubs VALUES (1, 'Chess'), (2, 'Robotics');
INSERT INTO members VALUES (1, 1), (4, 1), (5, 1), (1, 2), (7, 2);
SELECT clubs.name, students.name
FROM members
INNER JOIN clubs ON clubs.id = members.club_id
INNER JOIN students ON students.id = members.student_id
ORDER BY clubs.name, students.name;`,
      },
    ],
    homework: [
      {
        tier: 2,
        difficulty: 3,
        xp: 25,
        title: "Forms merge",
        brief: `
The Lovelace form is closing, and its students are moving to **Turing**. Update every Lovelace student's form to Turing.

Then show each **form** and the **number of students** in it, in alphabetical order of form.`,
        starter: SCHOOL,
        hints: [
          "UPDATE students SET form = 'Turing' WHERE form = 'Lovelace';",
          "SELECT form, COUNT(*) FROM students GROUP BY form ORDER BY form;",
        ],
        query: `UPDATE students SET form = 'Turing' WHERE form = 'Lovelace';
SELECT form, COUNT(*) FROM students GROUP BY form ORDER BY form;`,
      },
      {
        tier: 3,
        difficulty: 4,
        xp: 35,
        title: "A new course",
        brief: `
A new course is starting: add course **6**, **Economics**, taught by **Mr Price**. Then enrol Gus (7) on it with a mark of **60**, and Cara (3) with a mark of **72**.

Then show the **name** and **mark** of every Economics student, in alphabetical order of name. Find Economics in the final query by its title, not its id.`,
        starter: SCHOOL,
        hints: [
          "INSERT INTO courses VALUES (6, 'Economics', 'Mr Price'); then INSERT INTO enrolments VALUES (7, 6, 60), (3, 6, 72);",
          "Join all three tables and use WHERE courses.title = 'Economics'.",
        ],
        query: `INSERT INTO courses VALUES (6, 'Economics', 'Mr Price');
INSERT INTO enrolments VALUES (7, 6, 60), (3, 6, 72);
SELECT students.name, enrolments.mark
FROM enrolments
INNER JOIN students ON students.id = enrolments.student_id
INNER JOIN courses ON courses.id = enrolments.course_id
WHERE courses.title = 'Economics'
ORDER BY students.name;`,
      },
    ],
  },
];
