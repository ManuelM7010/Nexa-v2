import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Highlighter,
  Eraser,
  Type,
  Square,
  Circle as CircleIcon,
  ArrowRight,
  Table as TableIcon,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  Grid,
  Plus,
  X,
  Move,
  StickyNote,
  DollarSign,
  Calculator,
  RotateCcw,
} from 'lucide-react';

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'text' | 'rect' | 'circle' | 'arrow' | 'line';
export type BoardTheme = 'dark-grid' | 'dark-dots' | 'dark-plain' | 'light-grid' | 'light-plain';

interface BoardPoint {
  x: number;
  y: number;
}

interface BoardStroke {
  tool: ToolType;
  color: string;
  size: number;
  points: BoardPoint[];
  text?: string;
}

interface WhiteboardTable {
  id: string;
  title: string;
  x: number;
  y: number;
  columns: string[];
  rows: string[][];
  hasTotal?: boolean;
}

interface WhiteboardSticky {
  id: string;
  x: number;
  y: number;
  color: string;
  text: string;
}

const COLOR_PALETTE = [
  { name: 'Blanco / Tiza', value: '#f8fafc' },
  { name: 'Azul Eléctrico', value: '#38bdf8' },
  { name: 'Verde Esmeralda', value: '#34d399' },
  { name: 'Amarillo Neón', value: '#fbbf24' },
  { name: 'Naranja Cálido', value: '#fb923c' },
  { name: 'Coral / Rosa', value: '#f87171' },
  { name: 'Púrpura Mágico', value: '#c084fc' },
  { name: 'Gris Carbón', value: '#64748b' },
];

const STROKE_SIZES = [
  { label: 'Fino', size: 2 },
  { label: 'Medio', size: 4 },
  { label: 'Grueso', size: 8 },
  { label: 'Marcador', size: 16 },
];

const STORAGE_KEY = 'nexa_whiteboard_state_v2';

export const WhiteboardCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tool states
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#38bdf8');
  const [strokeSize, setStrokeSize] = useState<number>(4);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('dark-grid');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<BoardStroke[]>([]);
  const [redoStack, setRedoStack] = useState<BoardStroke[]>([]);
  const currentStrokeRef = useRef<BoardPoint[]>([]);

  // Text tool inline input
  const [textInputPos, setTextInputPos] = useState<BoardPoint | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  // Interactive Tables & Sticky Notes
  const [tables, setTables] = useState<WhiteboardTable[]>([]);
  const [stickies, setStickies] = useState<WhiteboardSticky[]>([]);

  // Dragging floating elements
  const [draggingItem, setDraggingItem] = useState<{ type: 'table' | 'sticky'; id: string; offsetX: number; offsetY: number } | null>(null);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.strokes) setStrokes(parsed.strokes);
        if (parsed.tables) setTables(parsed.tables);
        if (parsed.stickies) setStickies(parsed.stickies);
        if (parsed.boardTheme) setBoardTheme(parsed.boardTheme);
      } else {
        // Seed an initial demo template table for financial planning
        setTables([
          {
            id: 'tbl_initial_budget',
            title: 'Cotización / Plan de Gasto Rápido',
            x: 40,
            y: 50,
            columns: ['Concepto', 'Estimado ($)', 'Prioridad', 'Notas'],
            rows: [
              ['Laptop de trabajo', '850.00', 'Alta', 'Aprovechar promoción'],
              ['Mantenimiento auto', '180.00', 'Media', 'Taller de confianza'],
              ['Cursos especialización', '120.00', 'Baja', 'Plataforma online'],
            ],
            hasTotal: true,
          },
        ]);
        setStickies([
          {
            id: 'stk_1',
            x: 620,
            y: 50,
            color: '#fef08a',
            text: '💡 Pizarra Libre NEXA:\n• Dibuja flechas y diagramas\n• Escribe ideas de gastos\n• Agrega tablas financieras\n• Todo se guarda automáticamente',
          },
        ]);
      }
    } catch {
      // Ignore fallback
    }
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          strokes,
          tables,
          stickies,
          boardTheme,
        })
      );
    } catch {
      // Ignore quota error
    }
  }, [strokes, tables, stickies, boardTheme]);

  // Redraw canvas whenever strokes or theme changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply high-DPI scale
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);

    // Draw background grid/dots according to theme
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Fill base background
    if (boardTheme.startsWith('dark')) {
      ctx.fillStyle = '#090d16'; // Deep slate blackboard
      ctx.fillRect(0, 0, width, height);

      if (boardTheme === 'dark-grid') {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)'; // Slate 700 subtle
        ctx.lineWidth = 1;
        const gridSize = 32;
        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      } else if (boardTheme === 'dark-dots') {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        const dotGap = 24;
        for (let x = 12; x < width; x += dotGap) {
          for (let y = 12; y < height; y += dotGap) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else {
      // Light whiteboard
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      if (boardTheme === 'light-grid') {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
        ctx.lineWidth = 1;
        const gridSize = 32;
        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }
    }

    // Render strokes
    strokes.forEach((stroke) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'eraser') {
        ctx.strokeStyle = boardTheme.startsWith('dark') ? '#090d16' : '#f8fafc';
        ctx.lineWidth = stroke.size * 2.5;
      } else if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = stroke.size * 2.5;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.globalAlpha = 1;
      }

      if (stroke.points.length === 0) {
        ctx.restore();
        return;
      }

      if (stroke.tool === 'text' && stroke.text) {
        ctx.font = `${Math.max(14, stroke.size * 3.5)}px Inter, sans-serif`;
        ctx.fillStyle = stroke.color;
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      } else if (stroke.tool === 'rect' && stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        const cx = Math.min(p1.x, p2.x) + rx;
        const cy = Math.min(p1.y, p2.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if ((stroke.tool === 'line' || stroke.tool === 'arrow') && stroke.points.length >= 2) {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        if (stroke.tool === 'arrow') {
          // Draw arrow tip
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const headLength = Math.max(12, stroke.size * 2.5);
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headLength * Math.cos(angle - Math.PI / 6), p2.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headLength * Math.cos(angle + Math.PI / 6), p2.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      } else {
        // Freehand line / pen / highlighter
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [strokes, boardTheme]);

  // Resize canvas to match container with DPI support
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer coordinate calculation relative to canvas in logical CSS pixels
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): BoardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only primary mouse button

    const point = getCanvasCoords(e);

    if (activeTool === 'text') {
      setTextInputPos(point);
      setTextInputValue('');
      return;
    }

    setIsDrawing(true);
    currentStrokeRef.current = [point];

    // Live preview initial point
    const newStroke: BoardStroke = {
      tool: activeTool,
      color: activeTool === 'eraser' ? '#090d16' : strokeColor,
      size: strokeSize,
      points: [point],
    };

    setStrokes((prev) => [...prev, newStroke]);
    setRedoStack([]); // Clear redo
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getCanvasCoords(e);
    currentStrokeRef.current.push(point);

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = {
        ...last,
        points: [...currentStrokeRef.current],
      };
      return [...prev.slice(0, prev.length - 1), updated];
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    currentStrokeRef.current = [];
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore capture release error
    }
  };

  // Submit typed text onto canvas
  const handleCommitText = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      setTextInputValue('');
      return;
    }

    const textStroke: BoardStroke = {
      tool: 'text',
      color: strokeColor,
      size: strokeSize,
      points: [textInputPos],
      text: textInputValue.trim(),
    };

    setStrokes((prev) => [...prev, textStroke]);
    setRedoStack([]);
    setTextInputPos(null);
    setTextInputValue('');
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [last, ...prev]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setStrokes((prev) => [...prev, next]);
  };

  const handleClearBoard = () => {
    if (window.confirm('¿Seguro que deseas limpiar todos los trazos y dibujos de la pizarra?')) {
      setStrokes([]);
      setRedoStack([]);
    }
  };

  // Export as high-resolution PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pizarra-nexa-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Table manipulation helpers
  const handleAddTable = () => {
    const newTable: WhiteboardTable = {
      id: `tbl_${Date.now()}`,
      title: 'Nueva Tabla de Presupuesto',
      x: 80,
      y: 80,
      columns: ['Concepto', 'Monto ($)', 'Notas'],
      rows: [
        ['Item 1', '0.00', 'Detalle'],
        ['Item 2', '0.00', 'Detalle'],
      ],
      hasTotal: true,
    };
    setTables((prev) => [...prev, newTable]);
  };

  const handleUpdateTableTitle = (id: string, title: string) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
  };

  const handleUpdateTableCell = (tableId: string, rowIndex: number, colIndex: number, value: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const newRows = t.rows.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;
          const newRow = [...row];
          newRow[colIndex] = value;
          return newRow;
        });
        return { ...t, rows: newRows };
      })
    );
  };

  const handleAddTableRow = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const emptyRow = new Array(t.columns.length).fill('');
        return { ...t, rows: [...t.rows, emptyRow] };
      })
    );
  };

  const handleDeleteTableRow = (tableId: string, rowIndex: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        if (t.rows.length <= 1) return t;
        return { ...t, rows: t.rows.filter((_, idx) => idx !== rowIndex) };
      })
    );
  };

  const handleDeleteTable = (tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
  };

  // Sticky notes helpers
  const handleAddSticky = (color: string = '#fef08a') => {
    const newSticky: WhiteboardSticky = {
      id: `stk_${Date.now()}`,
      x: 120 + Math.random() * 40,
      y: 120 + Math.random() * 40,
      color,
      text: 'Nueva nota rápida...',
    };
    setStickies((prev) => [...prev, newSticky]);
  };

  const handleUpdateStickyText = (id: string, text: string) => {
    setStickies((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const handleDeleteSticky = (id: string) => {
    setStickies((prev) => prev.filter((s) => s.id !== id));
  };

  // Floating Dragging Logic
  const handleStartDrag = (type: 'table' | 'sticky', id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentItem = type === 'table' ? tables.find((t) => t.id === id) : stickies.find((s) => s.id === id);
    if (!currentItem) return;

    setDraggingItem({
      type,
      id,
      offsetX: e.clientX - rect.left - currentItem.x,
      offsetY: e.clientY - rect.top - currentItem.y,
    });
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!draggingItem) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const newX = Math.max(10, Math.min(rect.width - 150, e.clientX - rect.left - draggingItem.offsetX));
    const newY = Math.max(10, Math.min(rect.height - 100, e.clientY - rect.top - draggingItem.offsetY));

    if (draggingItem.type === 'table') {
      setTables((prev) => prev.map((t) => (t.id === draggingItem.id ? { ...t, x: newX, y: newY } : t)));
    } else {
      setStickies((prev) => prev.map((s) => (s.id === draggingItem.id ? { ...s, x: newX, y: newY } : s)));
    }
  };

  const handleContainerMouseUp = () => {
    if (draggingItem) setDraggingItem(null);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-3 z-50 rounded-2xl' : 'h-[750px] w-full'
      }`}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
    >
      {/* Top Whiteboard Command Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 select-none">
        {/* Drawing Tools Section */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'pen' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Lápiz / Bolígrafo"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lápiz</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('highlighter')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'highlighter' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Resaltador / Marcador fluorescente"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resaltador</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'eraser' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Borrador"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Borrador</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'text' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Escribir texto libre en la pizarra"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Texto</span>
            </button>
          </div>

          {/* Geometric & Diagram Tools */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTool('rect')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'rect' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Rectángulo / Caja"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('circle')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'circle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Círculo / Elipse"
            >
              <CircleIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'arrow' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Flecha de flujo"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setStrokeColor(c.value)}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                  strokeColor === c.value ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-slate-700 hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
            <label className="relative cursor-pointer ml-0.5" title="Color personalizado">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center bg-gradient-to-tr from-rose-500 via-emerald-400 to-sky-400 text-[9px] font-black text-white">
                +
              </span>
            </label>
          </div>

          {/* Stroke Size Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {STROKE_SIZES.map((sz) => (
              <button
                key={sz.size}
                type="button"
                onClick={() => setStrokeSize(sz.size)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  strokeSize === sz.size ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={`Trazo ${sz.label} (${sz.size}px)`}
              >
                {sz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Add Elements, History & Canvas Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Add Interactive Table Button */}
          <button
            type="button"
            onClick={handleAddTable}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
            title="Insertar tabla interactiva en la pizarra"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>+ Tabla</span>
          </button>

          {/* Add Sticky Note Button */}
          <button
            type="button"
            onClick={() => handleAddSticky('#fef08a')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition cursor-pointer"
            title="Pegar nota adhesiva"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>+ Nota Post-it</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Theme switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setBoardTheme(boardTheme === 'dark-grid' ? 'dark-dots' : boardTheme === 'dark-dots' ? 'light-grid' : 'dark-grid')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
              title="Cambiar cuadrícula / estilo de pizarra"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold hidden md:inline">
                {boardTheme === 'dark-grid' ? 'Líneas' : boardTheme === 'dark-dots' ? 'Puntos' : 'Blanco'}
              </span>
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className={`p-1.5 rounded-lg transition ${
                strokes.length > 0 ? 'text-slate-300 hover:text-white cursor-pointer' : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Deshacer trazo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded-lg transition ${
                redoStack.length > 0 ? 'text-slate-300 hover:text-white cursor-pointer' : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Rehacer trazo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear board */}
          <button
            type="button"
            onClick={handleClearBoard}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
            title="Limpiar toda la pizarra"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Descargar imagen PNG de la pizarra"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area with Floating Interactive Elements */}
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`absolute inset-0 w-full h-full ${
            activeTool === 'eraser'
              ? 'cursor-cell'
              : activeTool === 'text'
              ? 'cursor-text'
              : 'cursor-crosshair'
          }`}
        />

        {/* Text Input Overlay */}
        {textInputPos && (
          <div
            className="absolute z-30 p-2 bg-slate-900 border border-blue-500 rounded-xl shadow-2xl flex items-center gap-2"
            style={{ left: textInputPos.x, top: textInputPos.y }}
          >
            <input
              autoFocus
              type="text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitText();
                if (e.key === 'Escape') setTextInputPos(null);
              }}
              placeholder="Escribe algo aquí..."
              className="bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400 min-w-[200px]"
            />
            <button
              type="button"
              onClick={handleCommitText}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition"
            >
              Listo
            </button>
            <button
              type="button"
              onClick={() => setTextInputPos(null)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Interactive Tables on Whiteboard */}
        {tables.map((table) => {
          // Calculate column sums for columns with numeric data
          const numericTotals: (number | null)[] = table.columns.map((_, colIdx) => {
            let colSum = 0;
            let hasNumber = false;
            table.rows.forEach((row) => {
              const val = parseFloat((row[colIdx] || '').replace(/[$,]/g, ''));
              if (!isNaN(val)) {
                colSum += val;
                hasNumber = true;
              }
            });
            return hasNumber ? colSum : null;
          });

          return (
            <div
              key={table.id}
              className="absolute z-20 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl overflow-hidden max-w-lg min-w-[340px] text-xs transition-shadow hover:ring-1 hover:ring-blue-500/40"
              style={{ left: table.x, top: table.y }}
            >
              {/* Table Draggable Header */}
              <div
                onMouseDown={(e) => handleStartDrag('table', table.id, e)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-800/90 border-b border-slate-700 cursor-move select-none"
              >
                <div className="flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={table.title}
                    onChange={(e) => handleUpdateTableTitle(table.id, e.target.value)}
                    className="bg-transparent font-bold text-white text-xs focus:outline-none focus:bg-slate-950 px-1 py-0.5 rounded"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAddTableRow(table.id)}
                    className="p-1 rounded text-emerald-400 hover:bg-slate-700 transition cursor-pointer"
                    title="Agregar fila"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition cursor-pointer"
                    title="Cerrar tabla"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Table Content */}
              <div className="p-2 overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {table.columns.map((col, idx) => (
                        <th key={idx} className="pb-1.5 px-2">
                          {col}
                        </th>
                      ))}
                      <th className="w-6 pb-1.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40 group">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-1">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleUpdateTableCell(table.id, rIdx, cIdx, e.target.value)}
                              className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteTableRow(table.id, rIdx)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {table.hasTotal && (
                    <tfoot>
                      <tr className="border-t border-slate-700 font-bold text-white bg-slate-950/40">
                        {numericTotals.map((tot, idx) => (
                          <td key={idx} className="p-1.5 px-2 font-mono text-[11px] text-emerald-400">
                            {tot !== null ? `$${tot.toFixed(2)}` : idx === 0 ? 'Total' : ''}
                          </td>
                        ))}
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}

        {/* Floating Post-It Sticky Notes on Whiteboard */}
        {stickies.map((sticky) => (
          <div
            key={sticky.id}
            className="absolute z-20 w-52 p-3 rounded-2xl shadow-2xl transition-shadow select-none group text-slate-900 border border-black/10"
            style={{
              left: sticky.x,
              top: sticky.y,
              backgroundColor: sticky.color,
            }}
          >
            <div
              onMouseDown={(e) => handleStartDrag('sticky', sticky.id, e)}
              className="flex items-center justify-between cursor-move pb-1 mb-1 border-b border-black/10 opacity-70 group-hover:opacity-100"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                Nota
              </span>
              <button
                type="button"
                onClick={() => handleDeleteSticky(sticky.id)}
                className="hover:text-rose-700 cursor-pointer"
                title="Eliminar nota"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <textarea
              rows={4}
              value={sticky.text}
              onChange={(e) => handleUpdateStickyText(sticky.id, e.target.value)}
              className="w-full bg-transparent resize-none border-none text-xs font-medium text-slate-900 focus:outline-none placeholder-slate-700"
              placeholder="Escribe tu nota aquí..."
            />
          </div>
        ))}
      </div>

      {/* Bottom Status & Tips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Pizarra en vivo activa
          </span>
          <span className="hidden md:inline">• {strokes.length} trazos guardados</span>
          <span className="hidden md:inline">• {tables.length} tablas</span>
          <span className="hidden md:inline">• {stickies.length} notas adhesivas</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            Tip: Arrastra las tablas y notas desde su barra superior
          </span>
        </div>
      </div>
    </div>
  );
};
