import base64
import io
import re

def process_attachment(attachment, vision_capable=False):
    """
    Parses a base64 encoded attachment.
    Returns a dictionary with 'type' ('text' or 'image') and 'content' (extracted text or raw base64 url).
    """
    data_url = attachment.get("data_url", "")
    mime_type = attachment.get("mime_type", "")
    att_type = attachment.get("type", "")
    name = attachment.get("name", "")

    # Extract base64 part
    b64_data = ""
    match = re.match(r'^data:(.+?);base64,(.+)$', data_url)
    if match:
        b64_data = match.group(2)
    else:
        return {"type": "error", "content": "Invalid data url format."}
        
    try:
        raw_bytes = base64.b64decode(b64_data)
    except Exception:
        return {"type": "error", "content": "Failed to decode base64 data."}

    if att_type == "pdf":
        try:
            from pypdf import PdfReader
            pdf = PdfReader(io.BytesIO(raw_bytes))
            text = f"--- START OF DOCUMENT: {name} ---\n"
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            text += f"--- END OF DOCUMENT ---"
            
            if len(text.strip()) < 50:
                return {"type": "error", "content": "I couldn't extract readable text from this PDF. Please upload a text-based PDF or provide a screenshot of the relevant page."}
                
            # Limit context size safely
            return {"type": "text", "content": text[:50000]}
        except ImportError:
            return {"type": "error", "content": "PDF parsing is not installed on the backend."}
        except Exception as e:
            return {"type": "error", "content": f"Failed to parse PDF: {str(e)}"}
            
    elif att_type == "doc":
        if "wordprocessingml" in mime_type or name.endswith(".docx"):
            try:
                import docx
                doc = docx.Document(io.BytesIO(raw_bytes))
                text = f"--- START OF DOCUMENT: {name} ---\n"
                for para in doc.paragraphs:
                    text += para.text + "\n"
                text += f"--- END OF DOCUMENT ---"
                return {"type": "text", "content": text[:50000]}
            except ImportError:
                return {"type": "error", "content": "DOCX parsing is not installed on the backend."}
            except Exception as e:
                return {"type": "error", "content": f"Failed to parse DOCX: {str(e)}"}
        else:
            return {"type": "error", "content": "Only .docx format is supported. Please convert your .doc file to .docx or .pdf."}
            
    elif att_type == "image":
        if not vision_capable:
            return {"type": "error", "content": "The current Qumi model does not support image analysis. Please use a vision-capable Qumi model or upload the circuit as PDF/text."}
        
        return {"type": "image", "content": data_url}
        
    return {"type": "error", "content": "Unsupported attachment type."}
