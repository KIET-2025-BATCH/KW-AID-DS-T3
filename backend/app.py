from flask import Flask, request, jsonify
from pymongo import MongoClient
from gridfs import GridFS
from bson.objectid import ObjectId
from flask_cors import CORS
import tempfile
import os
import time
import shutil
from extractive_summarization import extract_content_from_pdf, summarize_text

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'your_secret_key'

# Connect to MongoDB
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client['NLP_SIGN']
    multimedia_collection = db['multimedia']
    extracted_data_collection = db['extracted_data']
    fs = GridFS(db)
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")

@app.route('/process-document', methods=['POST'])
def process_document():
    temp_path = None
    file_content = None
    
    try:
        if 'file' not in request.files:
            print("❌ No file found in request")
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        print(f"✅ Received file: {file.filename}")
        
        # Create a temporary file
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, file.filename)
        
        # Save file
        file.save(temp_path)
        print(f"✅ Temporary file saved at: {temp_path}")
        
        # Extract text and generate summary before any GridFS operations
        extracted_text = extract_content_from_pdf(temp_path)
        summary, keypoints = summarize_text(extracted_text)
        print(f"✅ Extracted Text: {extracted_text[:100]}...")
        
        # Read file content for GridFS before closing file
        with open(temp_path, 'rb') as f:
            file_content = f.read()
        
        # Store file in GridFS
        file_id = fs.put(file_content, filename=file.filename)
        
        # Store document metadata and extracted text in multimedia_collection
        doc_data = {
            'filename': file.filename,
            'file_id': file_id,
            'upload_date': time.time(),
            'original_text': extracted_text,
            'summary': summary
        }
        doc_id = multimedia_collection.insert_one(doc_data).inserted_id
        
        # Store extracted data in extracted_data_collection
        extracted_data = {
            'doc_id': str(doc_id),
            'filename': file.filename,
            'summary': summary,
            'keypoints': keypoints,
            'process_date': time.time()
        }
        extracted_data_collection.insert_one(extracted_data)
        
        return jsonify({
            "status": "success", 
            "extracted_text": summary,
            "keypoints": keypoints,
            "doc_id": str(doc_id)
        })
    
    except Exception as e:
        print(f"❌ Server error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temporary files safely in the finally block
        try:
            if temp_path and os.path.exists(temp_path):
                # Close all file handles before removal
                import gc
                gc.collect()  # Force garbage collection
                
                # Remove the temporary directory and all its contents
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"✅ Temporary files cleaned up")
        except Exception as e:
            print(f"⚠️ Error during cleanup: {str(e)}")

@app.route('/get-summary/<doc_id>', methods=['GET'])
def get_summary(doc_id):
    try:
        doc = multimedia_collection.find_one({'_id': ObjectId(doc_id)})
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
        
        return jsonify({
            'summary': doc.get('summary', ''), 
            'original_text': doc.get('original_text', '')
        })
    except Exception as e:
        print(f"❌ Error retrieving summary: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-extracted-data', methods=['GET'])
def get_extracted_data():
    try:
        data = list(extracted_data_collection.find({}, {"_id": 0}))  # Exclude MongoDB's _id field
        return jsonify(data), 200
    except Exception as e:
        print(f"❌ Error fetching extracted data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)