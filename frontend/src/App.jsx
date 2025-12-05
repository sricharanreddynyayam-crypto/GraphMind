import { useState, useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import ReactMarkdown from 'react-markdown';

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "System", text: "✅ **System Online.** Upload a PDF to visualize knowledge.", thought: null }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState({});
  
  const fgRef = useRef();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchGraph = () => {
    fetch('http://127.0.0.1:8000/graph-data')
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchGraph(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, isLoading]);

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const newHistory = [...chatHistory, { sender: "User", text: chatMessage, thought: null }];
    setChatHistory(newHistory);
    setChatMessage("");
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, node_id: selectedNode ? String(selectedNode.id) : null })
      });
      const data = await res.json();
      
      let thought = null;
      let answer = data.reply;
      const thinkMatch = data.reply.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        thought = thinkMatch[1].trim();
        answer = data.reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      }
      if (!answer) answer = "Analysis complete.";

      setChatHistory(prev => [...prev, { sender: "AI", text: answer, thought: thought }]);
    } catch (err) {
      console.error(err); 
      setChatHistory(prev => [...prev, { sender: "System", text: "Connection Failed.", thought: null }]);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setChatHistory(prev => [...prev, { sender: "System", text: `📄 **Processing ${file.name}...** Please wait.` }]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('http://127.0.0.1:8000/upload-pdf', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.status === "success") {
        setChatHistory(prev => [...prev, { sender: "System", text: `✅ **Success!** Mapped ${data.new_nodes} new concepts from PDF.` }]);
        fetchGraph(); 
      } else {
        setChatHistory(prev => [...prev, { sender: "System", text: `❌ Error: ${data.message}` }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: "System", text: "❌ Upload Failed." }]);
    }
    setIsUploading(false);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    fgRef.current.cameraPosition({ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, node, 2000);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#050505", position: "relative", overflow: "hidden", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#050505"
        onNodeClick={handleNodeClick}
        nodeRelSize={6}
        linkOpacity={0.3}
      />

      <div style={{ position: 'absolute', top: 25, left: 25, pointerEvents: 'none', zIndex: 100 }}>
        <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', textShadow: '0 0 10px #00ff88' }}>
          GRAPH<span style={{color: '#00ff88'}}>MIND</span>
        </div>
        <div style={{ fontSize: '10px', color: '#00ff88', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{width: '8px', height: '8px', background: isUploading ? '#ffaa00' : '#00ff88', borderRadius: '50%', boxShadow: '0 0 5px #00ff88'}}></span>
          {isUploading ? "READING PDF..." : "SYSTEM OPERATIONAL"}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 25, right: 30, zIndex: 100 }}>
        <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".pdf" onChange={handleFileUpload} />
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading}
          style={{
            background: isUploading ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0, 255, 136, 0.1)',
            border: `1px solid ${isUploading ? '#ffaa00' : '#00ff88'}`,
            color: isUploading ? '#ffaa00' : '#00ff88',
            padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold',
            backdropFilter: 'blur(5px)', transition: 'all 0.3s'
          }}
        >
          {isUploading ? "⚡ PROCESSING..." : "📄 UPLOAD PDF"}
        </button>
      </div>

      {selectedNode && (
        <div style={{ position: 'absolute', top: 100, left: 25, width: '280px', background: 'rgba(0, 20, 40, 0.7)', borderLeft: '4px solid #00ff88', backdropFilter: 'blur(10px)', padding: '25px', color: 'white', borderRadius: '0 12px 12px 0' }}>
          <div style={{fontSize: '10px', color: '#00ff88', letterSpacing: '1px', marginBottom: '10px'}}>TARGET ACQUIRED</div>
          <h2 style={{margin: '0 0 15px 0', fontSize: '22px'}}>{selectedNode.id}</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <div style={{background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px'}}>
              <div style={{fontSize: '9px', color: '#aaa'}}>GROUP</div>
              <div style={{fontWeight: 'bold', color: '#00aaff'}}>{selectedNode.group}</div>
            </div>
            <div style={{background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px'}}>
              <div style={{fontSize: '9px', color: '#aaa'}}>TYPE</div>
              <div style={{fontWeight: 'bold', color: '#ff0088'}}>{selectedNode.type || "N/A"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 30, right: 30, width: '420px', height: '600px', background: 'rgba(5, 10, 15, 0.85)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '16px', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(0, 255, 136, 0.1)', color: '#00ff88', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚡ INTELLIGENCE FEED</span>
          <span style={{fontSize: '10px', opacity: 0.7}}>V 1.0.9</span>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.sender === "User" ? "flex-end" : "flex-start", maxWidth: '90%' }}>
              <div style={{ fontSize: '10px', color: msg.sender === "User" ? '#00aaff' : '#00ff88', marginBottom: '4px', textAlign: msg.sender === "User" ? 'right' : 'left', fontWeight: 'bold' }}>{msg.sender.toUpperCase()}</div>
              <div style={{ background: msg.sender === "User" ? 'rgba(0, 170, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: msg.sender === "User" ? '1px solid rgba(0, 170, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', padding: '12px 16px', borderRadius: '12px', color: '#e0e0e0', fontSize: '14px', lineHeight: '1.6' }}>
                <ReactMarkdown components={{strong: ({...props}) => <span style={{color: '#fff', fontWeight: '900'}} {...props} />}}>{msg.text}</ReactMarkdown>
                {msg.thought && (
                  <div style={{marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px'}}>
                    <div onClick={() => setExpandedThoughts(p => ({...p, [idx]: !p[idx]}))} style={{fontSize: '11px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}><span>{expandedThoughts[idx] ? "▼ Hide Reasoning" : "▶ Show Neural Process"}</span></div>
                    {expandedThoughts[idx] && <div style={{marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '12px', color: '#aaa', fontStyle: 'italic', borderLeft: '2px solid #444'}}>{msg.thought}</div>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div style={{ alignSelf: 'flex-start', padding: '10px', color: '#00ff88', fontSize: '12px' }}>⚡ AI Thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', padding: '8px 8px 8px 20px' }}>
            <input style={{ flexGrow: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '14px', outline: 'none' }} value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChat()} placeholder="Ask GraphMind..." />
            <button onClick={handleChat} style={{ background: '#00ff88', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer' }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
