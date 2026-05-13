"""
Create Admin Account Script
==========================
Use this script to create an admin account for login.
"""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import users_collection
from utils.password_handler import hash_password
import uuid
from datetime import datetime

def create_admin_account(email, password, name="Admin"):
    """Create a new admin account"""
    
    # Check if admin already exists
    existing = users_collection.find_one({"email": email})
    if existing:
        print(f"❌ Admin with email '{email}' already exists")
        return False
    
    # Create admin document
    admin = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email.lower(),
        "password": hash_password(password),
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    try:
        result = users_collection.insert_one(admin)
        print(f"✅ Admin account created successfully!")
        print(f"   Email: {email}")
        print(f"   User ID: {admin['user_id']}")
        print(f"   Role: admin")
        return True
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        return False

def list_all_users():
    """List all users in database"""
    users = list(users_collection.find({}, {"password": 0, "_id": 0}))
    if not users:
        print("No users found in database")
        return
    
    print(f"\n📋 All Users ({len(users)} total):")
    print("-" * 70)
    for user in users:
        print(f"  Email: {user.get('email')}")
        print(f"  Role: {user.get('role')}")
        print(f"  Department: {user.get('department', 'N/A')}")
        print(f"  Created: {user.get('created_at')}")
        print()

if __name__ == "__main__":
    print("=" * 70)
    print("ADMIN ACCOUNT SETUP")
    print("=" * 70)
    
    # Show existing users
    list_all_users()
    
    # Create new admin
    print("\n" + "=" * 70)
    print("Creating new admin account...")
    print("=" * 70)
    
    email = "admin@example.com"
    password = "Admin123"
    name = "System Admin"
    
    print(f"\nCreating admin with:")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print(f"  Name: {name}")
    
    create_admin_account(email, password, name)
    
    print("\n✅ Setup complete!")
    print("\nYou can now log in with:")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print("\nUse 'Admin Login' tab in the login page")

