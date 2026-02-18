import json
import os

def load_dataset(filename):
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, "r") as f:
        return json.load(f)

def run_function_over_dataset(func, dataset, input_key="input_text"):
    results = []
    for example in dataset:
        try:
            output = func(example[input_key])
            results.append({
                "input": example,
                "output": output,
                "error": None
            })
        except Exception as e:
            results.append({
                "input": example,
                "output": None,
                "error": str(e)
            })
    return results
