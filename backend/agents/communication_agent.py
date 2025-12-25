
"""
Communication Agent
Main AI agent responsible for crisis communication coordination
"""

from typing import Dict, List, Optional
import logging
from datetime import datetime
from backend.services.notification_service import notification_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CommunicationAgent:
    """
    AI Agent for Communication & Reliability
    
    Responsibilities:
    - Receive verified crisis data
    - Route messages to appropriate channels
    - Handle delivery failures with retry logic
    - Maintain communication logs
    """
    
    def __init__(self):
        self.notification_service = notification_service
        self.status = "active"
        self.messages_sent = 0
        self.messages_failed = 0
        self.retry_queue = []
    
    def process_crisis_alert(self, crisis_data: Dict) -> Dict:
        """
        Process crisis alert from Trust Agent and send notifications
        
        Args:
            crisis_data: Verified crisis information
            {
                'crisis_id': str,
                'crisis_type': str,
                'severity': str,
                'location': str,
                'confidence': float,
                'verified': bool,
                'affected_citizens': List[dict],
                'assigned_volunteers': List[dict],
                'authorities': List[dict]
            }
            
        Returns:
            Dict with communication results
        """
        logger.info(f"Processing crisis alert: {crisis_data.get('crisis_id')}")
        
        results = {
            'crisis_id': crisis_data.get('crisis_id'),
            'timestamp': datetime.now().isoformat(),
            'citizen_alerts': [],
            'volunteer_notifications': [],
            'authority_updates': [],
            'success_count': 0,
            'failed_count': 0
        }
        
        # 1. Alert affected citizens
        citizens = crisis_data.get('affected_citizens', [])
        for citizen in citizens:
            result = self._send_citizen_alert(citizen, crisis_data)
            results['citizen_alerts'].append(result)
            if result['success']:
                results['success_count'] += 1
            else:
                results['failed_count'] += 1
        
        # 2. Notify assigned volunteers
        volunteers = crisis_data.get('assigned_volunteers', [])
        for volunteer in volunteers:
            result = self._send_volunteer_task(volunteer, crisis_data)
            results['volunteer_notifications'].append(result)
            if result['success']:
                results['success_count'] += 1
            else:
                results['failed_count'] += 1
        
        # 3. Update authorities
        authorities = crisis_data.get('authorities', [])
        for authority in authorities:
            result = self._send_authority_update(authority, crisis_data)
            results['authority_updates'].append(result)
            if result['success']:
                results['success_count'] += 1
            else:
                results['failed_count'] += 1
        
        # Update agent stats
        self.messages_sent += results['success_count']
        self.messages_failed += results['failed_count']
        
        logger.info(f"Crisis alert processed: {results['success_count']} sent, {results['failed_count']} failed")
        
        return results
    
    def _send_citizen_alert(self, citizen: Dict, crisis_data: Dict) -> Dict:
        """Send safety alert to citizen"""
        try:
            # Format message
            message_data = {
                'crisis_type': crisis_data.get('crisis_type', 'Emergency'),
                'severity': crisis_data.get('severity', 'High'),
                'location': crisis_data.get('location', 'Your area'),
                'instructions': self._get_safety_instructions(crisis_data.get('crisis_type')),
                'shelter': crisis_data.get('nearest_shelter', 'Check local authorities')
            }
            
            message = self.notification_service.format_message('citizen', message_data)
            
            # Send via SMS (citizens get SMS for reliability)
            result = self.notification_service.send_sms(
                to_number=citizen.get('phone'),
                message=message
            )
            
            return {
                'user_id': citizen.get('id'),
                'phone': citizen.get('phone'),
                'channel': 'SMS',
                'success': result['success'],
                'message_id': result.get('message_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to send citizen alert: {e}")
            return {
                'user_id': citizen.get('id'),
                'phone': citizen.get('phone'),
                'success': False,
                'error': str(e)
            }
    
    def _send_volunteer_task(self, volunteer: Dict, crisis_data: Dict) -> Dict:
        """Send task assignment to volunteer"""
        try:
            # Format message
            message_data = {
                'priority': crisis_data.get('severity', 'High'),
                'task_type': f"{crisis_data.get('crisis_type')} Response",
                'location': crisis_data.get('location'),
                'instructions': volunteer.get('task_description', 'Check dashboard for details')
            }
            
            message = self.notification_service.format_message('volunteer', message_data)
            
            # Send via WhatsApp (volunteers prefer WhatsApp), fallback to SMS
            result = self.notification_service.send_with_fallback(
                to_number=volunteer.get('phone'),
                message=message,
                prefer_whatsapp=True
            )
            
            return {
                'user_id': volunteer.get('id'),
                'phone': volunteer.get('phone'),
                'channel': 'WhatsApp/SMS',
                'success': result['success'],
                'message_id': result.get('message_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to send volunteer task: {e}")
            return {
                'user_id': volunteer.get('id'),
                'phone': volunteer.get('phone'),
                'success': False,
                'error': str(e)
            }
    
    def _send_authority_update(self, authority: Dict, crisis_data: Dict) -> Dict:
        """Send status update to authority"""
        try:
            # Format message
            message_data = {
                'crisis_type': crisis_data.get('crisis_type'),
                'confidence': int(crisis_data.get('confidence', 0) * 100),
                'verified': 'Yes' if crisis_data.get('verified') else 'Pending',
                'location': crisis_data.get('location'),
                'affected_count': len(crisis_data.get('affected_citizens', [])),
                'volunteers_assigned': len(crisis_data.get('assigned_volunteers', []))
            }
            
            message = self.notification_service.format_message('authority', message_data)
            
            # Send via SMS (authorities get SMS for reliability)
            result = self.notification_service.send_sms(
                to_number=authority.get('phone'),
                message=message
            )
            
            return {
                'user_id': authority.get('id'),
                'phone': authority.get('phone'),
                'channel': 'SMS',
                'success': result['success'],
                'message_id': result.get('message_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to send authority update: {e}")
            return {
                'user_id': authority.get('id'),
                'phone': authority.get('phone'),
                'success': False,
                'error': str(e)
            }
    
    def _get_safety_instructions(self, crisis_type: str) -> str:
        """Get safety instructions based on crisis type"""
        instructions = {
            'flood': '- Move to higher ground immediately\n- Avoid walking/driving through water\n- Stay away from electrical equipment',
            'fire': '- Evacuate immediately\n- Stay low to avoid smoke\n- Do not use elevators\n- Meet at designated safe zone',
            'earthquake': '- Drop, Cover, and Hold On\n- Stay away from windows\n- If outside, move to open area',
            'medical': '- Stay calm\n- Call emergency services\n- Provide first aid if trained\n- Wait for medical team',
            'default': '- Follow official instructions\n- Stay calm and alert\n- Keep phone charged\n- Stay informed'
        }
        return instructions.get(crisis_type.lower(), instructions['default'])
    
    def retry_failed_messages(self) -> Dict:
        """Retry failed messages from queue"""
        logger.info(f"Retrying {len(self.retry_queue)} failed messages")
        
        success_count = 0
        still_failed = []
        
        for item in self.retry_queue:
            # Retry based on type
            if item['type'] == 'citizen':
                result = self._send_citizen_alert(item['user'], item['crisis_data'])
            elif item['type'] == 'volunteer':
                result = self._send_volunteer_task(item['user'], item['crisis_data'])
            else:
                result = self._send_authority_update(item['user'], item['crisis_data'])
            
            if result['success']:
                success_count += 1
            else:
                still_failed.append(item)
        
        self.retry_queue = still_failed
        
        return {
            'retried': len(self.retry_queue) + success_count,
            'success': success_count,
            'still_failed': len(still_failed)
        }
    
    def get_agent_status(self) -> Dict:
        """Get current agent status"""
        return {
            'agent': 'Communication Agent',
            'status': self.status,
            'messages_sent': self.messages_sent,
            'messages_failed': self.messages_failed,
            'success_rate': round((self.messages_sent / (self.messages_sent + self.messages_failed) * 100), 2) if (self.messages_sent + self.messages_failed) > 0 else 0,
            'retry_queue_size': len(self.retry_queue),
            'last_updated': datetime.now().isoformat()
        }


# Singleton instance
communication_agent = CommunicationAgent()