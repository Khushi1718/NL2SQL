"""
Few-Shot Prompting Library for QueryMate.
Provides exemplary natural language to SQL translation pairs demonstrating:
- Multi-table JOINs
- Aggregations and GROUP BY
- Window / Subqueries
- Filtering with WHERE
- Top-N ranking with ORDER BY and LIMIT
"""

FEW_SHOT_EXAMPLES = [
    {
        "id": 1,
        "category": "Relational Filter & Join",
        "question": "Show all students who scored more than 80 marks.",
        "thought_process": "1. Identify tables: 'students' holds personal info, 'enrollments' holds course scores (score_marks), 'courses' holds course titles.\n2. Join students and enrollments on student_id = id.\n3. Join courses on course_id = id to display course context.\n4. Filter score_marks > 80 and order descending.",
        "sql": "SELECT s.id, s.first_name, s.last_name, s.major, c.title AS course_title, e.score_marks, e.grade FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id WHERE e.score_marks > 80 ORDER BY e.score_marks DESC",
        "explanation": "Retrieves students who attained over 80 marks in any enrolled course, joined with course titles."
    },
    {
        "id": 2,
        "category": "Aggregation & Top-N Ranking",
        "question": "Find the top 5 customers by total purchase amount.",
        "thought_process": "1. Target tables: 'customers' and 'orders'.\n2. Group by customer id and customer details.\n3. Aggregate order total_amount with SUM().\n4. Sort by the total purchase descending and limit to 5.",
        "sql": "SELECT c.id, c.name, c.email, c.city, c.country, ROUND(SUM(o.total_amount), 2) AS total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name, c.email, c.city, c.country ORDER BY total_spent DESC LIMIT 5",
        "explanation": "Calculates the sum of order amounts per customer and returns the top 5 highest spending customers."
    },
    {
        "id": 3,
        "category": "Grouping & Count",
        "question": "How many employees work in each department?",
        "thought_process": "1. Target tables: 'departments' and 'employees'.\n2. Use a LEFT JOIN so departments with zero employees are still counted.\n3. Group by department id and name, then use COUNT(e.id).",
        "sql": "SELECT d.id AS department_id, d.name AS department_name, d.building, COUNT(e.id) AS employee_count, ROUND(COALESCE(AVG(e.salary), 0), 2) AS average_salary FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name, d.building ORDER BY employee_count DESC",
        "explanation": "Groups employees by department to count headcount and compute average salary per department."
    },
    {
        "id": 4,
        "category": "Statistical Summary",
        "question": "Display the average salary of employees.",
        "thought_process": "1. Target table: 'employees'.\n2. Calculate summary statistics: AVG, MIN, MAX of salary, and total headcount.\n3. Format with ROUND for currency readability.",
        "sql": "SELECT ROUND(AVG(salary), 2) AS average_salary, ROUND(MIN(salary), 2) AS minimum_salary, ROUND(MAX(salary), 2) AS maximum_salary, COUNT(*) AS total_employees FROM employees",
        "explanation": "Computes overall employee salary statistics including mean, min, max, and total count."
    },
    {
        "id": 5,
        "category": "Multi-Table Analytics",
        "question": "List all courses with their enrolled student count and average score.",
        "thought_process": "1. Target tables: 'courses' and 'enrollments'.\n2. Left join so courses without enrollments appear.\n3. Count student enrollments and calculate average score_marks per course.",
        "sql": "SELECT c.course_code, c.title, c.credits, c.instructor, COUNT(e.id) AS enrolled_students, ROUND(AVG(e.score_marks), 2) AS average_score FROM courses c LEFT JOIN enrollments e ON c.id = e.course_id GROUP BY c.id, c.course_code, c.title, c.credits, c.instructor ORDER BY enrolled_students DESC",
        "explanation": "Aggregates course popularity by number of enrollees and calculates academic performance per course."
    },
    {
        "id": 6,
        "category": "Subquery Comparison",
        "question": "Find all students who have a GPA higher than the overall average GPA.",
        "thought_process": "1. Target table: 'students'.\n2. Compute scalar subquery (SELECT AVG(gpa) FROM students).\n3. Compare each student's gpa against the subquery result.",
        "sql": "SELECT first_name, last_name, major, gpa, enrollment_year FROM students WHERE gpa > (SELECT AVG(gpa) FROM students) ORDER BY gpa DESC",
        "explanation": "Filters for academically distinguished students whose GPA exceeds the cohort average."
    }
]

def format_few_shot_for_prompt() -> str:
    """Formats few-shot examples into the prompt text."""
    blocks = ["### FEW-SHOT DEMONSTRATIONS:\n"]
    for ex in FEW_SHOT_EXAMPLES:
        blocks.append(f"Example #{ex['id']} [{ex['category']}]:")
        blocks.append(f"User Query: \"{ex['question']}\"")
        blocks.append(f"Thought Process: {ex['thought_process']}")
        blocks.append(f"Generated SQL: {ex['sql']}")
        blocks.append(f"Explanation: {ex['explanation']}\n")
    return "\n".join(blocks)
