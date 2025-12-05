# 🧠 GraphMind: AI-Powered Knowledge Graph Analysis

**GraphMind** is an intelligent knowledge graph visualization and analysis platform that leverages AI to extract, analyze, and explore complex relationships from unstructured documents.

## 🎯 Features

- **📊 Interactive 3D Graph Visualization** – Explore knowledge graphs in an immersive 3D environment powered by Three.js
- **🤖 AI-Powered Entity Extraction** – Automatically extract entities and relationships from PDF documents using NVIDIA Nemotron LLM
- **💬 Intelligent Chat Interface** – Ask questions about your graph with context-aware AI responses
- **🔍 Advanced Query System** – Analyze node relationships and connections with natural language queries
- **🧠 Reasoning Display** – View AI's internal reasoning process for transparency and debugging
- **⚡ Real-time Updates** – Dynamic graph updates as new data is processed

## 🏗️ Architecture

```
GraphMind/
├── backend/          # FastAPI server & graph processing
│   ├── main.py      # API endpoints and AI integration
│   ├── generate_data.py   # Sample data generation
│   └── data.json    # Knowledge graph data store
├── frontend/        # React + Vite + Three.js
│   ├── src/
│   │   ├── App.jsx  # Main UI component
│   │   └── main.jsx # Entry point
│   └── package.json # Frontend dependencies
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **NVIDIA API Key** (for Nemotron LLM access)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Generate sample data (optional)
python generate_data.py

# Run the server
uvicorn main:app --reload
```

Backend runs on: **http://127.0.0.1:8000**

API Documentation: **http://127.0.0.1:8000/docs**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

## 📡 API Endpoints

### `GET /graph-data`
Returns the current knowledge graph data.

```json
{
  "nodes": [
    {"id": "Entity1", "group": "Category", "type": "Type"}
  ],
  "links": [
    {"source": "Entity1", "target": "Entity2", "value": "relationship"}
  ]
}
```

### `POST /chat`
Send a query about the graph with optional node context.

**Request:**
```json
{
  "message": "What is connected to this node?",
  "node_id": "Entity1"
}
```

**Response:**
```json
{
  "reply": "Entity1 is connected to Entity2 through a relationship..."
}
```

### `POST /upload-pdf`
Extract entities and relationships from a PDF document.

**Request:** Multipart form with `file` field containing PDF

**Response:**
```json
{
  "status": "success",
  "new_nodes": 15
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
```

See `.env.example` for all available options.

## 🛠️ Development

### Running in Development Mode

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Build for Production

**Backend:**
```bash
# No build step needed - deploy uvicorn server directly
```

**Frontend:**
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Linting & Quality

```bash
cd frontend
npm run lint
```

## 📚 How It Works

1. **PDF Upload** → Extract text from documents
2. **AI Processing** → Use Nemotron LLM to identify entities and relationships
3. **Graph Construction** → Build NetworkX graph from extracted data
4. **Visualization** → Render interactive 3D graph in React
5. **Query & Analysis** → Chat interface for graph exploration with AI assistance

## 🔐 Security Considerations

- API CORS is set to allow all origins (`*`) in development. **Restrict this in production.**
- API keys should never be committed to version control. Use `.env` files.
- Validate and sanitize all user inputs before processing.
- Consider rate limiting for production deployments.

## 📦 Dependencies

### Backend
- **FastAPI** – Modern Python web framework
- **NetworkX** – Graph data structures and algorithms
- **OpenAI SDK** – Integration with Nemotron LLM
- **pypdf** – PDF text extraction
- **python-dotenv** – Environment variable management

### Frontend
- **React 19** – UI library
- **Vite** – Build tool
- **Three.js (via react-force-graph-3d)** – 3D visualization
- **react-markdown** – Markdown rendering

## 🐛 Troubleshooting

### PDF Upload Returns "Expecting value: line 1 column 1"
The AI response may contain non-JSON content like `<think>` tags. The backend now strips these automatically. If the issue persists, check:
- NVIDIA API key is valid
- PDF has extractable text (not scanned image-only)
- Check backend logs for detailed error messages

### Graph Data Not Loading
- Ensure backend is running (`http://127.0.0.1:8000/docs`)
- Check browser console for network errors
- Verify CORS settings are correct

### 3D Graph Not Rendering
- Ensure WebGL is supported in your browser
- Try a different browser (Chrome, Firefox, Edge)
- Clear browser cache and restart dev server

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See `CONTRIBUTING.md` for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Three.js Documentation](https://threejs.org/)
- [NetworkX Documentation](https://networkx.org/)
- [NVIDIA API Documentation](https://docs.nvidia.com/cloud/nvapicloud/)

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Made with ❤️ using React, FastAPI, and AI**
