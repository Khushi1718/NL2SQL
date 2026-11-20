from typing import Dict, Any, List
from prompt_engineering.templates import (
    ROLE_PROMPT,
    QUERY_CONSTRAINTS,
    IMPORTANT_SQL_GENERATION_RULES,
    STRUCTURED_OUTPUT_INSTRUCTIONS
)
from prompt_engineering.few_shot import (
    FEW_SHOT_EXAMPLES,
    format_few_shot_for_prompt
)
from schema_inspector import format_schema_for_prompt, get_database_schema

class PromptBuilder:
    """
    Constructs comprehensive prompt payloads using established prompt engineering
    techniques: Role Prompting, Context Injection, Few-Shot Demonstrations,
    Structured Output specifications, and strict Query Constraints.
    """

    def __init__(self, schema_info: Dict[str, Any] = None):
        if schema_info is None:
            self.schema_info = get_database_schema()
        else:
            self.schema_info = schema_info

    def get_role_prompt(self) -> str:
        return ROLE_PROMPT

    def get_schema_context(self) -> str:
        return format_schema_for_prompt(self.schema_info)

    def get_few_shot_examples(self) -> List[Dict[str, Any]]:
        return FEW_SHOT_EXAMPLES

    def get_query_constraints(self) -> List[str]:
        return QUERY_CONSTRAINTS

    def get_important_rules(self) -> List[str]:
        return IMPORTANT_SQL_GENERATION_RULES

    def get_structured_output_instructions(self) -> str:
        return STRUCTURED_OUTPUT_INSTRUCTIONS

    def build_full_prompt(self, user_question: str) -> str:
        """
        Synthesizes all prompt engineering modules into a single complete prompt.
        """
        schema_context = self.get_schema_context()
        few_shots = format_few_shot_for_prompt()
        rules_str = "\n".join([f"{i+1}. {r}" for i, r in enumerate(IMPORTANT_SQL_GENERATION_RULES)])
        constraints_str = "\n".join([f"{i+1}. {c}" for i, c in enumerate(QUERY_CONSTRAINTS)])

        prompt = f"""{ROLE_PROMPT}

{schema_context}

### IMPORTANT SQL GENERATION RULES:
{rules_str}

### STRICT CONSTRAINTS & RULES:
{constraints_str}

{few_shots}

### USER INQUIRY:
User Question: "{user_question.strip()}"

{STRUCTURED_OUTPUT_INSTRUCTIONS}
"""
        return prompt.strip()

    def get_inspectable_breakdown(self, user_question: str) -> Dict[str, Any]:
        """
        Returns full breakdown of prompt components for academic inspection and UI display.
        """
        return {
            "role_prompt": self.get_role_prompt(),
            "schema_context": self.get_schema_context(),
            "schema_metadata": {
                "table_count": self.schema_info.get("table_count", 0),
                "total_columns": self.schema_info.get("total_columns", 0),
                "tables": list(self.schema_info.get("tables", {}).keys()),
            },
            "few_shot_examples": self.get_few_shot_examples(),
            "important_rules": self.get_important_rules(),
            "query_constraints": self.get_query_constraints(),
            "structured_output_schema": self.get_structured_output_instructions(),
            "user_question": user_question,
            "final_constructed_prompt": self.build_full_prompt(user_question)
        }
