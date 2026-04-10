import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges 
} from 'reactflow';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  workflowId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (update: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[]) => void;
  setWorkflowId: (id: string | null) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
}

const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,

  // React Flow Handlers
  onNodesChange: (changes) => set({
    nodes: applyNodeChanges(changes, get().nodes),
  }),
  onEdgesChange: (changes) => set({
    edges: applyEdgeChanges(changes, get().edges),
  }),
  onConnect: (connection) => set({
    edges: addEdge(connection, get().edges),
  }),

  // State Setters
  setNodes: (update) => set((state) => ({
    nodes: typeof update === 'function' ? update(state.nodes) : update
  })),
  setEdges: (edges) => set({ edges }),
  setWorkflowId: (id) => set({ workflowId: id }),

  // CRITICAL: Robust Update Node Data
  // This ensures that when you update 'userMessage' or 'result', 
  // you don't accidentally wipe out 'isRunning' or 'type'.
  updateNodeData: (nodeId, newData) => set((state) => ({
    nodes: state.nodes.map((node) => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } } 
        : node
    ),
  })),
}));

export default useFlowStore;
