import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

print("🧪 Quick Trust Agent Test\n")

from agents.trust_agent import TrustAgent

# Initialize with JSON data
mock_path = os.path.join(os.path.dirname(__file__), 'agents', 'trust', 'mock_alerts.json')
trust_agent = TrustAgent(use_json=True, json_data_path=mock_path)

# Test 1: Simple alert
print("=" * 60)
print("TEST 1: First Report (should get REVIEW)")
print("=" * 60)

alert1 = {
    'user_id': 'test_user_123',
    'crisis_type': 'flood',
    'location': 'Test Location',
    'lat': 19.0760,
    'lon': 72.8777,
    'message': 'Urgent flooding reported!',
    'has_image': True
}

result1 = trust_agent.verify_alert(alert1)
print(f"\n✅ Result: {result1['decision']} | Score: {result1['trust_score']:.3f}")

# Test 2: Confirming report from different user
print("\n" + "=" * 60)
print("TEST 2: Second Report (should increase confidence)")
print("=" * 60)

alert2 = {
    'user_id': 'another_user_456',
    'crisis_type': 'flood',
    'location': 'Test Location',
    'lat': 19.0765,
    'lon': 72.8780,
    'message': 'Can confirm flooding in this area',
    'has_image': True
}

result2 = trust_agent.verify_alert(alert2)
print(f"\n✅ Result: {result2['decision']} | Score: {result2['trust_score']:.3f}")
print(f"   Sources: {result2['cross_verification']['sources']}")

# Test 3: Duplicate from same user
print("\n" + "=" * 60)
print("TEST 3: Duplicate Report (should be REJECTED)")
print("=" * 60)

alert3 = {
    'user_id': 'test_user_123',
    'crisis_type': 'flood',
    'location': 'Test Location',
    'message': 'Still flooding here!',
    'has_image': False
}

result3 = trust_agent.verify_alert(alert3)
print(f"\n✅ Result: {result3['decision']} | Score: {result3['trust_score']:.3f}")
if 'reason' in result3:
    print(f"   Reason: {result3['reason']}")

# System Status
print("\n" + "=" * 60)
print("SYSTEM STATUS")
print("=" * 60)

status = trust_agent.get_system_status()
stats = status.get('statistics', {})

print(f"✅ Trust Agent: {status['trust_agent']}")
print(f"📊 Total Alerts: {stats.get('total_alerts', 0)}")
print(f"👥 Total Users: {stats.get('total_users', 0)}")

print("\n✅ Quick test completed!")
print("=" * 60)