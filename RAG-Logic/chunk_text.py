import re
from langchain.text_splitter import RecursiveCharacterTextSplitter


def chunker_text(text, max_len=300):
    """
    Takes a single block of text and splits it into smaller, overlapping chunks.

    This function is designed to be the definitive chunker for the project.

    Args:
        text: A string containing the full text from the OCR'd notes.

    Returns:
        A list of strings, where each string is a manageable chunk of text,
        ready to be embedded.
    """



    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500,chunk_overlap=100,length_function=len)
    chunks = text_splitter.split_text(text)
    return chunks
