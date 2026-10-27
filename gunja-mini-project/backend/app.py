from flask import Flask, request, jsonify
from flask_cors import CORS
from model import predict_email

app = Flask(__name__)
CORS(app) # Allow Cross-Origin requests from the frontend

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    if not data or 'email_text' not in data:
        return jsonify({'error': 'No email_text provided'}), 400
        
    text = data['email_text']
    
    if not text.strip():
        return jsonify({'error': 'Email text cannot be empty'}), 400
        
    result = predict_email(text)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
