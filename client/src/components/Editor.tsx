import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useParams, useNavigate } from "react-router-dom";
import { getRandomColor, getRandomName } from "../utils/random";

const getSignalingUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/signaling`;
};

const SIGNALING_SERVERS = [getSignalingUrl()];

export const CodeEditor = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<any>(null);
  const [doc] = useState(() => new Y.Doc());
  const [peers, setPeers] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  
  const providerRef = useRef<WebrtcProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const executeCode = async () => {
    if (!editor) return;
    
    setIsExecuting(true);
    const code = editor.getValue();
    
    try {
      const response = await fetch('http://18.210.12.242:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const result = await response.json();
      
      if (result.success) {
        let output = '';
        if (result.logs && result.logs.length > 0) {
          output = result.logs.join('\n');
        }
        if (result.result !== 'undefined' && result.logs.length === 0) {
          output = result.result;
        }
        setOutput(output || '');
        
        // Sync output to all users
        if (providerRef.current) {
          const outputMap = doc.getMap('output');
          outputMap.set('result', output || '');
          outputMap.set('timestamp', Date.now());
        }
      } else {
        const errorMsg = `Error: ${result.error}`;
        setOutput(errorMsg);
        
        // Sync error to all users
        if (providerRef.current) {
          const outputMap = doc.getMap('output');
          outputMap.set('result', errorMsg);
          outputMap.set('timestamp', Date.now());
        }
      }
    } catch (error) {
      setOutput(`❌ Network error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    const provider = new WebrtcProvider(roomId, doc, {
      signaling: SIGNALING_SERVERS,
      peerOpts: {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      },
    });

    providerRef.current = provider;
    setNetworkStatus("connecting");

    const handleStatus = (event: any) => {
      setNetworkStatus(event.connected ? "connected" : "disconnected");
    };

    const updatePeers = () => {
      const states = Array.from(provider.awareness.getStates().values()) as any[];
      setPeers(states.map((s) => s.user?.name || "Anonymous"));
    };

    provider.on("status", handleStatus);
    
    const awareness = provider.awareness;
    awareness.setLocalStateField("user", {
      name: getRandomName(),
      color: getRandomColor(),
    });

    awareness.on("change", updatePeers);

    // Listen for output changes
    const outputMap = doc.getMap('output');
    const handleOutputChange = () => {
      const result = outputMap.get('result');
      if (result !== undefined) {
        setOutput(result);
      }
    };
    outputMap.observe(handleOutputChange);

    return () => {
      awareness.off("change", updatePeers);
      outputMap.unobserve(handleOutputChange);
      provider.off("status", handleStatus);
      provider.destroy();
      providerRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    if (!providerRef.current || !editor || bindingRef.current) return;

    const type = doc.getText("monaco");
    const binding = new MonacoBinding(
      type,
      editor.getModel()!,
      new Set([editor]),
      providerRef.current.awareness
    );
    bindingRef.current = binding;

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editor]);

  const handleEditorDidMount: OnMount = (editor) => {
    setEditor(editor);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex flex-col flex-1">
        <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              ← Lobby
            </button>
            <h1 className="text-xl font-bold">Room: {roomId}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                networkStatus === "connected"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {networkStatus.toUpperCase()}
            </span>
            <button
              onClick={executeCode}
              disabled={isExecuting}
              className="px-4 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded text-sm transition-colors"
            >
              {isExecuting ? "Running..." : "▶ Run"}
            </button>
          </div>
          <div className="flex -space-x-2">
            {peers.map((peer, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs border-2 border-gray-800"
                title={peer}
              >
                {peer.charAt(0)}
              </div>
            ))}
            {peers.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs border-2 border-gray-800">
                +{peers.length - 5}
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 w-full relative">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
            }}
          />
        </div>
      </div>
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold">Output</h3>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <pre className="text-sm whitespace-pre-wrap text-green-400 font-mono">
            {output || "// Click 'Run' to execute code"}
          </pre>
        </div>
      </div>
    </div>
  );
};
