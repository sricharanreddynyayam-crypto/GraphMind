from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import networkx as nx
import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader

load_dotenv()
api_key = os.getenv("NVIDIA_API_KEY")

if not api_key:
    print("⚠️ WARNING: NVIDIA_API_KEY not found in .env file!")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=api_key
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

G = nx.Graph()
raw_data = {"nodes": [], "links": []}

try:
    with open("data.json", "r") as f:
        raw_data = json.load(f)
    for node in raw_data["nodes"]:
        G.add_node(node["id"], group=node["group"], type=node["type"])
    for link in raw_data["links"]:
        G.add_edge(link["source"], link["target"], relation=link["value"])
    print(f"✅ Graph Loaded! {G.number_of_nodes()} Nodes.")
except:
    print("ℹ️ Starting with empty graph.")

def extract_content(response):
    try:
        if isinstance(response, list):
            if len(response) == 0: return ""
            return extract_content(response[0])
        if hasattr(response, 'choices'):
            return response.choices[0].message.content
        if isinstance(response, dict):
            if 'choices' in response: return extract_content(response['choices'])
            if 'message' in response: return response['message']['content']
        return str(response)
    except:
        return ""

def find_json(text):
    try:
        start_index = text.find('{')
        if start_index == -1: return None
        end_index = text.rfind('}')
        if end_index == -1: return None
        return text[start_index : end_index + 1]
    except:
        return None

@app.get("/graph-data")
def get_graph():
    return raw_data

# NEW: Detect which node the question is about
def detect_relevant_node(user_message, graph_nodes):
    """
    Finds the most relevant node based on the user's question.
    Returns node_id or None.
    """
    user_lower = user_message.lower()
    
    # Direct match: Check if any node ID appears in the question
    for node in graph_nodes:
        node_id = node["id"]
        if node_id.lower() in user_lower:
            return node_id
    
    # Partial match: Check if keywords match
    for node in graph_nodes:
        node_id_words = node["id"].lower().split()
        for word in node_id_words:
            if len(word) > 3 and word in user_lower:
                return node["id"]
    
    return None

@app.post("/chat")
async def chat_with_graph(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message", "")
        node_id = data.get("node_id")
    except:
        return {"reply": "Error: Invalid JSON."}

    # Auto-detect node if not provided
    detected_node = None
    if not node_id:
        detected_node = detect_relevant_node(user_message, raw_data["nodes"])
        if detected_node:
            node_id = detected_node

    context_text = ""
    if node_id and node_id in G:
        neighbors = []
        for neighbor in G.neighbors(node_id):
            edge_data = G.get_edge_data(node_id, neighbor)
            relation = edge_data.get("relation", "connected_to")
            neighbors.append(f"- {node_id} {relation} {neighbor}")
        context_text = f"Focus Node: {node_id}\nConnections:\n" + "\n".join(neighbors)
    else:
        # Provide richer context when no node is selected
        node_list = [f"{n['id']} ({n['group']})" for n in raw_data["nodes"][:20]]
        context_text = f"Graph has {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.\nSample nodes: {', '.join(node_list)}"

    system_prompt = "You are GraphMind. Answer based strictly on the Context provided. Be concise and accurate."
    prompt = f"Context:\n{context_text}\n\nUser Question: {user_message}"

    try:
        completion = client.chat.completions.create(
            model="nvidia/llama-3.3-nemotron-super-49b-v1.5",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=300
        )
        
        raw_reply = extract_content(completion)
        
        # Extract thinking process if present
        thinking = ""
        reply = raw_reply
        think_match = re.search(r'<think>(.*?)</think>', raw_reply, flags=re.DOTALL)
        if think_match:
            thinking = think_match.group(1).strip()
            reply = re.sub(r'<think>.*?</think>', '', raw_reply, flags=re.DOTALL).strip()
        
        return {
            "reply": reply,
            "thinking": thinking,
            "focused_node": detected_node  # Tell frontend which node to focus on
        }

    except Exception as e:
        return {"reply": f"Error connecting to AI: {str(e)}", "thinking": "", "focused_node": None}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        reader = PdfReader(file.file)
        text = ""
        for i in range(min(2, len(reader.pages))):
            text += reader.pages[i].extract_text() or ""
        
        text = text.strip()
        if not text:
            return {"status": "error", "message": "No text found in PDF."}

        print(f"📄 Text Read ({len(text)} chars). Sending to AI...")

        system_prompt = """
        You are a strict JSON API.
        Task: Extract knowledge graph from text.
        Constraint 1: Output ONLY valid JSON.
        Constraint 2: Do NOT output <think> tags.
        Constraint 3: Do NOT explain anything.
        Format:
        {
            "nodes": [{"id": "Name", "group": "Type", "type": "Type"}],
            "links": [{"source": "Name", "target": "Name", "value": "Relation"}]
        }
        """
        
        completion = client.chat.completions.create(
            model="nvidia/llama-3.3-nemotron-super-49b-v1.5",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Text: {text[:3000]}"}
            ],
            temperature=0.1,
            max_tokens=2048
        )

        ai_response = extract_content(completion)
        ai_response = re.sub(r'<think>.*?</think>', '', ai_response, flags=re.DOTALL).strip()
        clean_json_str = find_json(ai_response)
        
        if not clean_json_str:
             print(f"❌ Failed. Raw Output: {ai_response[:200]}...")
             return {"status": "error", "message": "AI response was incomplete."}

        print(f"🤖 JSON Found: {clean_json_str[:50]}...")

        try:
            new_data = json.loads(clean_json_str)
        except json.JSONDecodeError as e:
            print(f"❌ JSON Error: {e}")
            return {"status": "error", "message": "AI returned invalid JSON."}

        count = 0
        for node in new_data.get("nodes", []):
            if node["id"] not in G:
                G.add_node(node["id"], group=node["group"], type=node["type"])
                if not any(n["id"] == node["id"] for n in raw_data["nodes"]):
                    raw_data["nodes"].append(node)
                    count += 1

        for link in new_data.get("links", []):
            G.add_edge(link["source"], link["target"], relation=link["value"])
            raw_data["links"].append(link)

        print(f"✅ Success! Added {count} nodes.")
        return {"status": "success", "new_nodes": count}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}
