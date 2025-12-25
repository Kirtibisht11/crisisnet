"""
Test script for Communication Agent
Run this to test your code independently
"""

import requests
import json

BASE_URL = "http://localhost:8000"  # Change if your server runs on different port

def test_send_sms():
    """Test direct SMS sending"""
    print("\n📱 Testing SMS...")
    
    response = requests.post(
        f"{BASE_URL}/api/communication/send-sms",
        json={
            "phone": "+919876543210",  # 👈 REPLACE WITH YOUR NUMBER
            "message": "Test SMS from CrisisNet! If you receive this, SMS integration works! 🎉"
        }
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_send_whatsapp():
    """Test direct WhatsApp sending"""
    print("\n💬 Testing WhatsApp...")
    
    response = requests.post(
        f"{BASE_URL}/api/communication/send-whatsapp",
        json={
            "phone": "+919876543210",  # 👈 REPLACE WITH YOUR NUMBER
            "message": "Test WhatsApp from CrisisNet! If you receive this, WhatsApp integration works! 🎉"
        }
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_mock_crisis_alert():
    """Test full crisis alert flow with mock data"""
    print("\n🚨 Testing Full Crisis Alert...")
    
    mock_crisis = {
        "crisis_id": "TEST_001",
        "crisis_type": "flood",
        "severity": "High",
        "location": "MG Road, Delhi",
        "confidence": 0.92,
        "verified": True,
        "affected_citizens": [
            {
                "id": "citizen_1",
                "phone": "+917500900626",  # 👈 YOUR NUMBER
                "name": "Test Citizen"
            }
        ],
        "assigned_volunteers": [
            {
                "id": "volunteer_1",
                "phone": "+919814341087",  # 👈 YOUR NUMBER
                "name": "Test Volunteer",
                "task_description": "Distribute relief supplies"
            }
        ],
        "authorities": [
            {
                "id": "authority_1",
                "phone": "+917500900626",  # 👈 YOUR NUMBER
                "name": "Test Authority"
            }
        ],
        "nearest_shelter": "Community Center, Sector 5"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/communication/send-alert",
        json=mock_crisis
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_agent_status():
    """Test agent status endpoint"""
    print("\n📊 Testing Agent Status...")
    
    response = requests.get(f"{BASE_URL}/api/communication/status")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_logs():
    """Test communication logs"""
    print("\n📜 Testing Communication Logs...")
    
    response = requests.get(f"{BASE_URL}/api/communication/logs")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    print("=" * 50)
    print("CRISISNET - COMMUNICATION AGENT TEST")
    print("=" * 50)
    
    # Choose what to test
    print("\nSelect test:")
    print("1. Send SMS")
    print("2. Send WhatsApp")
    print("3. Full Crisis Alert (all 3 roles)")
    print("4. Agent Status")
    print("5. View Logs")
    print("6. Run All Tests")
    
    choice = input("\nEnter choice (1-6): ")
    
    if choice == "1":
        test_send_sms()
    elif choice == "2":
        test_send_whatsapp()
    elif choice == "3":
        test_mock_crisis_alert()
    elif choice == "4":
        test_agent_status()
    elif choice == "5":
        test_logs()
    elif choice == "6":
        print("\n🚀 Running all tests...\n")
        test_send_sms()
        test_send_whatsapp()
        test_mock_crisis_alert()
        test_agent_status()
        test_logs()
    else:
        print("Invalid choice!")
    
    print("\n" + "=" * 50)
    print("Tests completed!")
    print("=" * 50)