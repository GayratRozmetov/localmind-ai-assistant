"use client";
import { useEffect, useRef, useState } from "react";
type Message = { role: "user" | "assistant"; content: string };
type Engine = { chat: { completions: { create: (options: unknown) => Promise<{ choices: { message: { content: string } }[] }> } } };
const modes = [
  ["Customer Reply", "Write a helpful, warm and professional customer response."],
  ["Product Copy", "Create persuasive, clear e-commerce product copy."],
  ["Social Caption", "Write a concise social media caption with a strong hook."],
  ["Business Email", "Draft a professional business email."],
  ["Translate", "Translate naturally between Turkish, English and Russian as requested."],
];
export default function Home() {
  const engine = useRef<Engine | null>(null);
  const [mode, setMode] = useState(0), [messages, setMessages] = useState<Message[]>([]), [input, setInput] = useState("");
  const [status, setStatus] = useState("AI model not loaded"), [progress, setProgress] = useState(0), [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("localmind-chat"); if (saved) setMessages(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem("localmind-chat", JSON.stringify(messages)); }, [messages]);
  async function loadModel() {
    if (ready || busy) return; setBusy(true); setStatus("Preparing private AI model...");
    try {
      const webllm = await import("@mlc-ai/web-llm");
      const created = await webllm.CreateMLCEngine("SmolLM2-360M-Instruct-q4f16_1-MLC", { initProgressCallback: (r) => { setProgress(Math.round(r.progress * 100)); setStatus(r.text || "Downloading model..."); } });
      engine.current = created as unknown as Engine; setReady(true); setProgress(100); setStatus("Private AI is ready");
    } catch { setStatus("WebGPU is unavailable. Try the latest Chrome or Edge."); } finally { setBusy(false); }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (!input.trim() || !engine.current || busy) return;
    const user: Message = { role: "user", content: input.trim() }, history = [...messages, user];
    setMessages(history); setInput(""); setBusy(true); setStatus("Thinking locally...");
    try {
      const response = await engine.current.chat.completions.create({ messages: [{ role: "system", content: `You are LocalMind, an expert business assistant. ${modes[mode][1]} Give practical, ready-to-use output. Never claim internet access.` }, ...history.slice(-8)], temperature: 0.7, max_tokens: 450 });
      setMessages([...history, { role: "assistant", content: response.choices[0].message.content }]); setStatus("Private AI is ready");
    } catch { setStatus("Generation stopped. Please try again."); } finally { setBusy(false); }
  }
  return <main className="app"><aside><div className="logo"><i>✦</i> LocalMind</div><p className="side-label">WORKSPACE</p>
    <nav>{modes.map((item,index)=><button key={item[0]} className={mode===index?"active":""} onClick={()=>setMode(index)}><span>{["↗","◇","◎","□","文"][index]}</span>{item[0]}</button>)}</nav>
    <div className="privacy"><b>◉ 100% PRIVATE</b><p>Your prompts and conversations never leave this device.</p></div><div className="user-card"><div>GR</div><span><b>Gayrat</b><small>Local workspace</small></span></div>
  </aside><section className="workspace"><header><div><span>AI BUSINESS ASSISTANT</span><h1>{modes[mode][0]}</h1><p>{modes[mode][1]}</p></div><button className="clear" onClick={()=>setMessages([])}>Clear chat</button></header>
    {!ready&&<section className="loader"><div className="orb">✦</div><span>ON-DEVICE INTELLIGENCE</span><h2>Your private AI,<br/>right inside the browser.</h2><p>No API key. No subscription. The small language model downloads once and runs directly on your device.</p>
      <button onClick={loadModel} disabled={busy}>{busy?"Loading model...":"Load free AI model"} <b>→</b></button><div className="progress"><i style={{width:`${progress}%`}}/></div><small>{status}{progress?` · ${progress}%`:""}</small>
      <div className="benefits"><div><b>◫ Local processing</b><p>Prompts stay on your device</p></div><div><b>∞ Unlimited use</b><p>No per-message charges</p></div><div><b>⚡ WebGPU powered</b><p>Runs best in Chrome or Edge</p></div></div></section>}
    {ready&&<section className="chat">{messages.length===0?<div className="welcome"><div>✦</div><h2>What can I create for you?</h2><p>Choose a task or describe exactly what your business needs.</p><div className="suggestions">{["Reply to a customer asking for a discount","Write a product description for an oversized hoodie","Create an Instagram caption for a new collection"].map(x=><button key={x} onClick={()=>setInput(x)}>{x}<span>↗</span></button>)}</div></div>:<div className="messages">{messages.map((m,i)=><div key={i} className={m.role}><b>{m.role==="user"?"YOU":"✦ LOCALMIND"}</b><p>{m.content}</p></div>)}</div>}</section>}
    <form onSubmit={send}><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={ready?"Tell LocalMind what you need...":"Load the AI model to start chatting"} disabled={!ready||busy}/><button disabled={!ready||busy||!input.trim()}>↑</button><small>{ready?"AI runs locally · Enter your request and send":"Your conversations are stored only in this browser"}</small></form>
  </section></main>;
}
