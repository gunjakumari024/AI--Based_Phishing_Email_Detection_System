# AI-Based Phishing Email Detection System

A machine learning web app that classifies emails as **phishing** or **legitimate**. Paste the text of an email into the interface and the system analyzes it and returns a prediction.

The backend is a Python Flask API serving a trained scikit-learn model. The frontend is a Vite-powered web interface that talks to the API.

## Features

- Classifies email text as phishing or legitimate using NLP and machine learning
- REST API endpoint for predictions (`POST /api/predict`)
- Clean web interface to paste and check emails
- Input validation (rejects missing or empty email text)
- Scripts to download the dataset and retrain the model

## Tech Stack

| Layer    | Technologies                                   |
| -------- | ---------------------------------------------- |
| Backend  | Python, Flask, Flask-CORS                      |
| ML / NLP | scikit-learn, NLTK, pandas, NumPy, joblib      |
| Frontend | Vite, JavaScript                               |

## Project Structure

```
gunja-mini-project/
├── backend/
│   ├── app.py                   # Flask API
│   ├── model.py                 # Loads the model and runs predictions
│   ├── train.py                 # Trains the classifier
│   ├── download_data.py         # Downloads the dataset
│   ├── dataset.csv              # Training data
│   ├── phishing-mail-v1.joblib  # Trained model
│   └── requirements.txt         # Python dependencies
└── frontend/
    ├── src/                     # Frontend source code
    ├── public/
    ├── index.html
    └── package.json
```

## Getting Started

### Prerequisites

- Python 3.9 or newer
- Node.js 18 or newer and npm

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/AI-Based-Phishing-Email-Detection-System.git
cd AI-Based-Phishing-Email-Detection-System
```

### 2. Run the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API starts at **http://127.0.0.1:5000**.

If the trained model file (`phishing-mail-v1.joblib`) is missing, generate it first:

```bash
python download_data.py   # only if dataset.csv is missing
python train.py
```

### 3. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app starts at **http://localhost:5173**. Keep both servers running at the same time.

## API Reference

### `POST /api/predict`

Classifies a piece of email text.

**Request body**

```json
{
  "email_text": "Your account has been suspended. Click here to verify your password immediately."
}
```

**Example**

```bash
curl -X POST http://127.0.0.1:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"email_text": "Your account has been suspended. Click here to verify your password."}'
```

**Errors**

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 400    | `email_text` is missing from the request |
| 400    | `email_text` is empty                    |

## How It Works

1. The email text is cleaned and preprocessed (tokenization and stop-word handling with NLTK).
2. Text is converted to numerical features.
3. A trained scikit-learn classifier predicts whether the email is phishing or legitimate.
4. The result is returned by the Flask API and displayed in the frontend.

## Troubleshooting

- **`Failed to Load Page` / `ERR_CONNECTION_REFUSED` on port 5173:** the frontend isn't running. Start it with `npm run dev` inside `frontend`.
- **`source: no such file or directory: venv/bin/activate`:** you're not in the `backend` folder. `cd backend` first.
- **`No module named flask`:** activate the virtual environment and run `pip install -r requirements.txt`.
- **Frontend can't reach the API:** make sure the backend is running on port 5000.

## Disclaimer

This project is built for educational purposes. No classifier is perfect, so don't rely on it as your only defense against phishing. Always verify suspicious emails through official channels.

## Author

**Gunja Kumari**
GitHub: [@gunjakumari024](https://github.com/gunjakumari024)

## License

This project is licensed under the MIT License. Add a `LICENSE` file to the repository if you want to use this.
