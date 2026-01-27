"""
Run all environment tests in sequence.
"""

import os
import subprocess
import time

def main():
    """Run all tests and collect results."""
    # Create directories if they don't exist
    os.makedirs('logs', exist_ok=True)
    os.makedirs('results', exist_ok=True)
    
    # Define tests to run
    tests = [
        'env_test_random.py',
        'env_test_equal_weight.py'
    ]
    
    # Run each test
    for test in tests:
        print(f"\n{'='*50}")
        print(f"Running test: {test}")
        print(f"{'='*50}\n")
        
        # Run the test script
        start_time = time.time()
        result = subprocess.run(['python', f'tests/{test}'], capture_output=True, text=True)
        end_time = time.time()
        
        # Print output
        print(result.stdout)
        if result.stderr:
            print("ERRORS:")
            print(result.stderr)
        
        print(f"\nCompleted in {end_time - start_time:.2f} seconds")
    
    # Summarize results
    print("\n\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    # Check random action test results
    try:
        with open('results/environment_test_summary.txt', 'r') as f:
            random_test_result = f.read()
            if "PASSED" in random_test_result:
                print("✅ Random Action Test: PASSED")
            else:
                print("❌ Random Action Test: FAILED")
    except FileNotFoundError:
        print("❓ Random Action Test: No results found")
    
    # Check equal-weight test results
    try:
        with open('results/validation_result.txt', 'r') as f:
            equal_weight_result = f.read()
            if "CONSISTENT" in equal_weight_result:
                print("✅ Equal-Weight Test: PASSED")
            else:
                print("❌ Equal-Weight Test: FAILED")
    except FileNotFoundError:
        print("❓ Equal-Weight Test: No results found")
    
    print("\nSee log files and result plots for details.")

if __name__ == "__main__":
    main()