"""
Twilio Configuration
Handles Twilio client initialization and credentials
"""

import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TwilioConfig:
    """Twilio configuration and client management"""
    
    def __init__(self):
        # Load credentials from environment variables
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.phone_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
        
        # Validate credentials
        if not all([self.account_sid, self.auth_token, self.phone_number]):
            raise ValueError("Missing Twilio credentials in environment variables")
        
        # Initialize Twilio client
        self.client = Client(self.account_sid, self.auth_token)
    
    def get_client(self):
        """Return initialized Twilio client"""
        return self.client
    
    def get_sms_number(self):
        """Return SMS sender number"""
        return self.phone_number
    
    def get_whatsapp_number(self):
        """Return WhatsApp sender number"""
        return self.whatsapp_number

# Singleton instance
twilio_config = TwilioConfig()