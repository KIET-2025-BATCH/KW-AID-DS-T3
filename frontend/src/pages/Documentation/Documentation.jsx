import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './Documentation.css';
import Navbar from '../Navbar/Navbar';

function Documentation() {
  const [keypoints, setKeypoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [hiddenDocIds, setHiddenDocIds] = useState(() => {
    // Initialize from localStorage to persist across refreshes
    const saved = localStorage.getItem('hiddenDocIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch existing documents on component mount
  useEffect(() => {
    fetchExtractedData();
  }, []);

  // Save hiddenDocIds to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hiddenDocIds', JSON.stringify(hiddenDocIds));
  }, [hiddenDocIds]);

  // Reset copy button status after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const fetchExtractedData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-extracted-data');
      if (response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleConvert = async () => {
    if (!fileInputRef.current.files[0]) {
      alert('Please upload a file first!');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      const file = fileInputRef.current.files[0];
      formData.append('file', file);

      // Request 15 keypoints in the API call
      const response = await axios.post('http://localhost:5000/process-document', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
        params: {
          keypoints_count: 15 // Request 15 keypoints
        }
      });

      if (response.data && response.data.keypoints) {
        setKeypoints(response.data.keypoints || []);
        setSelectedDocId(response.data.doc_id);
        
        // Refresh document list
        fetchExtractedData();
      } else {
        throw new Error('No keypoints extracted from the file');
      }
    } catch (error) {
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated selectDocument function to focus on fetching keypoints only
  const selectDocument = async (docId) => {
    try {
      setIsLoading(true);
      
      // Direct request for keypoints with a parameter for minimum count
      const keypointsResponse = await axios.get(`http://localhost:5000/get-keypoints/${docId}`, {
        params: {
          min_count: 15 // Request at least 15 keypoints
        }
      });
      
      if (keypointsResponse.data && keypointsResponse.data.keypoints) {
        setKeypoints(keypointsResponse.data.keypoints);
        setSelectedDocId(docId);
      } else {
        setKeypoints([]);
        alert('No keypoints found for this document');
      }
    } catch (error) {
      console.error('Error fetching document keypoints:', error);
      alert('Could not load the selected document');
      setKeypoints([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteFromUI = (e, docId) => {
    e.stopPropagation(); // Prevent document selection when clicking delete
    setHiddenDocIds([...hiddenDocIds, docId]);
    
    // If the deleted document was selected, clear the selection
    if (selectedDocId === docId) {
      setSelectedDocId(null);
      setKeypoints([]);
    }
  };

  // New function to copy keypoints to clipboard
  const copyKeypointsToClipboard = () => {
    if (keypoints.length > 0) {
      const formattedKeypoints = keypoints.map((point, index) => `${index + 1}. ${point}`).join('\n');
      navigator.clipboard.writeText(formattedKeypoints)
        .then(() => {
          setCopySuccess(true);
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy to clipboard');
        });
    }
  };

  // Filter out documents that should be hidden
  const visibleDocuments = documents.filter(doc => !hiddenDocIds.includes(doc.doc_id));

  return (
    <>
    <Navbar/>
    <div className="documentation-container">
      <div className="content">
        <h1>Extract Key Points From Your File</h1>
        <p>Upload a document and get important key points instantly.</p>

        {/* File Upload Section */}
        <div className="file-upload-section">
          <input type="file" accept=".pdf,.docx,.txt" ref={fileInputRef} />
          <button onClick={handleConvert} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Extract Key Points'}
          </button>
        </div>

        {/* Previously Processed Documents */}
        {visibleDocuments.length > 0 && (
          <div className="previous-documents">
            <h3>Previously Processed Documents</h3>
            <div className="documents-list">
              {visibleDocuments.map((doc, index) => (
                <div 
                  key={index} 
                  className={`document-item ${selectedDocId === doc.doc_id ? 'selected' : ''}`}
                  onClick={() => selectDocument(doc.doc_id)}
                >
                  <div className="document-content">
                    <p>{doc.filename}</p>
                    <small>{new Date(doc.process_date * 1000).toLocaleString()}</small>
                  </div>
                  <div 
                    className="delete-icon" 
                    onClick={(e) => handleDeleteFromUI(e, doc.doc_id)}
                    title="Remove from list"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Points Display with Copy Button */}
        <div className="keypoints-section">
          <div className="keypoints-header">
            <h3>Key Points:</h3>
            {keypoints && keypoints.length > 0 && (
              <button 
                className={`copy-button ${copySuccess ? 'success' : ''}`} 
                onClick={copyKeypointsToClipboard}
                disabled={isLoading}
              >
                {copySuccess ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                    </svg>
                    Copy All
                  </>
                )}
              </button>
            )}
          </div>
          {isLoading ? (
            <p>Extracting key points...</p>
          ) : (
            keypoints && keypoints.length > 0 ? (
              <div className="keypoints">
                <ul>
                  {keypoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
                {keypoints.length < 10 && (
                  <div className="keypoints-info">
                    <p><i>Note: This document yielded {keypoints.length} key points. Our system aims to extract 10-15 points from rich content.</i></p>
                  </div>
                )}
              </div>
            ) : (
              <p className="no-data-message">No key points extracted yet. Upload a document to get started.</p>
            )
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default Documentation;