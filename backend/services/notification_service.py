"""
Notification Service
Handles SMS, WhatsApp, and message template management
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging
from backend.config.twilio_config import twilio_config

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MessageTemplates:
    """Role-based message templates"""
    
    CITIZEN_ALERT = """
🚨 CRISIS ALERT
Type: {crisis_type}
Severity: {severity}
Location: {location}

Safety Instructions:
{instructions}

Nearest Shelter: {shelter}

Stay safe. CrisisNet
"""
    
    VOLUNTEER_TASK = """
📋 TASK ASSIGNED
Priority: {priority}
Type: {task_type}
Location: {location}

Instructions:
{instructions}

Please respond within 10 minutes.

CrisisNet Volunteer Network
"""
    
    AUTHORITY_UPDATE = """
⚠️ CRISIS DETECTED
Type: {crisis_type}
Confidence: {confidence}%
Verified: {verified}
Location: {location}

{affected_count} people affected
{volunteers_assigned} volunteers assigned

Dashboard: https://crisisnet.app/authority

CrisisNet Command
"""

    @staticmethod
    def get_template(role: str) -> str:
        """Get template by role"""
        templates = {
            'citizen': MessageTemplates.CITIZEN_ALERT,
            'volunteer': MessageTemplates.VOLUNTEER_TASK,
            'authority': MessageTemplates.AUTHORITY_UPDATE
        }
        return templates.get(role, MessageTemplates.CITIZEN_ALERT)


class NotificationService:
    """Unified notification service for SMS and WhatsApp"""
    
    def __init__(self):
        self.client = twilio_config.get_client()
        self.sms_number = twilio_config.get_sms_number()
        self.whatsapp_number = twilio_config.get_whatsapp_number()
        self.message_log = []
    
    def send_sms(self, to_number: str, message: str) -> Dict:
        """
        Send SMS via Twilio
        
        Args:
            to_number: Recipient phone number (with country code, e.g., +919876543210)
            message: Message text
            
        Returns:
            Dict with status and message_id
        """
        try:
            # Ensure number has + prefix
            if not to_number.startswith('+'):
                to_number = f'+{to_number}'
            
            # Send SMS
            message_obj = self.client.messages.create(
                body=message,
                from_=self.sms_number,
                to=to_number
            )
            
            # Log success
            log_entry = {
                'id': message_obj.sid,
                'type': 'SMS',
                'to': to_number,
                'status': message_obj.status,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            self.message_log.append(log_entry)
            
            logger.info(f"SMS sent successfully to {to_number} | SID: {message_obj.sid}")
            
            return {
                'success': True,
                'message_id': message_obj.sid,
                'status': message_obj.status,
                'to': to_number
            }
            
        except Exception as e:
            logger.error(f"SMS failed to {to_number}: {str(e)}")
            
            # Log failure
            log_entry = {
                'id': None,
                'type': 'SMS',
                'to': to_number,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'success': False
            }
            self.message_log.append(log_entry)
            
            return {
                'success': False,
                'error': str(e),
                'to': to_number
            }
    
    def send_whatsapp(self, to_number: str, message: str) -> Dict:
        """
        Send WhatsApp message via Twilio
        
        Args:
            to_number: Recipient WhatsApp number (with country code)
            message: Message text
            
        Returns:
            Dict with status and message_id
        """
        try:
            # Format WhatsApp number
            if not to_number.startswith('whatsapp:'):
                if not to_number.startswith('+'):
                    to_number = f'+{to_number}'
                to_number = f'whatsapp:{to_number}'
            
            # Send WhatsApp message
            message_obj = self.client.messages.create(
                body=message,
                from_=self.whatsapp_number,
                to=to_number
            )
            
            # Log success
            log_entry = {
                'id': message_obj.sid,
                'type': 'WhatsApp',
                'to': to_number,
                'status': message_obj.status,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            self.message_log.append(log_entry)
            
            logger.info(f"WhatsApp sent successfully to {to_number} | SID: {message_obj.sid}")
            
            return {
                'success': True,
                'message_id': message_obj.sid,
                'status': message_obj.status,
                'to': to_number
            }
            
        except Exception as e:
            logger.error(f"WhatsApp failed to {to_number}: {str(e)}")
            
            # Log failure
            log_entry = {
                'id': None,
                'type': 'WhatsApp',
                'to': to_number,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'success': False
            }
            self.message_log.append(log_entry)
            
            return {
                'success': False,
                'error': str(e),
                'to': to_number
            }
    
    def send_with_fallback(self, to_number: str, message: str, prefer_whatsapp: bool = False) -> Dict:
        """
        Send message with fallback mechanism
        Try WhatsApp first, fallback to SMS if it fails
        
        Args:
            to_number: Recipient number
            message: Message text
            prefer_whatsapp: If True, try WhatsApp first
            
        Returns:
            Dict with delivery status
        """
        if prefer_whatsapp:
            # Try WhatsApp first
            result = self.send_whatsapp(to_number, message)
            if result['success']:
                return result
            
            # Fallback to SMS
            logger.info(f"WhatsApp failed, falling back to SMS for {to_number}")
            return self.send_sms(to_number, message)
        else:
            # Send SMS directly
            return self.send_sms(to_number, message)
    
    def format_message(self, role: str, data: Dict) -> str:
        """
        Format message using role-based template
        
        Args:
            role: User role (citizen/volunteer/authority)
            data: Data to fill in template
            
        Returns:
            Formatted message string
        """
        template = MessageTemplates.get_template(role)
        try:
            return template.format(**data)
        except KeyError as e:
            logger.error(f"Missing template key: {e}")
            return f"Crisis Alert: {data.get('crisis_type', 'Unknown')} at {data.get('location', 'Unknown location')}"
    
    def get_message_status(self, message_id: str) -> Dict:
        """
        Check delivery status of a sent message
        
        Args:
            message_id: Twilio message SID
            
        Returns:
            Dict with current status
        """
        try:
            message = self.client.messages(message_id).fetch()
            return {
                'success': True,
                'status': message.status,
                'to': message.to,
                'error_code': message.error_code,
                'error_message': message.error_message
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_logs(self, limit: int = 50) -> List[Dict]:
        """
        Get recent message logs
        
        Args:
            limit: Number of logs to return
            
        Returns:
            List of message log entries
        """
        return self.message_log[-limit:]


# Singleton instance
notification_service = NotificationService()