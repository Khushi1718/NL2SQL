import os
import sys
import unittest
import warnings

warnings.filterwarnings("ignore")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.query_service import QueryService
from database_manager import DatabaseManager

class TestNL2SQLEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Locate the Iris database
        all_dbs = DatabaseManager.list_databases()
        cls.iris_db_id = None
        for db in all_dbs:
            if "iris" in db.get("database_name", "").lower() or "iris" in db.get("original_filename", "").lower():
                cls.iris_db_id = db["database_id"]
                break

        if not cls.iris_db_id and all_dbs:
            cls.iris_db_id = all_dbs[0]["database_id"]

        print(f"\n[Test Setup] Using database ID: {cls.iris_db_id}")
        assert cls.iris_db_id is not None, "Iris database not found."

    def test_query_a_last_20_rows_multiple_filters(self):
        """A. 'Show last 20 rows where sepalwidthcm is greater than 2 but petalwidthcm is less than 2.'"""
        q = "Show last 20 rows where sepalwidthcm is greater than 2 but petalwidthcm is less than 2."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)
        
        self.assertTrue(res["is_valid"], f"Query failed validation: {res.get('validation_error')}")
        sql = res["generated_sql"].upper()
        
        # Verify conditions
        self.assertIn("SEPALWIDTHCM", sql)
        self.assertIn(">", sql)
        self.assertIn("PETALWIDTHCM", sql)
        self.assertIn("<", sql)
        self.assertIn("AND", sql)
        self.assertIn("ORDER BY", sql)
        self.assertIn("DESC", sql)
        self.assertIn("LIMIT 20", sql)

        # Execute
        exec_res = QueryService.execute_sql_query(res["generated_sql"], database_id=self.iris_db_id)
        self.assertEqual(exec_res["status"], "SUCCESS")
        self.assertGreater(exec_res["row_count"], 0)
        self.assertLessEqual(exec_res["row_count"], 20)

    def test_query_b_single_filter_greater_than(self):
        """B. 'Show records where sepalwidthcm is greater than 3.'"""
        q = "Show records where sepalwidthcm is greater than 3."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)

        self.assertTrue(res["is_valid"])
        sql = res["generated_sql"].upper()
        self.assertIn("SEPALWIDTHCM", sql)
        self.assertIn(">", sql)
        self.assertIn("3", sql)

        # Execute
        exec_res = QueryService.execute_sql_query(res["generated_sql"], database_id=self.iris_db_id)
        self.assertEqual(exec_res["status"], "SUCCESS")
        self.assertGreater(exec_res["row_count"], 0)

    def test_query_c_or_relationship(self):
        """C. 'Show records where petalwidthcm is less than 2 OR sepallengthcm is greater than 5.'"""
        q = "Show records where petalwidthcm is less than 2 OR sepallengthcm is greater than 5."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)

        self.assertTrue(res["is_valid"])
        sql = res["generated_sql"].upper()
        self.assertIn("PETALWIDTHCM", sql)
        self.assertIn("<", sql)
        self.assertIn("SEPALLENGTHCM", sql)
        self.assertIn(">", sql)
        self.assertIn("OR", sql)

        # Execute
        exec_res = QueryService.execute_sql_query(res["generated_sql"], database_id=self.iris_db_id)
        self.assertEqual(exec_res["status"], "SUCCESS")
        self.assertGreater(exec_res["row_count"], 0)

    def test_query_d_between_and_limit(self):
        """D. 'Show the top 10 records where sepalwidthcm is between 2 and 4.'"""
        q = "Show the top 10 records where sepalwidthcm is between 2 and 4."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)

        self.assertTrue(res["is_valid"])
        sql = res["generated_sql"].upper()
        self.assertIn("SEPALWIDTHCM", sql)
        self.assertIn("BETWEEN", sql)
        self.assertIn("2", sql)
        self.assertIn("4", sql)
        self.assertIn("LIMIT 10", sql)

        # Execute
        exec_res = QueryService.execute_sql_query(res["generated_sql"], database_id=self.iris_db_id)
        self.assertEqual(exec_res["status"], "SUCCESS")
        self.assertGreater(exec_res["row_count"], 0)
        self.assertLessEqual(exec_res["row_count"], 10)

    def test_query_e_count_aggregation(self):
        """E. 'Count all records where petalwidthcm is greater than 1.'"""
        q = "Count all records where petalwidthcm is greater than 1."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)

        self.assertTrue(res["is_valid"])
        sql = res["generated_sql"].upper()
        self.assertIn("COUNT", sql)
        self.assertIn("PETALWIDTHCM", sql)
        self.assertIn(">", sql)
        self.assertIn("1", sql)

        # Execute
        exec_res = QueryService.execute_sql_query(res["generated_sql"], database_id=self.iris_db_id)
        self.assertEqual(exec_res["status"], "SUCCESS")
        self.assertEqual(exec_res["row_count"], 1)
        self.assertIn("total_count", exec_res["rows"][0])

    def test_query_f_unknown_column_validation_error(self):
        """F. 'Show records where unknowncolumn is greater than 5.' -> Validation error"""
        q = "Show records where unknowncolumn is greater than 5."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)

        # Must return is_valid=False with clear error
        self.assertFalse(res["is_valid"])
        self.assertIsNotNone(res["validation_error"])
        self.assertIn("unknowncolumn", res["validation_error"].lower())

    def test_query_g_multiple_conditions_with_and(self):
        """G. 'Show records where sepalwidthcm is greater than 2 and petalwidthcm is less than 2.'"""
        q = "Show records where sepalwidthcm is greater than 2 and petalwidthcm is less than 2."
        res = QueryService.generate_sql_from_nl(q, database_id=self.iris_db_id)

        self.assertTrue(res["is_valid"])
        sql = res["generated_sql"].upper()
        self.assertIn("SEPALWIDTHCM", sql)
        self.assertIn(">", sql)
        self.assertIn("PETALWIDTHCM", sql)
        self.assertIn("<", sql)
        self.assertIn("AND", sql)

        # Execute
        exec_res = QueryService.execute_sql_query(res["generated_sql"], database_id=self.iris_db_id)
        self.assertEqual(exec_res["status"], "SUCCESS")
        self.assertGreater(exec_res["row_count"], 0)

if __name__ == "__main__":
    unittest.main()
