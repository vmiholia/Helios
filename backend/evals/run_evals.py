import sys
import os
import json
from dotenv import load_dotenv

# Add parent dir to path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from backend.llm import parse_food_text, client
from backend.evals.eval_utils import load_dataset, run_function_over_dataset

def simple_assertion_eval(results):
    print("\nRunning Simple Assertions...")
    passed = 0
    total = len(results)
    failed_examples = []
    
    for r in results:
        output = r["output"]
        if output and "items" in output and isinstance(output["items"], list) and len(output["items"]) > 0:
            passed += 1
        else:
            print(f"FAILED Assertion: Input: {r['input']['input_text']} -> Output: {output}")
            failed_examples.append({
                "input": r['input']['input_text'],
                "output": output,
                "reason": "Invalid or empty items"
            })
            
    print(f"Assertion Pass Rate: {passed}/{total} ({passed/total:.1%})")
    return {
        "pass_rate": passed / total if total > 0 else 0,
        "passed": passed,
        "total": total,
        "failed_examples": failed_examples
    }

def macro_estimation_eval():
    print("\nRunning Macro Estimation Evals...")
    from backend.llm import estimate_metric_macros
    
    test_cases = [
        {"food": "Chicken Breast", "min_protein": 20, "max_cals": 200},
        {"food": "White Rice", "min_carbs": 20, "max_protein": 10},
        {"food": "Egg", "min_protein": 10, "max_cals": 160},
        {"food": "Butter", "min_fat": 50, "max_carbs": 5}
    ]
    
    passed = 0
    total = len(test_cases)
    failed_examples = []
    
    for case in test_cases:
        food = case["food"]
        output = estimate_metric_macros(food)
        
        # Checks
        reasons = []
        if "min_protein" in case and output["protein_per_100"] < case["min_protein"]:
            reasons.append(f"Protein {output['protein_per_100']} < {case['min_protein']}")
        if "max_cals" in case and output["calories_per_100"] > case["max_cals"]:
            reasons.append(f"Calories {output['calories_per_100']} > {case['max_cals']}")
        if "min_carbs" in case and output["carbs_per_100"] < case["min_carbs"]:
            reasons.append(f"Carbs {output['carbs_per_100']} < {case['min_carbs']}")
        if "min_fat" in case and output["fats_per_100"] < case["min_fat"]:
            reasons.append(f"Fat {output['fats_per_100']} < {case['min_fat']}")
            
        if not reasons:
            passed += 1
        else:
            print(f"FAILED Macro: {food} -> {reasons}")
            failed_examples.append({
                "input": food,
                "output": output,
                "reason": "; ".join(reasons)
            })
            
    print(f"Macro Pass Rate: {passed}/{total} ({passed/total:.1%})")
    return {
        "pass_rate": passed / total if total > 0 else 0,
        "passed": passed,
        "total": total,
        "failed_examples": failed_examples
    }


def llm_judge_eval(results):
    print("\nRunning LLM-as-a-Judge...")
    passed = 0
    total = len(results)
    failed_examples = []
    
    for r in results:
        input_text = r['input']['input_text']
        expected_items = r['input'].get('expected_items', [])
        expected_time = r['input'].get('expected_time')
        
        actual_items = [i['name'] for i in r['output'].get('items', [])] if r['output'] else []
        actual_time = r['output'].get('time') if r['output'] else None
        
        judge_prompt = f"""You are an impartial judge evaluating a food log parser.
        
Input Text: "{input_text}"

Reference (Expected):
- Items: {expected_items}
- Time: {expected_time}

Actual Output:
- Items: {actual_items}
- Time: {actual_time}

Tasks:
1. Did the parser correctly identify all the MAIN food items? (Ignore case, singular/plural diffs, and minor details like 'plate of')
   - Example: 'Chicken' == 'chicken', '2 eggs' matches 'eggs'
2. Did the parser correctly extract the time in HH:MM format (if expected)?
   - If reference time is NULL but input text HAS a clear time (e.g. "at 9pm"), and the parser extracted it, COUNT IT AS CORRECT (the reference might be incomplete).
   - If reference has a time, the parser MUST match it (allow 24h format differences if equivalent).

If the parser did a GOOD JOB overall, answer YES.
Only answer NO if there is a partial or total failure to extract key info.

Answer ONLY with 'YES' or 'NO' (with optional short explanation)."""

        try:
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=50,
                messages=[{"role": "user", "content": judge_prompt}]
            )
            response_text = message.content[0].text.strip()
            verdict = response_text.split()[0].upper().replace(".", "")
            
            if "YES" in verdict:
                passed += 1
            else:
                print(f"JUDGE FAILED: Input: {input_text}")
                print(f"  Exp: Items={expected_items}, Time={expected_time}")
                print(f"  Act: Items={actual_items}, Time={actual_time}")
                print(f"  Judge: {response_text}")
                
                failed_examples.append({
                    "input": input_text,
                    "expected": {"items": expected_items, "time": expected_time},
                    "actual": {"items": actual_items, "time": actual_time},
                    "judge_reason": response_text
                })
                
        except Exception as e:
            print(f"Judge Error: {e}")
            
    if total > 0:
        print(f"LLM Judge Pass Rate: {passed}/{total} ({passed/total:.1%})")
        
    return {
        "pass_rate": passed / total if total > 0 else 0,
        "passed": passed,
        "total": total,
        "failed_examples": failed_examples
    }

def run_all_evals():
    data = load_dataset("dataset_food_parsing.json")
    results = run_function_over_dataset(parse_food_text, data)
    
    assertion_res = simple_assertion_eval(results)
    judge_res = llm_judge_eval(results)
    macro_res = macro_estimation_eval()
    
    return {
        "assertions": assertion_res,
        "judge": judge_res,
        "macros": macro_res
    }

if __name__ == "__main__":
    run_all_evals()
