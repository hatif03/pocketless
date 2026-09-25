"use client";

type Node = { id: string; label: string; kind: "topic" | "entity"; weight: number };
type Edge = { source: string; target: string; weight: number };

const SIZE = 480;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 60;

export function MindMap({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        No topics yet — the graph fills in after your first episode.
      </p>
    );
  }

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    positions.set(node.id, {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    });
  });

  const maxWeight = Math.max(...nodes.map((n) => n.weight), 1);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[480px] mx-auto">
      {edges.map((edge, index) => {
        const from = positions.get(edge.source);
        const to = positions.get(edge.target);
        if (!from || !to) return null;
        return (
          <line
            key={index}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            className="text-muted-foreground"
            strokeOpacity={0.15 + 0.1 * edge.weight}
            strokeWidth={1 + edge.weight}
          />
        );
      })}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const radius = 6 + (14 * node.weight) / maxWeight;
        return (
          <g key={node.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius}
              className={node.kind === "topic" ? "fill-primary" : "fill-chart-2"}
              fillOpacity={0.85}
            />
            <text
              x={pos.x}
              y={pos.y + radius + 14}
              textAnchor="middle"
              className="fill-foreground text-[10px]"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
