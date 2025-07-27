
# api_server.py

import os
import uuid
import subprocess
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from processors import run_trOCR, run_whisper # Import our new functions

# --- CONFIGURATION ---
UPLOAD_DIRECTORY = "uploads"
PROCESSED_TEXT_DIRECTORY = "processed_text"
PYTHON_EXECUTABLE = "python"  # Or specify full path to python.exe

app = Flask(__name__)

def trigger_embedding_process(text_filepath: str):
    """Starts the embedder script for a given text file."""
    print(f"[API Server] Triggering embedding for '{text_filepath}'...")
    subprocess.Popen([PYTHON_EXECUTABLE, "embedder_and_storer.py", text_filepath])

# --- API ENDPOINTS ---

@app.route('/add_text', methods=['POST'])
def add_text():
    """Endpoint for direct text submissions."""
    if 'text' not in request.form:
        return jsonify({"status": "error", "message": "No text data provided"}), 400
    
    text_content = request.form['text']
    filename = f"text_{uuid.uuid4()}.txt"
    filepath = os.path.join(PROCESSED_TEXT_DIRECTORY, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text_content)
        
    trigger_embedding_process(filepath)
    return jsonify({"status": "success", "message": "Text received and processing started."}), 202

@app.route('/upload_image', methods=['POST'])
def upload_image():
    """Endpoint for handwritten note image uploads."""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_DIRECTORY, filename)
        file.save(upload_path)
        
        # Perform OCR
        extracted_text = run_trOCR(upload_path)
        
        # Save extracted text
        text_filename = f"from_image_{os.path.splitext(filename)[0]}.txt"
        text_filepath = os.path.join(PROCESSED_TEXT_DIRECTORY, text_filename)
        with open(text_filepath, 'w', encoding='utf-8') as f:
            f.write(extracted_text)
            
        trigger_embedding_process(text_filepath)
        return jsonify({"status": "success", "message": "Image received, processed via OCR, and embedding started."}), 202

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    """Endpoint for audio note uploads."""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_DIRECTORY, filename)
        file.save(upload_path)
        
        # Perform Transcription
        transcribed_text = run_whisper(upload_path)
        
        # Save transcribed text
        text_filename = f"from_audio_{os.path.splitext(filename)[0]}.txt"
        text_filepath = os.path.join(PROCESSED_TEXT_DIRECTORY, text_filename)
        with open(text_filepath, 'w', encoding='utf-8') as f:
            f.write(transcribed_text)
            
        trigger_embedding_process(text_filepath)
        return jsonify({"status": "success", "message": "Audio received, transcribed, and embedding started."}), 202

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
    os.makedirs(PROCESSED_TEXT_DIRECTORY, exist_ok=True)
    
    print("API Server is running. Listening for notes on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=False)
