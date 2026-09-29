"""
Synthetic Dataset Schema Validator & JSON Schema Exporter
Validates clinical benchmark test cases against rigorous Pydantic schemas.
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Any

from schemas import BenchmarkDatasetSchema, TestCaseSchema

def validate_file(file_path: str, export_schema: bool = False) -> bool:
    print("=" * 70)
    print(f"CLINICAL DATASET VALIDATION: {file_path}")
    print("=" * 70)

    if not os.path.exists(file_path):
        print(f"[FAIL] Error: Dataset file '{file_path}' does not exist.")
        return False

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
    except Exception as e:
        print(f"[FAIL] Error parsing JSON file: {e}")
        return False

    if isinstance(raw_data, list):
        payload = {"cases": raw_data}
    elif isinstance(raw_data, dict) and "cases" in raw_data:
        payload = raw_data
    else:
        print("[FAIL] Error: Unexpected data structure. Expected list of cases or object with 'cases' key.")
        return False

    try:
        dataset = BenchmarkDatasetSchema(**payload)
        case_count = len(dataset.cases)
        total_events = sum(len(c.timeline_events) for c in dataset.cases)
        total_specimens = sum(len(c.specimens) for c in dataset.cases)
        
        print(f"[PASS] Successfully validated {case_count} patient cases:")
        for c in dataset.cases:
            print(f"  * Case {c.case_id} ({c.patient_de_id}) | Dx: {c.primary_dx[:38]}... | "
                  f"Urgency: {c.urgency.value.upper():<8} | Events: {len(c.timeline_events):<2} | "
                  f"Specimens: {len(c.specimens):<2} | Baseline: {c.baseline_minutes}m -> Target: {c.target_minutes}m")

        print("-" * 70)
        print(f"Dataset Summary: {case_count} cases, {total_events} timeline events, {total_specimens} specimens.")
        print("[STATUS] 100% SCHEMA COMPLIANCE - ZERO INTEGRITY ERRORS DETECTED.")
        print("=" * 70)

        if export_schema:
            schema_path = os.path.join(os.path.dirname(file_path), "test_cases.schema.json")
            schema_json = BenchmarkDatasetSchema.model_json_schema()
            with open(schema_path, "w", encoding="utf-8") as sf:
                json.dump(schema_json, sf, indent=2)
            print(f"[EXPORT] Standard JSON Schema exported to: {schema_path}")

        return True

    except Exception as e:
        print(f"[FAIL] Schema validation error:\n{e}")
        print("=" * 70)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate clinical benchmark test case dataset.")
    parser.add_argument("--file", default=os.path.join(os.path.dirname(__file__), "test_cases.json"), help="Path to test_cases.json")
    parser.add_argument("--export-schema", action="store_true", help="Export standard JSON Schema file")
    args = parser.parse_args()

    success = validate_file(args.file, export_schema=args.export_schema)
    sys.exit(0 if success else 1)
