import os
import shutil
from chunk_text import chunker_text

print("Receiving prechunked data")

with open("demo_text.txt") as f:
    raw_text = f.read()

CHUNKS = chunker_text(raw_text)

print("Text divided into chunks")
print(f"First chunk is {CHUNKS[0]}" )

#deleting any old index on same indices
if os.path.exists("faiss_index_demo"):
    shutil.rmtree("faiss_index_demo")


# MAIN TASK OF EMBEDDING AND STORING

from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS

print("Loading the embedding model (all-MiniLM-L6-v2)...")
embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = FAISS.from_texts(texts=CHUNKS, embedding=embeddings)
print("FAISS vector store created successfully in memory.")
print("-" * 30)

print("\n[DEMO 1: Saving the Index to Disk]")
vector_store.save_local("faiss_index_demo")

print("\n[DEMO : A Chunk and its Vector]")
auth_chunk = CHUNKS[2] # We know the auth chunk is the 3rd one
auth_vector = embeddings.embed_query(auth_chunk)
print(f"Original Text Chunk:\n'{auth_chunk}'")
print(f"\nFirst 5 elements of its vector: {auth_vector[:5]}")
print("-" * 15)