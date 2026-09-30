from typing import List

def chunk_text(text: str, chunk_size: int = 700, chunk_overlap: int = 120) -> List[str]:
    """
    Split text into clean contextual chunks respecting paragraph and sentence boundaries.
    """
    cleaned = text.strip()
    if not cleaned:
        return []

    # If the text is shorter than chunk_size, return it as a single chunk
    if len(cleaned) <= chunk_size:
        return [cleaned]

    chunks = []
    start = 0
    text_length = len(cleaned)

    while start < text_length:
        end = start + chunk_size

        if end >= text_length:
            chunk = cleaned[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Look for natural breaking points (paragraph, newline, period, question mark, exclamation)
        slice_zone = cleaned[start:end]
        break_pos = -1

        for delimiter in ('\n\n', '\n', '. ', '? ', '! '):
            pos = slice_zone.rfind(delimiter)
            if pos != -1 and pos > chunk_size // 3:
                break_pos = start + pos + len(delimiter)
                break

        if break_pos != -1:
            chunk = cleaned[start:break_pos].strip()
            if chunk:
                chunks.append(chunk)
            start = max(start + 1, break_pos - chunk_overlap)
        else:
            chunk = cleaned[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start = end - chunk_overlap

    return chunks
