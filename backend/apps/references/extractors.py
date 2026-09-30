import io
from pathlib import Path
from pypdf import PdfReader
import docx
from apps.common.exceptions import ApplicationError

def extract_text_from_file(file_obj, filename: str) -> str:
    """Extract clean raw text from TXT, MD, PDF, or DOCX files."""
    ext = Path(filename).suffix.lower()

    try:
        if ext in ('.txt', '.md', '.markdown'):
            content = file_obj.read()
            if isinstance(content, bytes):
                return content.decode('utf-8', errors='replace').strip()
            return str(content).strip()

        elif ext == '.pdf':
            reader = PdfReader(file_obj)
            extracted_pages = []
            for page in reader.pages:
                text = page.extract_text() or ''
                if text.strip():
                    extracted_pages.append(text.strip())
            return "\n\n".join(extracted_pages)

        elif ext in ('.docx', '.doc'):
            doc = docx.Document(file_obj)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)

        else:
            raise ApplicationError(
                message=f"Unsupported file extension '{ext}'. Supported formats: .txt, .md, .pdf, .docx",
                code="UNSUPPORTED_FILE_FORMAT",
                status_code=400
            )
    except ApplicationError:
        raise
    except Exception as exc:
        raise ApplicationError(
            message=f"Failed to extract text from file '{filename}': {str(exc)}",
            code="TEXT_EXTRACTION_FAILED",
            status_code=400
        )
