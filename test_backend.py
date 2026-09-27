import urllib.request
import json
import os

print("--- Testing /health ---")
try:
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")

print("\n--- Testing /api/qumi ---")
url = "http://127.0.0.1:8000/api/qumi"
data = json.dumps({"messages": [{"role":"user", "content":"What is a qubit?"}]}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
