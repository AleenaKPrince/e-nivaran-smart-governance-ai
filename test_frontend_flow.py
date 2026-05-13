import requests
import sys

BASE = "http://localhost:5000"
EMAIL = "staff1@health.com"
PASSWORD = "Smart@123"

def die(msg):
    print("ERROR:", msg)
    sys.exit(1)

def login():
    url = BASE + "/api/login"
    print("Logging in as", EMAIL)
    r = requests.post(url, json={"email": EMAIL, "password": PASSWORD}, timeout=10)
    if r.status_code != 200:
        die(f"Login failed: {r.status_code} {r.text}")
    token = r.json().get("token")
    if not token:
        die("No token returned")
    print("Got token")
    return token


def list_complaints(token):
    url = BASE + "/api/staff/complaints"
    print("Fetching assigned complaints list")
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if r.status_code != 200:
        die(f"List complaints failed: {r.status_code} {r.text}")
    data = r.json()
    complaints = data.get("complaints", [])
    print(f"Found {len(complaints)} complaints")
    return complaints


def get_details(token, complaint_id):
    url = BASE + f"/api/staff/complaints/{complaint_id}"
    print("Fetching details for", complaint_id)
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if r.status_code != 200:
        die(f"Get details failed: {r.status_code} {r.text}")
    return r.json()


def update_status(token, complaint_id, new_status):
    url = BASE + "/api/complaint/update"
    print(f"Updating {complaint_id} -> {new_status}")
    r = requests.put(url, json={"complaint_id": complaint_id, "status": new_status}, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if r.status_code != 200:
        die(f"Update failed: {r.status_code} {r.text}")
    print("Update success")
    return r.json()


def choose_next_status(current):
    order = ["Submitted", "In Progress", "Resolved"]
    try:
        idx = order.index(current)
    except ValueError:
        return None
    if idx < len(order)-1:
        return order[idx+1]
    return None


def main():
    try:
        token = login()
    except Exception as e:
        die(f"Login request error: {e}")

    complaints = list_complaints(token)
    if not complaints:
        die("No complaints assigned to this user to test")

    c = complaints[0]
    cid = c.get("complaint_id")
    print("Using complaint:", cid)

    details = get_details(token, cid)
    print("Details status:", details.get("status"))
    history = details.get("history", [])
    print(f"History entries: {len(history)}")

    next_status = choose_next_status(details.get("status"))
    if not next_status:
        print("No further status transition possible (already Resolved or unknown). Test complete.")
        return

    update_status(token, cid, next_status)

    # fetch details again
    details2 = get_details(token, cid)
    print("New status:", details2.get("status"))
    history2 = details2.get("history", [])
    print(f"New history entries: {len(history2)}")
    if len(history2) <= len(history):
        die("History did not grow after update")

    print("Flow verified: open → view history → update status → history updated")

if __name__ == '__main__':
    main()
