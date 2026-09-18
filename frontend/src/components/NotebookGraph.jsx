import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

const NODE_COLORS = {
  main_topic: '#a78bfa',
  topic:      '#3b82f6',
  concept:    '#00d4ff',
  entity:     '#7c3aed',
  dependency: '#8b5cf6',
  fact:       '#10b981',
  gap:        '#f59e0b',
}

const NODE_SHAPES = {
  topic:      'circle',
  concept:    'circle',
  entity:     'square',
  dependency: 'diamond',
  fact:       'circle',
  gap:        'circle',
}

export default function NotebookGraph({ nodes = [], edges = [], selectedNode, onNodeSelect }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  const [viewMode, setViewMode] = useState('tree') // 'tree' | 'force'
  const [camera, setCamera] = useState({ x: 0, y: 0, k: 1 })
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState(null)

  // Force simulation ref data
  const simRef = useRef({
    nodes: [],
    edges: [],
    dragNode: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    camera: { x: 0, y: 0, k: 1 },
  })

  simRef.current.camera = camera

  // Identify root node
  const rootNode = useMemo(() => {
    if (!nodes.length) return null
    return nodes.find(n => n.is_root || n.id === 'root') || nodes[0]
  }, [nodes])

  // Automatically expand Root node and Level 1 children on initial load
  useEffect(() => {
    if (!nodes.length) return
    const initialExpanded = new Set()
    
    const root = nodes.find(n => n.is_root || n.id === 'root') || nodes[0]
    if (root) initialExpanded.add(root.id)

    nodes.forEach(n => {
      if (n.parent_id === root?.id) {
        initialExpanded.add(n.id)
      }
    })

    setExpandedNodes(initialExpanded)
  }, [nodes])

  const toggleExpand = (nodeId, e) => {
    if (e) e.stopPropagation()
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // ─── Mindmap Tree Layout (Non-overlapping spacious tree) ──────────
  const treeStructure = useMemo(() => {
    if (!nodes.length) return { root: null, childMap: new Map(), nodeMap: new Map() }
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const childMap = new Map()

    nodes.forEach(n => {
      const pid = n.parent_id || (n.id !== rootNode?.id ? rootNode?.id : null)
      if (pid && pid !== n.id) {
        if (!childMap.has(pid)) childMap.set(pid, [])
        childMap.get(pid).push(n)
      }
    })

    return { root: rootNode, childMap, nodeMap }
  }, [nodes, rootNode])

  const treeLayout = useMemo(() => {
    if (!treeStructure.root) return { layoutNodes: [], connections: [] }

    const { root, childMap } = treeStructure
    const layoutNodes = []
    const connections = []

    const NODE_WIDTH = 220
    const NODE_HEIGHT = 44
    const LEVEL_GAP_X = 160
    const ROW_GAP_Y = 36 // Generous vertical padding to prevent card collisions

    const calculatePositions = (node, level = 0, startY = 0) => {
      const children = (childMap.get(node.id) || []).filter(c => expandedNodes.has(node.id) || level === 0)
      const isExpanded = expandedNodes.has(node.id)
      const hasChildren = (childMap.get(node.id) || []).length > 0

      let nodeY = startY

      if (isExpanded && children.length > 0) {
        let childStartY = startY
        const childYs = []

        children.forEach(child => {
          const cy = calculatePositions(child, level + 1, childStartY)
          childYs.push(cy)
          childStartY += cy.subtreeHeight + ROW_GAP_Y
        })

        const subtreeHeight = Math.max(NODE_HEIGHT, childStartY - startY - ROW_GAP_Y)
        nodeY = startY + subtreeHeight / 2 - NODE_HEIGHT / 2

        layoutNodes.push({
          ...node,
          x: level * (NODE_WIDTH + LEVEL_GAP_X),
          y: nodeY,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          level,
          hasChildren,
          isExpanded,
          subtreeHeight
        })

        children.forEach((child, idx) => {
          connections.push({
            id: `${node.id}->${child.id}`,
            fromX: level * (NODE_WIDTH + LEVEL_GAP_X) + NODE_WIDTH,
            fromY: nodeY + NODE_HEIGHT / 2,
            toX: (level + 1) * (NODE_WIDTH + LEVEL_GAP_X),
            toY: childYs[idx].nodeY + NODE_HEIGHT / 2,
            fromId: node.id,
            toId: child.id
          })
        })

        return { nodeY, subtreeHeight }
      } else {
        nodeY = startY
        layoutNodes.push({
          ...node,
          x: level * (NODE_WIDTH + LEVEL_GAP_X),
          y: nodeY,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          level,
          hasChildren,
          isExpanded,
          subtreeHeight: NODE_HEIGHT
        })
        return { nodeY, subtreeHeight: NODE_HEIGHT }
      }
    }

    calculatePositions(root, 0, 0)

    if (layoutNodes.length > 0) {
      let minY = Infinity, maxY = -Infinity
      layoutNodes.forEach(n => {
        if (n.y < minY) minY = n.y
        if (n.y + n.height > maxY) maxY = n.y + n.height
      })
      const midY = (minY + maxY) / 2
      layoutNodes.forEach(n => { n.y -= midY })
      connections.forEach(c => {
        c.fromY -= midY
        c.toY -= midY
      })
    }

    return { layoutNodes, connections }
  }, [treeStructure, expandedNodes])

  // ─── Anti-Collision 60FPS Physics Engine for Network Mode ──────────
  useEffect(() => {
    if (!nodes.length) return

    const nodeMap = new Map()
    const radius = Math.max(180, nodes.length * 28)

    const simNodes = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const existing = simRef.current.nodes.find(sn => sn.id === n.id)
      const obj = {
        ...n,
        x: existing ? existing.x : Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
        y: existing ? existing.y : Math.sin(angle) * radius + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0,
        radius: n.is_root || n.type === 'topic' ? 14 : 10,
        color: NODE_COLORS[n.type] || '#00d4ff',
      }
      nodeMap.set(n.id, obj)
      return obj
    })

    const validIds = new Set(simNodes.map(n => n.id))
    const simEdges = edges
      .filter(e => validIds.has(e.source) && validIds.has(e.target))
      .map(e => ({
        ...e,
        sourceNode: nodeMap.get(e.source),
        targetNode: nodeMap.get(e.target),
      }))

    simRef.current.nodes = simNodes
    simRef.current.edges = simEdges
  }, [nodes, edges])

  // Anti-collision physics loop
  useEffect(() => {
    if (viewMode !== 'force') return
    let animId
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const MIN_NODE_DIST = 95 // Hard anti-collision threshold to keep text labels separated

    const stepPhysics = () => {
      const snodes = simRef.current.nodes
      const sedges = simRef.current.edges
      if (!snodes.length) return

      // 1. Hard Anti-Collision Resolution & Strong Repulsion
      for (let i = 0; i < snodes.length; i++) {
        for (let j = i + 1; j < snodes.length; j++) {
          const n1 = snodes[i]
          const n2 = snodes[j]
          let dx = n2.x - n1.x
          let dy = n2.y - n1.y
          let dist = Math.sqrt(dx * dx + dy * dy) || 0.1

          // Hard Collision Overlap Prevention
          const minDist = n1.radius + n2.radius + MIN_NODE_DIST
          if (dist < minDist) {
            const overlap = (minDist - dist) * 0.55
            const nx = dx / dist
            const ny = dy / dist
            if (n1 !== simRef.current.dragNode) {
              n1.x -= nx * overlap
              n1.y -= ny * overlap
            }
            if (n2 !== simRef.current.dragNode) {
              n2.x += nx * overlap
              n2.y += ny * overlap
            }
          }

          // Strong Long-Range Coulomb Repulsion
          if (dist < 650) {
            let force = 9500 / (dist * dist + 20)
            let fx = (dx / dist) * force
            let fy = (dy / dist) * force
            n1.vx -= fx
            n1.vy -= fy
            n2.vx += fx
            n2.vy += fy
          }
        }
      }

      // 2. Spring Attraction along Edges with Spacious Rest Length
      for (const e of sedges) {
        const n1 = e.sourceNode
        const n2 = e.targetNode
        if (!n1 || !n2) continue
        let dx = n2.x - n1.x
        let dy = n2.y - n1.y
        let dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        let desired = 185 // Spacious resting distance between parent and child nodes
        let force = (dist - desired) * 0.022
        let fx = (dx / dist) * force
        let fy = (dy / dist) * force
        n1.vx += fx
        n1.vy += fy
        n2.vx -= fx
        n2.vy -= fy
      }

      // 3. Gentle Center Gravity (prevents tight central clumping)
      for (const n of snodes) {
        n.vx -= n.x * 0.0008
        n.vy -= n.y * 0.0008
        n.vx *= 0.85
        n.vy *= 0.85

        if (n !== simRef.current.dragNode) {
          n.x += n.vx
          n.y += n.vy
        }
      }
    }

    const draw = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      ctx.clearRect(0, 0, w, h)

      const cam = simRef.current.camera
      ctx.save()
      ctx.translate(w / 2 + cam.x, h / 2 + cam.y)
      ctx.scale(cam.k, cam.k)

      const snodes = simRef.current.nodes
      const sedges = simRef.current.edges

      // Draw Edges
      sedges.forEach(e => {
        const n1 = e.sourceNode
        const n2 = e.targetNode
        if (!n1 || !n2) return

        ctx.beginPath()
        ctx.moveTo(n1.x, n1.y)
        ctx.lineTo(n2.x, n2.y)
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        const isHover = hoveredNode && (hoveredNode.id === n1.id || hoveredNode.id === n2.id)
        if (isHover && e.label) {
          const mx = (n1.x + n2.x) / 2
          const my = (n1.y + n2.y) / 2
          ctx.font = '10px Outfit, sans-serif'
          ctx.fillStyle = 'rgba(0,212,255,0.85)'
          ctx.textAlign = 'center'
          ctx.fillText(e.label, mx, my - 4)
        }
      })

      // Draw Nodes
      snodes.forEach(n => {
        const isSelected = selectedNode && selectedNode.id === n.id
        const isHovered = hoveredNode && hoveredNode.id === n.id
        const r = isSelected ? n.radius + 4 : isHovered ? n.radius + 2 : n.radius

        // Outer glow
        const glowRad = r * (isSelected ? 3.5 : 2.5)
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRad)
        grad.addColorStop(0, `${n.color}${isSelected ? '85' : '45'}`)
        grad.addColorStop(1, `${n.color}00`)
        ctx.beginPath()
        ctx.arc(n.x, n.y, glowRad, 0, 2 * Math.PI)
        ctx.fillStyle = grad
        ctx.fill()

        // Selection Ring
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 5, 0, 2 * Math.PI)
          ctx.strokeStyle = n.color
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Node Shape
        if (NODE_SHAPES[n.type] === 'square') {
          ctx.beginPath()
          ctx.rect(n.x - r, n.y - r, r * 2, r * 2)
          ctx.fillStyle = n.color
          ctx.fill()
        } else if (NODE_SHAPES[n.type] === 'diamond') {
          ctx.save()
          ctx.translate(n.x, n.y)
          ctx.rotate(Math.PI / 4)
          ctx.beginPath()
          ctx.rect(-r, -r, r * 2, r * 2)
          ctx.fillStyle = n.color
          ctx.fill()
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI)
          ctx.fillStyle = n.color
          ctx.fill()
        }

        // Title Label
        const fontSize = Math.max(12 / cam.k, 8)
        ctx.font = `${isSelected || isHovered ? '700' : '500'} ${fontSize}px Outfit, Inter, sans-serif`
        ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#00d4ff' : 'rgba(255,255,255,0.9)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const title = n.title || n.id
        ctx.fillText(
          title.length > 25 ? title.slice(0, 23) + '…' : title,
          n.x,
          n.y + r + 5
        )
      })

      ctx.restore()
    }

    const loop = () => {
      stepPhysics()
      draw()
      animId = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(animId)
  }, [viewMode, selectedNode, hoveredNode])

  // Center camera on nodes
  const fitCamera = useCallback(() => {
    if (viewMode === 'force') {
      setCamera({ x: 0, y: 0, k: 0.85 })
    } else {
      setCamera({ x: 120, y: 0, k: 0.95 })
    }
  }, [viewMode])

  useEffect(() => {
    fitCamera()
  }, [nodes, viewMode, fitCamera])

  // Mouse Interaction Handlers
  const getCanvasCoords = (e) => {
    if (!containerRef.current) return { worldX: 0, worldY: 0, mx: 0, my: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const w = containerRef.current.clientWidth
    const h = containerRef.current.clientHeight
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const cam = simRef.current.camera

    const worldX = (mx - w / 2 - cam.x) / cam.k
    const worldY = (my - h / 2 - cam.y) / cam.k
    return { worldX, worldY, mx, my }
  }

  const handleMouseDown = e => {
    if (viewMode === 'tree') {
      if (e.target.closest('.mindmap-node-card')) return
      setIsPanning(true)
      setPanStart({ x: e.clientX - camera.x, y: e.clientY - camera.y })
    } else {
      const { worldX, worldY, mx, my } = getCanvasCoords(e)
      const hit = simRef.current.nodes.find(n => {
        const dx = n.x - worldX
        const dy = n.y - worldY
        return dx * dx + dy * dy <= (n.radius + 8) * (n.radius + 8)
      })

      if (hit) {
        simRef.current.dragNode = hit
      } else {
        simRef.current.isPanning = true
        simRef.current.panStart = { x: mx - simRef.current.camera.x, y: my - simRef.current.camera.y }
        setIsPanning(true)
      }
    }
  }

  const handleMouseMove = e => {
    if (viewMode === 'tree') {
      if (!isPanning) return
      setCamera(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }))
    } else {
      const { worldX, worldY, mx, my } = getCanvasCoords(e)

      if (simRef.current.dragNode) {
        simRef.current.dragNode.x = worldX
        simRef.current.dragNode.y = worldY
        return
      }

      if (simRef.current.isPanning) {
        setCamera(prev => ({
          ...prev,
          x: mx - simRef.current.panStart.x,
          y: my - simRef.current.panStart.y,
        }))
        return
      }

      const hit = simRef.current.nodes.find(n => {
        const dx = n.x - worldX
        const dy = n.y - worldY
        return dx * dx + dy * dy <= (n.radius + 8) * (n.radius + 8)
      })

      setHoveredNode(hit || null)
    }
  }

  const handleMouseUp = e => {
    if (viewMode === 'force') {
      if (simRef.current.dragNode) {
        if (onNodeSelect) onNodeSelect(simRef.current.dragNode)
        simRef.current.dragNode = null
      } else if (!simRef.current.isPanning) {
        const { worldX, worldY } = getCanvasCoords(e)
        const hit = simRef.current.nodes.find(n => {
          const dx = n.x - worldX
          const dy = n.y - worldY
          return dx * dx + dy * dy <= (n.radius + 8) * (n.radius + 8)
        })
        if (hit && onNodeSelect) onNodeSelect(hit)
      }
      simRef.current.isPanning = false
    }
    setIsPanning(false)
  }

  const handleWheel = e => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88
    setCamera(prev => ({
      ...prev,
      k: Math.min(Math.max(prev.k * zoomFactor, 0.25), 3.0),
    }))
  }

  if (!nodes.length) return null

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#040810',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isPanning ? 'grabbing' : hoveredNode ? 'pointer' : 'grab',
      }}
    >
      {/* Background Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* Toolbar Switcher */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 20,
          display: 'flex',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px 6px',
          borderRadius: 10,
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={() => setViewMode('tree')}
          style={{
            padding: '5px 12px',
            borderRadius: 7,
            border: 'none',
            background: viewMode === 'tree' ? 'linear-gradient(135deg, #0284c7, #6366f1)' : 'transparent',
            color: viewMode === 'tree' ? '#ffffff' : '#94a3b8',
            fontSize: 12,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🌳 Mindmap Tree
        </button>
        <button
          onClick={() => setViewMode('force')}
          style={{
            padding: '5px 12px',
            borderRadius: 7,
            border: 'none',
            background: viewMode === 'force' ? 'linear-gradient(135deg, #0284c7, #6366f1)' : 'transparent',
            color: viewMode === 'force' ? '#ffffff' : '#94a3b8',
            fontSize: 12,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🕸️ Network Web
        </button>
      </div>

      {/* Stats counter */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 10,
          padding: '5px 12px',
          color: '#94a3b8',
          fontSize: 12,
          fontFamily: 'Outfit, sans-serif',
          backdropFilter: 'blur(12px)',
          pointerEvents: 'none',
        }}
      >
        <span>{nodes.length} Nodes · {edges.length} Edges</span>
      </div>

      {/* MODE 1: Mindmap Tree View */}
      {viewMode === 'tree' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.k})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.05s ease-out',
            position: 'absolute',
            inset: 0,
          }}
        >
          <svg
            style={{
              position: 'absolute',
              overflow: 'visible',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {treeLayout.connections.map(conn => {
              const dx = Math.abs(conn.toX - conn.fromX) * 0.45
              const pathD = `M ${conn.fromX} ${conn.fromY} C ${conn.fromX + dx} ${conn.fromY}, ${conn.toX - dx} ${conn.toY}, ${conn.toX} ${conn.toY}`

              return (
                <path
                  key={conn.id}
                  d={pathD}
                  fill="none"
                  stroke="url(#curveGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>

          {treeLayout.layoutNodes.map(node => {
            const isSelected = selectedNode && selectedNode.id === node.id
            const isRootNode = node.is_root || node.id === 'root'
            const hasChildren = node.hasChildren
            const isExpanded = node.isExpanded

            return (
              <div
                key={node.id}
                className="mindmap-node-card"
                onClick={() => onNodeSelect && onNodeSelect(node)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  minHeight: node.height,
                  background: isRootNode
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(30, 41, 59, 0.95))'
                    : isSelected
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(30, 41, 59, 0.95))'
                    : 'rgba(30, 41, 59, 0.85)',
                  border: `1.5px solid ${
                    isSelected
                      ? '#38bdf8'
                      : isRootNode
                      ? '#818cf8'
                      : 'rgba(255, 255, 255, 0.12)'
                  }`,
                  borderRadius: isRootNode ? 14 : 12,
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: 8,
                  backdropFilter: 'blur(16px)',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(56, 189, 248, 0.4)'
                    : isRootNode
                    ? '0 0 25px rgba(129, 140, 248, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: isSelected ? 15 : isRootNode ? 10 : 5,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: isSelected || isRootNode ? '#ffffff' : '#f1f5f9',
                      fontSize: isRootNode ? 14 : 13,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: isRootNode ? 700 : 600,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.title}
                  </p>
                </div>

                {hasChildren && (
                  <button
                    onClick={e => toggleExpand(node.id, e)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isExpanded ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${isExpanded ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'}`,
                      color: isExpanded ? '#38bdf8' : '#94a3b8',
                      fontSize: 11,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                    title={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
                  >
                    {isExpanded ? '‹' : '›'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODE 2: 2D Force Physics Canvas View */}
      {viewMode === 'force' && (
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
          }}
        />
      )}

      {/* Zoom / Reset Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          zIndex: 20,
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          onClick={() => setCamera(prev => ({ ...prev, k: Math.min(prev.k * 1.25, 2.5) }))}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#38bdf8',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          +
        </button>
        <button
          onClick={() => setCamera(prev => ({ ...prev, k: Math.max(prev.k * 0.8, 0.3) }))}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#38bdf8',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          -
        </button>
        <button
          onClick={fitCamera}
          style={{
            padding: '4px 12px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#38bdf8',
            fontSize: 12,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ⊞ Fit View
        </button>
      </div>
    </div>
  )
}
