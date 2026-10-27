import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
import os

def train_model():
    # Load dataset
    data_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    df = pd.read_csv(data_path)

    # Prepare features and labels
    # Clean any NA values
    df = df.dropna(subset=['email_text'])
    X = df['email_text']
    y = df['label'] # 'phishing' or 'legitimate'

    # We increase max_features to 20000 and add bigrams (ngram_range=(1,2)) to improve accuracy
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=20000, ngram_range=(1, 2))),
        ('clf', LogisticRegression(max_iter=1000, n_jobs=-1, random_state=42))
    ])

    # Train the model
    print(f"Training the model on {len(df)} samples...")
    pipeline.fit(X, y)

    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), 'phishing-mail-v1.joblib')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
