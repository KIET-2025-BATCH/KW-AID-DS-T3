import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import nltk
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from heapq import nlargest
import string

# Download necessary NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

# Function to identify and extract main content blocks from PDF text
def extract_main_content(text):
    # Split text into lines
    lines = text.split('\n')
    
    # Group lines into content blocks (paragraphs)
    content_blocks = []
    current_block = []
    
    for line in lines:
        line = line.strip()
        
        # Skip obvious headers/footers/page numbers
        if (not line or                                               # Empty lines
            len(line) < 10 or                                         # Very short lines
            line.isdigit() or                                         # Page numbers
            re.match(r'^[A-Z\s]+$', line) or                         # ALL CAPS (likely headers)
            re.match(r'^(page|Page|PAGE)\s*\d+$', line) or           # Page indicators
            re.match(r'^\d+\s*(of|OF)\s*\d+$', line) or              # "Page X of Y"
            re.match(r'^[\d.]+\s*$', line)):                         # Just numbers or decimals
            continue
        
        # Check if this line starts a new paragraph
        if not line.endswith(('.', ':', '?', '!')) and len(line) < 50:
            # Likely a subheading, start a new block
            if current_block:
                content_blocks.append(' '.join(current_block))
                current_block = []
            # Store the heading text but mark it to identify later
            current_block.append(f"SECTION:{line}")
        else:
            # Regular content
            current_block.append(line)
    
    # Add the last block if it exists
    if current_block:
        content_blocks.append(' '.join(current_block))
    
    # Filter blocks that are too short to be meaningful content
    meaningful_blocks = [block for block in content_blocks if len(block) > 50]
    
    # Return the cleaned, meaningful content
    return '\n\n'.join(meaningful_blocks)

# Function to extract text using pdfplumber with focus on content
def extract_text_with_pdfplumber(pdf_path):
    raw_text_by_page = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                # Label the page for organization
                page_text = f"PAGE {i+1} CONTENT:\n{text}"
                raw_text_by_page.append(page_text)
            else:
                # Use OCR as fallback for this page
                image = page.to_image()
                ocr_text = pytesseract.image_to_string(image.original)
                page_text = f"PAGE {i+1} CONTENT (OCR):\n{ocr_text}"
                raw_text_by_page.append(page_text)
    
    # Process each page to extract meaningful content
    processed_pages = []
    for page_text in raw_text_by_page:
        page_content = extract_main_content(page_text)
        if page_content.strip():
            processed_pages.append(page_content)
    
    return "\n\n".join(processed_pages)

# Function to extract text using OCR with focus on content
def extract_text_with_ocr(pdf_path):
    images = convert_from_path(pdf_path)
    processed_pages = []
    
    for i, image in enumerate(images):
        ocr_text = pytesseract.image_to_string(image)
        page_text = f"PAGE {i+1} CONTENT (OCR):\n{ocr_text}"
        page_content = extract_main_content(page_text)
        if page_content.strip():
            processed_pages.append(page_content)
    
    return "\n\n".join(processed_pages)

# Function to identify important paragraphs
def identify_important_paragraphs(text):
    # Split into paragraphs (double newlines usually separate paragraphs)
    paragraphs = text.split('\n\n')
    important_paragraphs = []
    
    for paragraph in paragraphs:
        # Skip section markers or very short paragraphs
        if paragraph.startswith("SECTION:") or len(paragraph) < 100:
            continue
        
        # Count significant words (not stopwords)
        stop_words = set(stopwords.words('english'))
        words = word_tokenize(paragraph.lower())
        significant_words = [w for w in words if w not in stop_words and w.isalpha()]
        
        # Calculate density of significant words
        if len(words) > 0:
            significance_ratio = len(significant_words) / len(words)
            
            # Paragraphs with higher ratio of significant words are likely more important
            if significance_ratio > 0.3 and len(words) > 20:
                important_paragraphs.append(paragraph)
    
    return important_paragraphs

# General extraction function
def extract_content_from_pdf(pdf_path):
    try:
        # First try extracting text using pdfplumber
        extracted_text = extract_text_with_pdfplumber(pdf_path)
        if not extracted_text.strip():  # If no text is found, use OCR
            extracted_text = extract_text_with_ocr(pdf_path)
        
        # Find important paragraphs
        important_content = identify_important_paragraphs(extracted_text)
        if important_content:
            return "\n\n".join(important_content)
        else:
            return extracted_text  # Fallback to all content if no important paragraphs identified
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

# Updated function to extract key points from text - now returns up to 15 by default
def extract_keypoints(text, top_n=15):
    # Split text into sentences
    sentences = sent_tokenize(text)
    
    # Filter out short or header-like sentences
    sentences = [sent for sent in sentences if 
                 len(sent.split()) > 8 and 
                 not sent.isupper() and
                 not sent.startswith("PAGE") and
                 not sent.startswith("SECTION")]
    
    if not sentences:
        return []
    
    # Calculate information density for each sentence
    stop_words = set(stopwords.words('english'))
    sentence_scores = {}
    
    for sent in sentences:
        words = word_tokenize(sent.lower())
        # Count significant words (not stopwords, numbers, or short words)
        significant_words = [word for word in words 
                            if word not in stop_words 
                            and word.isalpha() 
                            and len(word) > 3]
        
        # Score based on significant word density and sentence length
        if len(words) > 0:
            # More weight to sentences with higher density of important words
            significance_score = len(significant_words) / len(words)
            # Slightly penalize very long sentences
            length_factor = min(1.0, 30 / len(words)) if len(words) > 30 else 1.0
            # Additional factor to prioritize sentences with technical terms or rare words
            rare_word_factor = sum(1 for word in significant_words if len(word) > 7) / (len(significant_words) + 1)
            
            # Combined score with increased emphasis on information density
            sentence_scores[sent] = (significance_score * 1.5 + length_factor + rare_word_factor * 0.5) / 3
        else:
            sentence_scores[sent] = 0
    
    # Get top sentences as key points
    keypoints = nlargest(min(top_n, len(sentence_scores)), 
                          sentence_scores, 
                          key=sentence_scores.get)
    
    return keypoints

# Updated summarization function - now returns up to 15 key points by default
def summarize_text(text, summary_length=15):
    # Calculate sentence significance
    sentences = sent_tokenize(text)
    
    # Filter out non-content sentences
    content_sentences = [sent for sent in sentences if 
                        len(sent.split()) > 8 and 
                        not sent.isupper() and
                        not sent.startswith("PAGE") and
                        not sent.startswith("SECTION")]
    
    if not content_sentences:
        return text, []  # No valid content sentences found
    
    # Extract key terms (not just words but also important phrases)
    stop_words = set(stopwords.words('english'))
    word_frequencies = {}
    
    for sent in content_sentences:
        words = word_tokenize(sent.lower())
        for word in words:
            if word not in stop_words and word.isalpha() and len(word) > 3:
                word_frequencies[word] = word_frequencies.get(word, 0) + 1
    
    # Find important sentences based on term frequency
    sentence_scores = {}
    for sent in content_sentences:
        score = 0
        words = word_tokenize(sent.lower())
        for word in words:
            if word in word_frequencies:
                score += word_frequencies[word]
        
        # Normalize by sentence length
        if len(words) > 0:
            sentence_scores[sent] = score / len(words)
        else:
            sentence_scores[sent] = 0
    
    # Select top sentences for summary
    summary_sentences = nlargest(min(summary_length, len(sentence_scores)), 
                                 sentence_scores, 
                                 key=sentence_scores.get)
    
    # Order sentences as they appear in the original text
    ordered_summary = [sent for sent in sentences if sent in summary_sentences]
    
    summary = ' '.join(ordered_summary)
    # Extract key points from the summary
    keypoints = extract_keypoints(summary, top_n=summary_length)
    
    return summary, keypoints

# Function to process and organize PDF output
def process_exam_pdf(pdf_path):
    # Extract full content from PDF
    text = extract_content_from_pdf(pdf_path)
    
    if text:
        # Summarize the full text and extract key points
        summary, keypoints = summarize_text(text)
        
        # Check if we got meaningful content
        if not summary.strip() or len(keypoints) == 0:
            return {
                "error": "No meaningful content could be extracted from the PDF.",
                "raw_text": text[:1000] + "..." if len(text) > 1000 else text  # Include raw text sample for debugging
            }
        
        # Organize the key points line by line
        keypoints_line_by_line = "\n".join([f"{i+1}. {point}" for i, point in enumerate(keypoints)])
        
        # Returning the summary and key points in a structured format
        output = {
            "summary": summary,
            "keypoints": keypoints_line_by_line,
            "content_by_page": text.split("PAGE")[1:]  # Split by page for reference
        }
        
        return output
    else:
        return {"error": "No text extracted from the PDF."}
        
# Function to test the extraction on a specific PDF
def test_extraction(pdf_path):
    """Test function to show what's being extracted"""
    print("Extracting content from PDF...")
    content = extract_content_from_pdf(pdf_path)
    
    
    print("\n--- EXTRACTED CONTENT SAMPLE (first 500 chars) ---")
    print(content[:500] + "..." if len(content) > 500 else content)
    
    print("\n--- SUMMARY AND KEY POINTS ---")
    summary, keypoints = summarize_text(content)
    print("Summary:", summary[:300] + "..." if len(summary) > 300 else summary)
    
    print("\nKey Points:")
    for i, point in enumerate(keypoints):
        print(f"{i+1}. {point[:100]}..." if len(point) > 100 else point)
    
    return {
        "content_sample": content[:1000] + "..." if len(content) > 1000 else content,
        "summary": summary,
        "keypoints": keypoints
    }