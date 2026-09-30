import io
from apps.references.chunker import chunk_text
from apps.references.extractors import extract_text_from_file

def test_chunk_text():
    sample_text = (
        "First paragraph introducing narrative theory and dramatic arcs.\n\n"
        "Second paragraph exploring character agency, moral wounds, and internal conflicts. "
        "Characters must experience pressure that forces them out of passive habits.\n\n"
        "Third paragraph concluding with the climax and ultimate choice."
    )
    chunks = chunk_text(sample_text, chunk_size=150, chunk_overlap=30)
    assert len(chunks) >= 2
    for c in chunks:
        assert len(c) > 0

def test_extract_text_txt():
    file_obj = io.BytesIO(b"Hello world from reference file.")
    text = extract_text_from_file(file_obj, "test.txt")
    assert text == "Hello world from reference file."
