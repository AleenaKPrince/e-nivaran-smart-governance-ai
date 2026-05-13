import requests, sys
BASE = "http://localhost:5000"
EMAIL = "staff1@health.com"
PASSWORD = "Smart@123"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin123"

def die(msg):
    print('ERROR:', msg); sys.exit(1)

print('Logging in as', EMAIL)
r = requests.post(BASE + '/api/login', json={'email': EMAIL, 'password': PASSWORD})
if r.status_code != 200:
    die(f'Login failed: {r.status_code} {r.text}')
token = r.json().get('token')
print('Got token')
headers = {'Authorization': f'Bearer {token}'}
staff_user_id = r.json().get('user_id')
print('Staff user id:', staff_user_id)

print('\nFetching assigned complaints')
r = requests.get(BASE + '/api/staff/complaints', headers=headers)
if r.status_code != 200:
    die(f'List failed: {r.status_code} {r.text}')
data = r.json()
if isinstance(data, list):
    complaints = data
else:
    complaints = data.get('complaints', [])
if not complaints:
    die('No complaints assigned')
# Prefer a complaint explicitly assigned to this staff user
complaint = None
for c in complaints:
    if c.get('assigned_to') == staff_user_id:
        complaint = c
        break

if not complaint:
    # fallback: pick first complaint and warn
    complaint = complaints[0]
    print('Warning: no complaint explicitly assigned to this staff user; picked first available')

cid = complaint['complaint_id']
print('Using complaint', cid, 'status', complaint.get('status'), 'assigned_to', complaint.get('assigned_to'))

print('\nFetching reports BEFORE update')
# Login as admin to fetch reports (admin endpoints require admin token)
ar = requests.post(BASE + '/api/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
if ar.status_code != 200:
    die(f'Admin login failed: {ar.status_code} {ar.text}')
admin_token = ar.json().get('token')
admin_headers = {'Authorization': f'Bearer {admin_token}'}

summary_before = requests.get(BASE + '/api/reports/summary', headers=admin_headers).json()
status_before = requests.get(BASE + '/api/reports/status-breakdown', headers=admin_headers).json()
print('Summary before:', summary_before)
print('Status breakdown before:', status_before)

# determine next status
order = ['Submitted', 'In Progress', 'Resolved']
cur = complaint.get('status')
if cur not in order:
    die('Unknown current status: ' + str(cur))
idx = order.index(cur)
if idx >= len(order)-1:
    print('Already at final status; nothing to update. Exiting.')
    sys.exit(0)
next_status = order[idx+1]
print('\nUpdating complaint', cid, '->', next_status)
r = requests.put(BASE + '/api/complaint/update', json={'complaint_id': cid, 'status': next_status}, headers=headers)
if r.status_code != 200:
    die(f'Update failed: {r.status_code} {r.text}')
print('Update response:', r.json())

print('\nFetching reports AFTER update')
summary_after = requests.get(BASE + '/api/reports/summary', headers=admin_headers).json()
status_after = requests.get(BASE + '/api/reports/status-breakdown', headers=admin_headers).json()
print('Summary after:', summary_after)
print('Status breakdown after:', status_after)

print('\nDiffs:')
for k in status_after:
    before = status_before.get(k)
    after = status_after.get(k)
    if before != after:
        print(f'  {k}: {before} -> {after}')

print('\nDone')
