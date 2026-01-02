import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useParams, useNavigate } from "react-router-dom";
import { getRandomColor, getRandomName } from "../utils/random";

const SIGNALING_SERVERS = ["ws://localhost:3000/signaling"];

export const CodeEditor = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<any>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [doc] = useState(() => new Y.Doc());
  const [binding, setBinding] = useState<MonacoBinding | null>(null);
  const [peers, setPeers] = useState<string[]>([]);
  const [networkStatus, setNetworkStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    const newProvider = new WebrtcProvider(roomId, doc, {
      signaling: SIGNALING_SERVERS,
      // Use public STUN servers for now
      peerOpts: {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      },
    });

    setProvider(newProvider);
    setNetworkStatus("connecting");

    newProvider.on("status", (event: any) => {
      setNetworkStatus(event.connected ? "connected" : "disconnected");
    });

    newProvider.on("peers", (event: any) => {
      // y-webrtc specific event to track peers?
      // Actually we can check awareness states
      updatePeers();
    });

    const awareness = newProvider.awareness;
    awareness.setLocalStateField("user", {
      name: getRandomName(),
      color: getRandomColor(),
    });

    awareness.on("change", () => {
      updatePeers();
    });

    const updatePeers = () => {
      const states = Array.from(awareness.getStates().values()) as any[];
      setPeers(states.map((s) => s.user?.name || "Anonymous"));
    };

    return () => {
      newProvider.destroy();
      // Do not destroy doc here as it persists across re-renders in StrictMode
      // and is managed by useState. Garbage collection will handle it when component unmounts.
    };
  }, [roomId, doc, navigate]);

  useEffect(() => {
    if (provider && editor && !binding) {
      const type = doc.getText("monaco");
      const newBinding = new MonacoBinding(
        type,
        editor.getModel()!,
        new Set([editor]),
        provider.awareness
      );
      setBinding(newBinding);
    }

    return () => {
      if (binding) {
        binding.destroy();
        setBinding(null);
      }
    };
  }, [provider, binding, doc, editor]);

  const handleEditorDidMount: OnMount = (editor) => {
    setEditor(editor);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            &larr; Lobby
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
          defaultLanguage="typescript"
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
  );
};
