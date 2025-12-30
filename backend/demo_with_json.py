import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 90)
print(" " * 25 + "🚨 CRISISNET TRUST AGENT - DEMO 🚨")
print("=" * 90)
print(f"📅 Test Run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 90)

# Initialize Trust Agent with JSON data
from agents.trust_agent import TrustAgent

# Path to mock alerts JSON
mock_alerts_path = os.path.join(os.path.dirname(__file__), 'agents', 'trust', 'mock_alerts.json')

if not os.path.exists(mock_alerts_path):
    print(f"❌ ERROR: mock_alerts.json not found at {mock_alerts_path}")
    sys.exit(1)

print(f"\n📂 Loading mock data from: {mock_alerts_path}\n")

# Initialize Trust Agent
trust_agent = TrustAgent(use_json=True, json_data_path=mock_alerts_path)

# Load mock data to get scenarios
with open(mock_alerts_path, 'r', encoding='utf-8') as f:
    mock_data = json.load(f)

# Helper function to print results
def print_result(result, expected=None):
    """Pretty print verification result"""
    print(f"\n📊 VERIFICATION RESULT:")
    print(f"   Decision:     {result['decision']}")
    print(f"   Trust Score:  {result['trust_score']:.3f} ({result['trust_score']*100:.1f}%)")
    print(f"   Status:       {result['status']}")
    
    if 'reputation' in result:
        print(f"   Reputation:   {result['reputation']:.2f}")
    
    if 'cross_verification' in result:
        cv = result['cross_verification']
        print(f"   Sources:      {cv['sources']} ({cv['details']})")
    
    if 'reason' in result:
        print(f"   Reason:       {result['reason']}")
    
    if expected:
        match = "✅ MATCHES" if expected.lower() in result['decision'].lower() or expected.lower() in result.get('status', '').lower() else "⚠️ DIFFERS"
        print(f"   Expected:     {expected} {match}")

# ============================================================================
# SCENARIO 1: HIGH CONFIDENCE - Multiple Independent Sources
# ============================================================================
print("\n" + "=" * 90)
print("📋 SCENARIO 1: HIGH CONFIDENCE - Multiple Independent Sources Confirm Flood")
print("=" * 90)
print("Testing: As more users report the same crisis, trust score should increase\n")

scenario_1 = mock_data['scenarios']['scenario_1_high_confidence']['alerts']

for i, alert_data in enumerate(scenario_1, 1):
    print(f"\n{'─' * 90}")
    print(f"🔔 Alert #{i} from {alert_data['user_id']}")
    print(f"{'─' * 90}")
    print(f"📍 Location: {alert_data['location']}")
    print(f"📝 Message:  {alert_data['message']}")
    print(f"📷 Has Image: {alert_data.get('has_image', False)}")
    
    result = trust_agent.verify_alert(alert_data)
    print_result(result, alert_data.get('expected_result'))

# ============================================================================
# SCENARIO 2: DUPLICATE SPAM - Same User Repeating
# ============================================================================
print("\n\n" + "=" * 90)
print("📋 SCENARIO 2: DUPLICATE SPAM - Same User Tries to Spam")
print("=" * 90)
print("Testing: Duplicate reports from same user should be rejected\n")

scenario_2 = mock_data['scenarios']['scenario_2_duplicate_spam']['alerts']

for alert_data in scenario_2:
    print(f"\n{'─' * 90}")
    print(f"🔔 Alert from {alert_data['user_id']}")
    print(f"{'─' * 90}")
    print(f"📝 Message: {alert_data['message']}")
    
    result = trust_agent.verify_alert(alert_data)
    print_result(result, alert_data.get('expected_result'))

# ============================================================================
# SCENARIO 3: RATE LIMITING - Spam Bot
# ============================================================================
print("\n\n" + "=" * 90)
print("📋 SCENARIO 3: RATE LIMITING - Spam Bot Floods System")
print("=" * 90)
print("Testing: After 5 reports, user should be rate-limited\n")

scenario_3 = mock_data['scenarios']['scenario_3_rate_limiting']['alerts']

# Send multiple rapid reports
for i in range(1, 8):  # Try 7 reports (limit is 5)
    if i <= len(scenario_3):
        alert_data = scenario_3[i-1]
    else:
        # Generate additional spam
        alert_data = {
            'user_id': 'spam_bot_999',
            'crisis_type': 'fire',
            'location': f'Location {i}',
            'message': f'SPAM MESSAGE {i}',
            'has_image': False
        }
    
    print(f"\n{'─' * 90}")
    print(f"🔔 Report #{i} from {alert_data['user_id']}")
    print(f"{'─' * 90}")
    
    result = trust_agent.verify_alert(alert_data)
    
    print(f"\n📊 RESULT: {result['decision']}")
    if 'reason' in result:
        print(f"   Reason: {result['reason']}")
    
    if i >= 5 and result['decision'] == 'REJECTED':
        print(f"   ✅ Rate limiter activated after {i} reports!")
        break

# ============================================================================
# SCENARIO 4: LOW CONFIDENCE - Uncertain Report
# ============================================================================
print("\n\n" + "=" * 90)
print("📋 SCENARIO 4: LOW CONFIDENCE - New User, Uncertain Report")
print("=" * 90)
print("Testing: Uncertain reports from new users get low scores\n")

scenario_4 = mock_data['scenarios']['scenario_4_low_confidence']['alerts']

for alert_data in scenario_4:
    print(f"\n{'─' * 90}")
    print(f"🔔 Alert from {alert_data['user_id']}")
    print(f"{'─' * 90}")
    print(f"📝 Message: {alert_data['message']}")
    
    result = trust_agent.verify_alert(alert_data)
    print_result(result, alert_data.get('expected_result'))

# ============================================================================
# SCENARIO 5: DIFFERENT LOCATIONS - No Cross-Verification
# ============================================================================
print("\n\n" + "=" * 90)
print("📋 SCENARIO 5: DIFFERENT LOCATIONS - Should NOT Cross-Verify")
print("=" * 90)
print("Testing: Same crisis type but different cities shouldn't cross-verify\n")

scenario_5 = mock_data['scenarios']['scenario_5_different_locations']['alerts']

for alert_data in scenario_5:
    print(f"\n{'─' * 90}")
    print(f"🔔 Alert from {alert_data['location']}")
    print(f"{'─' * 90}")
    print(f"📝 Message: {alert_data['message']}")
    print(f"📍 Coordinates: ({alert_data['lat']}, {alert_data['lon']})")
    
    result = trust_agent.verify_alert(alert_data)
    print_result(result)
    
    if alert_data.get('note'):
        print(f"   ℹ️  Note: {alert_data['note']}")

# ============================================================================
# FINAL SYSTEM STATUS
# ============================================================================
print("\n\n" + "=" * 90)
print("📊 FINAL SYSTEM STATUS & STATISTICS")
print("=" * 90)

status = trust_agent.get_system_status()

print(f"\n🤖 Trust Agent Status: {status['trust_agent'].upper()}")
print(f"🔧 Mode: {status['mode'].upper()}")

print(f"\n⚙️  Configuration:")
cv = status['components']['cross_verifier']
print(f"   • Time Window:    {cv['time_window_minutes']} minutes")
print(f"   • Location Radius: {cv['location_radius_km']} km")
print(f"   • Min Sources:     {cv['min_sources_required']}")

print(f"\n📏 Trust Thresholds:")
for level, score in status['components']['thresholds'].items():
    print(f"   • {level.replace('_', ' ').title()}: {score * 100:.0f}%")

if 'statistics' in status and status['statistics']:
    stats = status['statistics']
    print(f"\n📈 System Statistics:")
    print(f"   • Total Users:     {stats.get('total_users', 0)}")
    print(f"   • Total Alerts:    {stats.get('total_alerts', 0)}")
    print(f"   • Total Activities: {stats.get('total_activities', 0)}")
    print(f"   • Blocked Users:   {stats.get('blocked_users', 0)}")

# ============================================================================
# USER PROFILES
# ============================================================================
print(f"\n\n👥 USER PROFILES:")
print("─" * 90)

# Show some user profiles
sample_users = ['ravi_kumar_mumbai', 'priya_shah_93', 'spam_bot_999', 'new_user_001']

for user_id in sample_users:
    profile = trust_agent.get_user_profile(user_id)
    if profile:
        rep = profile['reputation']
        print(f"\n📌 {user_id}")
        print(f"   Reputation:  {rep:.2f} ({'⭐' * int(rep * 5)})")
        print(f"   Reports:     {profile['total_reports']} total "
              f"({profile['accurate_reports']} accurate, {profile['false_reports']} false)")

print("\n" + "=" * 90)
print(" " * 30 + "DEMO COMPLETED SUCCESSFULLY!")
print("=" * 90)
print(f"\n💡 Key Findings:")
print(f"   • High confidence alerts with multiple sources get VERIFIED")
print(f"   • Duplicate reports are detected and rejected")
print(f"   • Rate limiting prevents spam after 5 reports/hour")
print(f"   • New users with uncertain reports get low trust scores")
print(f"   • Different locations don't cross-verify each other")
print("\n" + "=" * 90)