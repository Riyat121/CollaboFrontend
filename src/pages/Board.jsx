import { useState, useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import BoardCanvas from "../components/BoardCanvas";

function Board() {
  const [tool, setTool] = useState("select");
  const [objects, setObjects] = useState([]);

  const yMapRef = useRef(null);
  const ydocRef = useRef(null);
  const undoManagerRef = useRef(null);
  const objectsRef = useRef([]); // always mirrors latest `objects`

  // Keep objectsRef in sync with state on every render
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      "collab-board-room",
      ydoc
    );

    const yObjects = ydoc.getMap("objects");
    yMapRef.current = yObjects;

    const undoManager = new Y.UndoManager(yObjects, {
      trackedOrigins: new Set([ydoc.clientID]),
    });
    undoManagerRef.current = undoManager;

    const syncLocalState = () => {
      setObjects(Array.from(yObjects.values()));
    };

    yObjects.observe(syncLocalState);
    syncLocalState();

    return () => {
      yObjects.unobserve(syncLocalState);
      undoManager.destroy();
      provider.disconnect();
    };
  }, []);

  const commit = (updater) => {
    const yObjects = yMapRef.current;
    const ydoc = ydocRef.current;
    const current = objectsRef.current; // ← local state (includes the in-progress preview), not Yjs
    const next = typeof updater === "function" ? updater(current) : updater;

    yObjects.doc.transact(() => {
      yObjects.forEach((_, key) => yObjects.delete(key));
      next.forEach((obj) => yObjects.set(obj.id, obj));
    }, ydoc.clientID);
  };

  const undo = () => {
    undoManagerRef.current?.undo();
  };

  const redo = () => {
    undoManagerRef.current?.redo();
  };

  return (
    <div>
      <h1>CollabBoard</h1>
      <div>
        <button onClick={() => setTool("select")}>Select</button>
        <button onClick={() => setTool("rectangle")}>Rectangle</button>
        <button onClick={() => setTool("circle")}>Circle</button>
        <button onClick={() => setTool("text")}>Text</button>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>
      <BoardCanvas
        tool={tool}
        objects={objects}
        setObjects={setObjects}
        commit={commit}
      />
    </div>
  );
}

export default Board;