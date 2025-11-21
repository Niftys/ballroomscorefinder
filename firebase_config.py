import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Get the service account key from environment variable
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            
            if service_account_path and os.path.exists(service_account_path):
                # Initialize with service account file
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            else:
                # Initialize with default credentials (for Firebase Functions or local development)
                firebase_admin.initialize_app()
        
        # Get Firestore client
        db = firestore.client()
        print("Firebase initialized successfully")
        return db
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

# Configuration constants
OUTPUT_FILE = "scraped_data.xlsx"
