import os
import json

def list_folders(path):
    return [f for f in os.listdir(path) if os.path.isdir(os.path.join(path, f))]

def load_json_file(file_path):
    # Try using 'utf-8-sig' or 'latin1' if 'cp437' doesn't work
    with open(file_path, encoding='utf-8-sig', errors="ignore") as json_file:
        data = json.load(json_file)

    return data
