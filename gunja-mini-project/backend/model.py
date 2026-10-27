import joblib
import os
import re

model_path = os.path.join(os.path.dirname(__file__), 'phishing-mail-v1.joblib')
pipeline = None

def load_model():
    global pipeline
    if os.path.exists(model_path):
        pipeline = joblib.load(model_path)
    else:
        print("Model not found. Please run train.py first.")

def extract_indicators(text):
    indicators = []
    
    # Check for urgency words
    urgency_words = ['urgent', 'immediately', 'suspended', 'locked', 'verify', 'delete', 'arrest', 'final notice']
    found_urgency = [word for word in urgency_words if word.lower() in text.lower()]
    if found_urgency:
        indicators.append(f"Contains urgent language ({', '.join(found_urgency)})")
        
    # Check for suspicious links
    urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text)
    if urls:
        indicators.append(f"Contains {len(urls)} link(s)")
        for url in urls:
            if 'secure' in url or 'update' in url or 'verify' in url or 'login' in url:
                indicators.append(f"Suspicious keyword found in URL: {url}")
                
    # Check for credential requests
    if 'password' in text.lower() or 'account' in text.lower() or 'login' in text.lower():
        indicators.append("Requests account credentials or login")
        
    # Reward claims
    if 'win' in text.lower() or 'prize' in text.lower() or 'free' in text.lower() and 'congratulations' in text.lower():
        indicators.append("Contains reward/prize claims")
        
    return indicators

def predict_email(text):
    if pipeline is None:
        load_model()
        
    if pipeline is None:
        return {"error": "Model not loaded."}
        
    # Get probability and prediction
    prob = pipeline.predict_proba([text])[0]
    classes = pipeline.classes_
    
    phishing_prob = prob[list(classes).index('phishing')]
    
    # Get indicators
    indicators = extract_indicators(text)
    
    # HYBRID APPROACH: Boost phishing probability if strong indicators are found
    if len(indicators) > 0:
        boost = len(indicators) * 0.15  # add 15% probability per indicator
        phishing_prob = min(0.99, phishing_prob + boost)
        
    prediction = "phishing" if phishing_prob >= 0.5 else "legitimate"
    
    return {
        "prediction": prediction,
        "phishing_probability": float(phishing_prob),
        "confidence_score": float(max(phishing_prob, 1 - phishing_prob) * 100),
        "indicators": indicators
    }
