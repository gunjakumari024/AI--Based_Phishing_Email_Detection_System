import pandas as pd
from datasets import load_dataset
import os

print("Downloading dataset from Hugging Face...")
# Try a few common phishing datasets
datasets_to_try = ['zefang-liu/phishing-email-dataset', 'pirocheto/phishing-email', 'ealvaradob/phishing-dataset']

dataset = None
for ds_name in datasets_to_try:
    try:
        dataset = load_dataset(ds_name)
        print(f"Successfully loaded {ds_name}")
        break
    except Exception as e:
        print(f"Failed to load {ds_name}: {e}")

if dataset:
    df = dataset['train'].to_pandas()
    print(f"Columns found: {df.columns.tolist()}")
    
    new_df = pd.DataFrame()
    
    if 'Email Text' in df.columns and 'Email Type' in df.columns:
        # zefang-liu/phishing-email-dataset
        new_df['email_text'] = df['Email Text']
        new_df['label'] = df['Email Type'].apply(lambda x: 'phishing' if 'Phishing' in str(x) else 'legitimate')
    elif 'text' in df.columns and 'label' in df.columns:
        new_df['email_text'] = df['text']
        new_df['label'] = df['label'].apply(lambda x: 'phishing' if str(x) == '1' else 'legitimate')
    else:
        print("Unknown columns, using fallback")
        new_df['email_text'] = df.iloc[:, 1]
        new_df['label'] = df.iloc[:, 2].apply(lambda x: 'phishing' if 'Phishing' in str(x) else 'legitimate')

    # Filter out empty emails
    new_df = new_df.dropna(subset=['email_text'])
    
    # Shuffle the dataset
    new_df = new_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Append to existing dataset.csv
    csv_path = 'dataset.csv'
    new_df.to_csv(csv_path, mode='w', index=False, header=True)
    
    print(f"Successfully added {len(new_df)} samples to dataset.csv")
else:
    print("Could not load any datasets.")
