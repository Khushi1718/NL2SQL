from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, Date, Text, Boolean
)
from sqlalchemy.orm import relationship
from database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    building = Column(String(100), nullable=False)
    budget = Column(Float, nullable=False)
    head_of_department = Column(String(100), nullable=False)

    employees = relationship("Employee", back_populates="department", cascade="all, delete-orphan")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    job_title = Column(String(100), nullable=False)
    salary = Column(Float, nullable=False)
    hire_date = Column(Date, nullable=False)

    department = relationship("Department", back_populates="employees")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    major = Column(String(100), nullable=False)
    gpa = Column(Float, nullable=False)
    enrollment_year = Column(Integer, nullable=False)

    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_code = Column(String(20), unique=True, nullable=False)
    title = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    credits = Column(Integer, nullable=False)
    instructor = Column(String(100), nullable=False)

    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester = Column(String(20), nullable=False)
    grade = Column(String(5), nullable=True)
    score_marks = Column(Float, nullable=False)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(30), nullable=True)
    city = Column(String(50), nullable=False)
    country = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(30), nullable=False)
    payment_method = Column(String(50), nullable=False)

    customer = relationship("Customer", back_populates="orders")


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    natural_language_query = Column(Text, nullable=False)
    generated_sql = Column(Text, nullable=False)
    executed_sql = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)  # 'SUCCESS', 'FAILED', 'VALIDATION_ERROR'
    execution_time_ms = Column(Float, default=0.0)
    row_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    prompt_used = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def seed_database(db):
    """Seed the database with realistic sample records if empty."""
    if db.query(Department).first():
        return

    # 1. Departments
    depts = [
        Department(name="Engineering", building="Tech Tower A", budget=1250000.0, head_of_department="Dr. Alan Turing"),
        Department(name="Marketing", building="West Wing 2", budget=480000.0, head_of_department="Sarah Jenkins"),
        Department(name="Finance", building="Commerce Hall", budget=820000.0, head_of_department="Robert Sterling"),
        Department(name="Human Resources", building="South Building", budget=310000.0, head_of_department="Elena Rostova"),
        Department(name="Product & Design", building="Innovation Lab", budget=740000.0, head_of_department="Marcus Brody"),
    ]
    db.add_all(depts)
    db.commit()

    # 2. Employees
    employees = [
        Employee(first_name="Alice", last_name="Walker", email="alice.walker@example.com", department_id=1, job_title="Senior Software Engineer", salary=135000.0, hire_date=date(2021, 3, 15)),
        Employee(first_name="Bob", last_name="Martin", email="bob.martin@example.com", department_id=1, job_title="Backend Developer", salary=110000.0, hire_date=date(2022, 6, 1)),
        Employee(first_name="Charlie", last_name="Davis", email="charlie.davis@example.com", department_id=1, job_title="DevOps Engineer", salary=122000.0, hire_date=date(2020, 11, 20)),
        Employee(first_name="Diana", last_name="Prince", email="diana.prince@example.com", department_id=1, job_title="Lead Architect", salary=158000.0, hire_date=date(2019, 4, 10)),
        Employee(first_name="Evan", last_name="Wright", email="evan.wright@example.com", department_id=2, job_title="Content Strategist", salary=72000.0, hire_date=date(2023, 1, 15)),
        Employee(first_name="Fiona", last_name="Gallagher", email="fiona.gallagher@example.com", department_id=2, job_title="Digital Marketing Manager", salary=89000.0, hire_date=date(2021, 8, 22)),
        Employee(first_name="George", last_name="Clark", email="george.clark@example.com", department_id=3, job_title="Senior Financial Analyst", salary=98000.0, hire_date=date(2020, 2, 14)),
        Employee(first_name="Hannah", last_name="Abbott", email="hannah.abbott@example.com", department_id=3, job_title="Accountant", salary=68000.0, hire_date=date(2022, 9, 5)),
        Employee(first_name="Ian", last_name="Malcolm", email="ian.malcolm@example.com", department_id=4, job_title="HR Specialist", salary=64000.0, hire_date=date(2023, 4, 1)),
        Employee(first_name="Julia", last_name="Roberts", email="julia.roberts@example.com", department_id=4, job_title="Talent Acquisition Director", salary=105000.0, hire_date=date(2018, 7, 19)),
        Employee(first_name="Kevin", last_name="Flynn", email="kevin.flynn@example.com", department_id=5, job_title="Lead UX Designer", salary=118000.0, hire_date=date(2021, 1, 10)),
        Employee(first_name="Laura", last_name="Croft", email="laura.croft@example.com", department_id=5, job_title="Senior Product Manager", salary=142000.0, hire_date=date(2020, 5, 18)),
        Employee(first_name="Michael", last_name="Scott", email="michael.scott@example.com", department_id=2, job_title="Sales Lead", salary=83000.0, hire_date=date(2022, 10, 1)),
        Employee(first_name="Nina", last_name="Simone", email="nina.simone@example.com", department_id=1, job_title="Data Scientist", salary=128000.0, hire_date=date(2022, 3, 28)),
    ]
    db.add_all(employees)
    db.commit()

    # 3. Students
    students = [
        Student(first_name="Alex", last_name="Chen", email="alex.chen@university.edu", major="Computer Science", gpa=3.85, enrollment_year=2021),
        Student(first_name="Emma", last_name="Watson", email="emma.watson@university.edu", major="Data Science", gpa=3.92, enrollment_year=2022),
        Student(first_name="Liam", last_name="Johnson", email="liam.johnson@university.edu", major="Electrical Engineering", gpa=3.45, enrollment_year=2020),
        Student(first_name="Sophia", last_name="Martinez", email="sophia.martinez@university.edu", major="Business Administration", gpa=3.70, enrollment_year=2022),
        Student(first_name="Noah", last_name="Taylor", email="noah.taylor@university.edu", major="Mathematics", gpa=3.60, enrollment_year=2021),
        Student(first_name="Olivia", last_name="Brown", email="olivia.brown@university.edu", major="Computer Science", gpa=3.98, enrollment_year=2023),
        Student(first_name="Ethan", last_name="Wilson", email="ethan.wilson@university.edu", major="Physics", gpa=3.20, enrollment_year=2020),
        Student(first_name="Ava", last_name="Miller", email="ava.miller@university.edu", major="Economics", gpa=3.55, enrollment_year=2022),
        Student(first_name="Lucas", last_name="Anderson", email="lucas.anderson@university.edu", major="Computer Science", gpa=2.90, enrollment_year=2021),
        Student(first_name="Mia", last_name="Thomas", email="mia.thomas@university.edu", major="Data Science", gpa=3.80, enrollment_year=2023),
    ]
    db.add_all(students)
    db.commit()

    # 4. Courses
    courses = [
        Course(course_code="CS101", title="Introduction to Computer Science", department="Computer Science", credits=4, instructor="Prof. Donald Knuth"),
        Course(course_code="CS201", title="Data Structures and Algorithms", department="Computer Science", credits=4, instructor="Prof. Robert Sedgewick"),
        Course(course_code="DS202", title="Database Systems and Design", department="Data Science", credits=3, instructor="Dr. Edgar Codd"),
        Course(course_code="MATH101", title="Calculus and Linear Algebra", department="Mathematics", credits=4, instructor="Dr. Carl Gauss"),
        Course(course_code="PHYS101", title="Classical Mechanics", department="Physics", credits=4, instructor="Dr. Richard Feynman"),
        Course(course_code="ECON101", title="Principles of Microeconomics", department="Economics", credits=3, instructor="Dr. Adam Smith"),
        Course(course_code="DS301", title="Machine Learning Foundations", department="Data Science", credits=4, instructor="Dr. Geoffrey Hinton"),
    ]
    db.add_all(courses)
    db.commit()

    # 5. Enrollments
    enrollments = [
        Enrollment(student_id=1, course_id=1, semester="Fall 2021", grade="A", score_marks=94.5),
        Enrollment(student_id=1, course_id=2, semester="Spring 2022", grade="A", score_marks=91.0),
        Enrollment(student_id=1, course_id=3, semester="Fall 2022", grade="A-", score_marks=88.5),
        Enrollment(student_id=2, course_id=1, semester="Fall 2022", grade="A", score_marks=98.0),
        Enrollment(student_id=2, course_id=3, semester="Spring 2023", grade="A", score_marks=95.0),
        Enrollment(student_id=2, course_id=7, semester="Fall 2023", grade="A", score_marks=96.5),
        Enrollment(student_id=3, course_id=4, semester="Fall 2020", grade="B", score_marks=82.0),
        Enrollment(student_id=3, course_id=5, semester="Spring 2021", grade="B+", score_marks=86.0),
        Enrollment(student_id=4, course_id=6, semester="Fall 2022", grade="A-", score_marks=89.0),
        Enrollment(student_id=5, course_id=4, semester="Fall 2021", grade="B", score_marks=79.5),
        Enrollment(student_id=6, course_id=1, semester="Fall 2023", grade="A+", score_marks=99.0),
        Enrollment(student_id=6, course_id=2, semester="Spring 2024", grade="A", score_marks=97.0),
        Enrollment(student_id=7, course_id=5, semester="Fall 2020", grade="C+", score_marks=68.5),
        Enrollment(student_id=8, course_id=6, semester="Fall 2022", grade="B+", score_marks=84.0),
        Enrollment(student_id=9, course_id=1, semester="Fall 2021", grade="C", score_marks=62.0),
        Enrollment(student_id=10, course_id=3, semester="Fall 2023", grade="A-", score_marks=89.5),
        Enrollment(student_id=10, course_id=7, semester="Spring 2024", grade="A", score_marks=93.0),
    ]
    db.add_all(enrollments)
    db.commit()

    # 6. Customers
    customers = [
        Customer(name="Acme Corporation", email="purchasing@acmecorp.com", phone="+1-555-0101", city="New York", country="USA"),
        Customer(name="Starlight Media", email="billing@starlightmedia.io", phone="+1-555-0102", city="San Francisco", country="USA"),
        Customer(name="Nordic Solutions", email="contact@nordicsolutions.se", phone="+46-8-123456", city="Stockholm", country="Sweden"),
        Customer(name="Quantum Ventures", email="accounts@quantumventures.com", phone="+1-555-0104", city="Chicago", country="USA"),
        Customer(name="Apex Logistics", email="ops@apexlogistics.co.uk", phone="+44-20-7946", city="London", country="UK"),
        Customer(name="BluePeak Labs", email="finance@bluepeaklabs.ca", phone="+1-416-555-0199", city="Toronto", country="Canada"),
        Customer(name="Zenith Retailers", email="orders@zenithretail.com", phone="+1-555-0107", city="Austin", country="USA"),
        Customer(name="Kyoto Dynamics", email="procurement@kyotodyn.jp", phone="+81-3-5555-0188", city="Kyoto", country="Japan"),
    ]
    db.add_all(customers)
    db.commit()

    # 7. Orders
    orders = [
        Order(customer_id=1, order_date=date(2024, 1, 15), total_amount=4500.0, status="Completed", payment_method="Bank Transfer"),
        Order(customer_id=1, order_date=date(2024, 3, 20), total_amount=3200.0, status="Completed", payment_method="Bank Transfer"),
        Order(customer_id=2, order_date=date(2024, 2, 10), total_amount=8900.0, status="Completed", payment_method="Credit Card"),
        Order(customer_id=2, order_date=date(2024, 4, 5), total_amount=12400.0, status="Processing", payment_method="Credit Card"),
        Order(customer_id=3, order_date=date(2024, 1, 28), total_amount=2100.0, status="Completed", payment_method="Wire Transfer"),
        Order(customer_id=4, order_date=date(2024, 3, 1), total_amount=15750.0, status="Completed", payment_method="Corporate Invoice"),
        Order(customer_id=4, order_date=date(2024, 4, 12), total_amount=6200.0, status="Completed", payment_method="Corporate Invoice"),
        Order(customer_id=5, order_date=date(2024, 2, 18), total_amount=5400.0, status="Completed", payment_method="Credit Card"),
        Order(customer_id=6, order_date=date(2024, 3, 14), total_amount=7300.0, status="Delivered", payment_method="Bank Transfer"),
        Order(customer_id=7, order_date=date(2024, 4, 2), total_amount=1850.0, status="Completed", payment_method="Credit Card"),
        Order(customer_id=8, order_date=date(2024, 4, 18), total_amount=9600.0, status="Completed", payment_method="Wire Transfer"),
    ]
    db.add_all(orders)
    db.commit()

    # 8. Initial Query History for realistic analytics
    initial_history = [
        QueryHistory(
            natural_language_query="Show all students who scored more than 80 marks.",
            generated_sql="""SELECT s.first_name, s.last_name, s.major, c.title AS course_title, e.score_marks, e.grade\nFROM students s\nJOIN enrollments e ON s.id = e.student_id\nJOIN courses c ON e.course_id = c.id\nWHERE e.score_marks > 80\nORDER BY e.score_marks DESC;""",
            executed_sql="""SELECT s.first_name, s.last_name, s.major, c.title AS course_title, e.score_marks, e.grade\nFROM students s\nJOIN enrollments e ON s.id = e.student_id\nJOIN courses c ON e.course_id = c.id\nWHERE e.score_marks > 80\nORDER BY e.score_marks DESC;""",
            status="SUCCESS",
            execution_time_ms=18.4,
            row_count=13,
            created_at=datetime.utcnow()
        ),
        QueryHistory(
            natural_language_query="Find the top 5 customers by total purchase amount.",
            generated_sql="""SELECT c.name, c.email, c.city, c.country, SUM(o.total_amount) AS total_purchase\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name\nORDER BY total_purchase DESC\nLIMIT 5;""",
            executed_sql="""SELECT c.name, c.email, c.city, c.country, SUM(o.total_amount) AS total_purchase\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name\nORDER BY total_purchase DESC\nLIMIT 5;""",
            status="SUCCESS",
            execution_time_ms=14.2,
            row_count=5,
            created_at=datetime.utcnow()
        ),
        QueryHistory(
            natural_language_query="How many employees work in each department?",
            generated_sql="""SELECT d.name AS department_name, COUNT(e.id) AS employee_count, ROUND(AVG(e.salary), 2) AS avg_salary\nFROM departments d\nLEFT JOIN employees e ON d.id = e.department_id\nGROUP BY d.id, d.name\nORDER BY employee_count DESC;""",
            executed_sql="""SELECT d.name AS department_name, COUNT(e.id) AS employee_count, ROUND(AVG(e.salary), 2) AS avg_salary\nFROM departments d\nLEFT JOIN employees e ON d.id = e.department_id\nGROUP BY d.id, d.name\nORDER BY employee_count DESC;""",
            status="SUCCESS",
            execution_time_ms=12.1,
            row_count=5,
            created_at=datetime.utcnow()
        ),
        QueryHistory(
            natural_language_query="Display the average salary of employees.",
            generated_sql="""SELECT ROUND(AVG(salary), 2) AS average_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary, COUNT(*) AS total_employees\nFROM employees;""",
            executed_sql="""SELECT ROUND(AVG(salary), 2) AS average_salary, MIN(salary) AS min_salary, MAX(salary) AS max_salary, COUNT(*) AS total_employees\nFROM employees;""",
            status="SUCCESS",
            execution_time_ms=9.8,
            row_count=1,
            created_at=datetime.utcnow()
        ),
        QueryHistory(
            natural_language_query="List all products with zero inventory",
            generated_sql="""SELECT * FROM products WHERE stock_quantity = 0;""",
            executed_sql="""SELECT * FROM products WHERE stock_quantity = 0;""",
            status="FAILED",
            execution_time_ms=8.5,
            row_count=0,
            error_message="no such table: products (Table not found in database schema)",
            created_at=datetime.utcnow()
        ),
    ]
    db.add_all(initial_history)
    db.commit()
