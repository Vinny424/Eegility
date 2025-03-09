# processor.py - Main EEG processing service
import os
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
import pymongo
import gridfs
import numpy as np
from bson.objectid import ObjectId
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import mne
from utils.eeg_loader import load_eeg_file
from utils.feature_extraction import extract_features_for_adhd
from utils.preprocessing import preprocess_eeg

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('eeg_processor')

# Load environment variables
load_dotenv()

# MongoDB connection
class MongoDBConnection:
    def __init__(self):
        self.client = None
        self.db = None
        self.fs = None
        
    def connect(self):
        try:
            mongodb_uri = os.getenv('MONGODB_URI')
            self.client = pymongo.MongoClient(mongodb_uri)
            self.db = self.client.get_default_database()
            self.fs = gridfs.GridFS(self.db)
            logger.info("Connected to MongoDB successfully")
            return True
        except Exception as e:
            logger.error(f"MongoDB connection error: {str(e)}")
            return False
    
    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

# EEG Processing Service
class EEGProcessor:
    def __init__(self, mongo_connection):
        self.mongo = mongo_connection
        self.data_dir = os.getenv('DATA_DIR', '/app/data')
        
    def process_eeg_request(self, eeg_id):
        """Process an EEG analysis request"""
        try:
            # Get EEG data from MongoDB
            eeg_data = self.mongo.db.eegdata.find_one({"_id": ObjectId(eeg_id)})
            
            if not eeg_data:
                logger.error(f"EEG data not found: {eeg_id}")
                return False
            
            # Extract binary data
            binary_data = eeg_data['data']
            
            # Save to temporary file
            temp_file_path = os.path.join(self.data_dir, f"temp_{eeg_id}.{eeg_data['format'].lower()}")
            with open(temp_file_path, 'wb') as temp_file:
                temp_file.write(binary_data)
            
            # Load EEG file
            raw = load_eeg_file(temp_file_path)
            
            # Preprocess the EEG data
            preprocessed = preprocess_eeg(raw)
            
            # Extract features for ADHD analysis
            features = extract_features_for_adhd(preprocessed)
            
            # Perform ADHD prediction
            prediction, confidence, probabilities = self._predict_adhd(features)
            
            # Update MongoDB with analysis results
            update_result = self.mongo.db.eegdata.update_one(
                {"_id": ObjectId(eeg_id)},
                {
                    "$set": {
                        "svm_analysis": {
                            "performed": True,
                            "result": prediction,
                            "confidence": confidence,
                            "features_used": list(features.keys()),
                            "performed_at": datetime.now(),
                            "details": {
                                "probabilities": probabilities,
                                "key_features": {
                                    "theta_beta_ratio": features.get("global_theta_beta_ratio"),
                                    "frontal_theta": next((v for k, v in features.items() if 'frontal' in k.lower() and 'theta' in k.lower()), None),
                                    "central_beta": next((v for k, v in features.items() if 'central' in k.lower() and 'beta' in k.lower()), None)
                                }
                            }
                        }
                    }
                }
            )
            
            # Clean up temporary file
            os.remove(temp_file_path)
            
            logger.info(f"Analysis completed for EEG {eeg_id}: {prediction} (confidence: {confidence:.2f})")
            return True
            
        except Exception as e:
            logger.error(f"Error processing EEG {eeg_id}: {str(e)}")
            # Update MongoDB with error status
            self.mongo.db.eegdata.update_one(
                {"_id": ObjectId(eeg_id)},
                {
                    "$set": {
                        "svm_analysis.performed": True,
                        "svm_analysis.result": "Inconclusive",
                        "svm_analysis.error": str(e),
                        "svm_analysis.performed_at": datetime.now()
                    }
                }
            )
            return False
    
    def _predict_adhd(self, features):
        """Use SVM model to predict ADHD from features"""
        try:
            import joblib
            from sklearn.preprocessing import StandardScaler
            
            # Load model
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'adhd_svm_model.pkl')
            
            # Check if model exists
            if not os.path.exists(model_path):
                logger.warning("ADHD model not found. Using dummy prediction.")
                # Return dummy prediction (50/50 chance)
                rand_val = np.random.random()
                if rand_val > 0.5:
                    return "ADHD", 0.7, {"ADHD": 0.7, "non-ADHD": 0.3}
                else:
                    return "non-ADHD", 0.65, {"ADHD": 0.35, "non-ADHD": 0.65}
            
            # Load the model
            model = joblib.load(model_path)
            
            # Prepare feature vector
            import pandas as pd
            X = pd.DataFrame([features])
            
            # Make prediction
            prediction = model.predict(X)[0]
            probabilities = model.predict_proba(X)[0]
            
            # Get confidence (probability of the predicted class)
            class_idx = np.where(model.classes_ == prediction)[0][0]
            confidence = probabilities[class_idx]
            
            # Format probabilities as dictionary
            prob_dict = {cls: float(prob) for cls, prob in zip(model.classes_, probabilities)}
            
            return prediction, float(confidence), prob_dict
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return "Inconclusive", 0.0, {"ADHD": 0.0, "non-ADHD": 0.0, "Inconclusive": 1.0}

# File watcher to process new requests
class RequestHandler(FileSystemEventHandler):
    def __init__(self, processor):
        self.processor = processor
        
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.request'):
            request_path = event.src_path
            logger.info(f"New analysis request detected: {request_path}")
            
            try:
                # Get EEG ID from filename
                eeg_id = os.path.basename(request_path).split('.')[0]
                
                # Process the request
                self.processor.process_eeg_request(eeg_id)
                
                # Delete the request file
                os.remove(request_path)
                
            except Exception as e:
                logger.error(f"Error handling request: {str(e)}")

# Poll MongoDB for new analysis requests
def poll_mongodb(mongo_connection, processor):
    while True:
        try:
            # Find EEG data with pending analysis requests
            pending_requests = mongo_connection.db.eegdata.find({
                "$or": [
                    {"svm_analysis.requested": True, "svm_analysis.performed": False},
                    {"svm_analysis.requested": True, "svm_analysis.performed": {"$exists": False}}
                ]
            })
            
            # Process each pending request
            for request in pending_requests:
                eeg_id = str(request["_id"])
                logger.info(f"Processing pending request for EEG {eeg_id}")
                
                # Mark as in-progress
                mongo_connection.db.eegdata.update_one(
                    {"_id": ObjectId(eeg_id)},
                    {"$set": {"svm_analysis.in_progress": True}}
                )
                
                # Process the request
                processor.process_eeg_request(eeg_id)
                
                # Mark as no longer requested
                mongo_connection.db.eegdata.update_one(
                    {"_id": ObjectId(eeg_id)},
                    {
                        "$set": {"svm_analysis.in_progress": False},
                        "$unset": {"svm_analysis.requested": ""}
                    }
                )
            
        except Exception as e:
            logger.error(f"Error polling MongoDB: {str(e)}")
        
        # Sleep before next poll
        time.sleep(10)

# Main function
def main():
    # Create MongoDB connection
    mongo_connection = MongoDBConnection()
    if not mongo_connection.connect():
        logger.error("Failed to connect to MongoDB. Exiting.")
        return
    
    # Create processor
    processor = EEGProcessor(mongo_connection)
    
    try:
        # Start file watcher for request files
        request_handler = RequestHandler(processor)
        observer = Observer()
        observer.schedule(request_handler, path=processor.data_dir, recursive=False)
        observer.start()
        logger.info(f"File watcher started for directory: {processor.data_dir}")
        
        # Start MongoDB polling in the main thread
        logger.info("Starting MongoDB polling for analysis requests")
        poll_mongodb(mongo_connection, processor)
        
    except KeyboardInterrupt:
        observer.stop()
        logger.info("Processor service stopped by user")
    
    except Exception as e:
        logger.error(f"Error in main loop: {str(e)}")
    
    finally:
        observer.join()
        mongo_connection.close()

if __name__ == "__main__":
    main()