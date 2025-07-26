import torch
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.llms import HuggingFacePipeline
from langchain.chains import RetrievalQA
from transformers import BitsAndBytesConfig

print("Loading necessary components...")

# getting the reference to vectorDB
FAISS_INDEX_PATH = "faiss_index_demo"

#loading the same embedding model
embedding = SentenceTransformerEmbeddings(model_name = "all-MiniLM-L6-v2")

# loading FAISS VectorDB from local disk
vector_store =FAISS.load_local(FAISS_INDEX_PATH,embedding,allow_dangerous_deserialization=True)
print("VectorDB loaded successfully")

#loading LLM
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float32, # Use float32 for CPU compute
    bnb_4bit_use_double_quant=False,
)
print("Loading Mistral LLM")

llm = HuggingFacePipeline.from_model_id(
    model_id="mistralai/Mistral-7B-Instruct-v0.2",
    task="text-generation",
    device_map="auto",  # Automatically use GPU if available
    pipeline_kwargs={"max_new_tokens": 512, "top_k": 10, "temperature": 0.7},
    model_kwargs={
         "quantization_config": quantization_config, # Pass the config object here
        "torch_dtype": torch.float32, # Use float32 for CPU
    }
)

print("Mistral LLM loaded successfully")

#retrieving data from the vectorDB
retriever = vector_store.as_retriever(search_kwargs={'k':3})

#making a RetrievalQA chain

retrieval_qa = RetrievalQA.from_chain_type(
    llm = llm,
    chain_type="stuff",
    retriever = retriever
)

print("Chatbot ready to use")

while True:
    query = input("\nAsk a question about your notes: ")

    if query.lower() in ["exit", "quit"]:
        print("Goodbye!")
        break

    if not query.strip():
        continue

    print("thinking....")

    result = retrieval_qa(query)

    print("Answer:")
    print(result["result"])

    print("Sources used:")
    for doc in  result["source_documents"]:
        print(f"- {doc.page_content[:150]}....")