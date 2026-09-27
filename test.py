import urllib.request
import json

health_url = "http://localhost:8000/health"
print("Checking health endpoint:")
try:
    with urllib.request.urlopen(health_url) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except Exception as e:
    print(f"Health Error: {e}")

url = "http://localhost:8000/api/qumi"
data = json.dumps({"messages": [{"role":"user", "content":"Explain superposition like I'm a beginner."}]}).encode('utf-8')
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
