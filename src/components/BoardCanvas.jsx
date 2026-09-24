import { useState } from "react";

function BoardCanvas({ tool, objects, setObjects, commit }) {
  const [startPoint, setStartPoint] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);

  const getMousePosition = (event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event) => {
  if (tool === "text") {
    const point = getMousePosition(event);
    const content = window.prompt("Enter text:");
    if (!content) return;

    commit((previousObjects) => [
      ...previousObjects,
      {
        id: crypto.randomUUID(),
        type: "text",
        x: point.x,
        y: point.y,
        content,
      },
    ]);
    return;
  }

  if (tool !== "rectangle" && tool !== "circle") return;

  event.currentTarget.setPointerCapture(event.pointerId);
  const point = getMousePosition(event);
  setStartPoint(point);
};

 const handlePointerMove = (event) => {
  if (dragOffset !== null && selectedId !== null) {
    const point = getMousePosition(event);
    const newX = point.x - dragOffset.x;
    const newY = point.y - dragOffset.y;

    setObjects((previousObjects) =>
      previousObjects.map((object) => {
        if (object.id !== selectedId) return object;

        if (object.type === "circle") {
          return { ...object, cx: newX, cy: newY };
        }
        // rectangle and text both use x/y
        return { ...object, x: newX, y: newY };
      })
    );
    return;
  }

  if (!startPoint) return;

  const point = getMousePosition(event);

  if (tool === "rectangle") {
    const preview = {
      id: "preview",
      type: "rectangle",
      x: Math.min(startPoint.x, point.x),
      y: Math.min(startPoint.y, point.y),
      width: Math.abs(point.x - startPoint.x),
      height: Math.abs(point.y - startPoint.y),
      isPreview: true,
    };
    setObjects((prev) => [...prev.filter((o) => !o.isPreview), preview]);
    return;
  }

  if (tool === "circle") {
    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    const preview = {
      id: "preview",
      type: "circle",
      cx: startPoint.x,
      cy: startPoint.y,
      r: radius,
      isPreview: true,
    };
    setObjects((prev) => [...prev.filter((o) => !o.isPreview), preview]);
    return;
  }
};

  const handlePointerUp = (event) => {
    if (dragOffset !== null) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      commit((current) => current); // finalize the drag as one undo step
      setDragOffset(null);
      return;
    }

    if (!startPoint) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    // Convert preview into a real object, and save it as one undo step
    commit((previousObjects) =>
      previousObjects.map((object) =>
        object.isPreview
          ? { ...object, id: crypto.randomUUID(), isPreview: false }
          : object
      )
    );

    setStartPoint(null);
  };

  return (
    <svg
      width="1000"
      height="600"
      style={{
        border: "1px solid black",
        marginTop: "20px",
        background: "#f8f8f8",
        cursor: tool === "rectangle" ? "crosshair" : "default",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
     {objects.map((object) => {
 if (object.type === "rectangle") {
  return (
    <rect
      key={object.id}
      x={object.x}
      y={object.y}
      width={object.width}
      height={object.height}
      fill="lightblue"
      stroke={object.id === selectedId ? "blue" : "black"}
      onPointerDown={(event) => {
        if (tool !== "select") return;
        event.stopPropagation();

        const svg = event.currentTarget.ownerSVGElement;
        svg.setPointerCapture(event.pointerId);

        const rect = svg.getBoundingClientRect();
        const point = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        setSelectedId(object.id);
        setDragOffset({
          x: point.x - object.x,
          y: point.y - object.y,
        });
      }}
    />
  );
}

  if (object.type === "circle") {
    return (
      <circle
        key={object.id}
        cx={object.cx}
        cy={object.cy}
        r={object.r}
        fill="lightgreen"
        stroke={object.id === selectedId ? "blue" : "black"}
        onPointerDown={(event) => {
          if (tool !== "select") return;
          event.stopPropagation();

          const svg = event.currentTarget.ownerSVGElement;
          svg.setPointerCapture(event.pointerId);

          const rect = svg.getBoundingClientRect();
          const point = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };

          setSelectedId(object.id);
          setDragOffset({
            x: point.x - object.cx,
            y: point.y - object.cy,
          });
        }}
      />
    );
  }

  if (object.type === "text") {
    return (
      <text
        key={object.id}
        x={object.x}
        y={object.y}
        fontSize="18"
        fill={object.id === selectedId ? "blue" : "black"}
        onPointerDown={(event) => {
          if (tool !== "select") return;
          event.stopPropagation();

          const svg = event.currentTarget.ownerSVGElement;
          svg.setPointerCapture(event.pointerId);

          const rect = svg.getBoundingClientRect();
          const point = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };

          setSelectedId(object.id);
          setDragOffset({
            x: point.x - object.x,
            y: point.y - object.y,
          });
        }}
      >
        {object.content}
      </text>
    );
  }

  return null;
})}
    </svg>
  );
}

export default BoardCanvas;