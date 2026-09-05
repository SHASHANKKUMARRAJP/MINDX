import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

const NODE_COLORS = {
  concept:    '#00d4ff',
  entity:     '#7c3aed',
  topic:      '#3b82f6',
  dependency: '#8b5cf6',
  fact:       '#10b981',
  gap:        '#f59e0b',
}

const NODE_SHAPES = {
  concept:    'circle',
  entity:     'square',
  topic:      'circle',
  dependency: 'diamond',
  fact:       'circle',
  gap:        'circle',
}

export default function NotebookGraph({ nodes = [], edges = [], selectedNode, onNodeSelect }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  // Camera transform: pan (x, y) & zoom (k)
  const [camera, setCamera] = useState({ x: 0, y: 0, k: 1 })
  const [hoveredNode, setHoveredNode] = useState(null)

  // Ref data for animation loop
  const simRef = useRef({
    nodes: [],
    edges: [],
    dragNode: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    camera: { x: 0, y: 0, k: 1 },
  })

  // Sync camera state with ref
  simRef.current.camera = camera

  // Initialize physics simulation nodes & edges when props change
  useEffect(() => {
    if (!nodes.length) return

    const nodeMap = new Map()
    const radius = Math.max(120, nodes.length * 22)

    const simNodes = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const existing = simRef.current.nodes.find(sn => sn.id === n.id)
      const obj = {
        ...n,
        x: existing ? existing.x : Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: existing ? existing.y : Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: n.type === 'topic' ? 12 : 9,
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

  // Center camera on nodes
  const fitCamera = useCallback(() => {
    if (!containerRef.current || !simRef.current.nodes.length) return
    const { clientWidth: w, clientHeight: h } = containerRef.current
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

    simRef.current.nodes.forEach(n => {
      if (n.x < minX) minX = n.x
      if (n.x > maxX) maxX = n.x
      if (n.y < minY) minY = n.y
      if (n.y > maxY) maxY = n.y
    })

    const bw = maxX - minX || 200
    const bh = maxY - minY || 200
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    const k = Math.min(0.85 * (w / bw), 0.85 * (h / bh), 1.8)
    setCamera({ x: -cx * k, y: -cy * k, k: Math.max(k, 0.4) })
  }, [])

  useEffect(() => {
    fitCamera()
  }, [nodes, fitCamera])

  // Center on selected node
  useEffect(() => {
    if (selectedNode) {
      const target = simRef.current.nodes.find(n => n.id === selectedNode.id)
      if (target) {
        setCamera(prev => ({
          x: -target.x * 1.6,
          y: -target.y * 1.6,
          k: 1.6,
        }))
      }
    }
  }, [selectedNode])

  // Main 60FPS physics & render loop
  useEffect(() => {
    let animId
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const stepPhysics = () => {
      const snodes = simRef.current.nodes
      const sedges = simRef.current.edges
      if (!snodes.length) return

      // Repulsion between nodes (Coulomb)
      for (let i = 0; i < snodes.length; i++) {
        for (let j = i + 1; j < snodes.length; j++) {
          const n1 = snodes[i]
          const n2 = snodes[j]
          let dx = n2.x - n1.x
          let dy = n2.y - n1.y
          let distSq = dx * dx + dy * dy + 0.1
          let dist = Math.sqrt(distSq)
          if (dist > 350) continue
          let force = (3200 / distSq)
          let fx = (dx / dist) * force
          let fy = (dy / dist) * force
          n1.vx -= fx
          n1.vy -= fy
          n2.vx += fx
          n2.vy += fy
        }
      }

      // Attraction along edges (Hooke's spring)
      for (const e of sedges) {
        const n1 = e.sourceNode
        const n2 = e.targetNode
        if (!n1 || !n2) continue
        let dx = n2.x - n1.x
        let dy = n2.y - n1.y
        let dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        let desired = 110
        let force = (dist - desired) * 0.035
        let fx = (dx / dist) * force
        let fy = (dy / dist) * force
        n1.vx += fx
        n1.vy += fy
        n2.vx -= fx
        n2.vy -= fy
      }

      // Center gravity
      for (const n of snodes) {
        n.vx -= n.x * 0.005
        n.vy -= n.y * 0.005
        n.vx *= 0.82
        n.vy *= 0.82

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

      // Draw edges
      sedges.forEach(e => {
        const n1 = e.sourceNode
        const n2 = e.targetNode
        if (!n1 || !n2) return

        ctx.beginPath()
        ctx.moveTo(n1.x, n1.y)
        ctx.lineTo(n2.x, n2.y)
        ctx.strokeStyle = 'rgba(0,212,255,0.18)'
        ctx.lineWidth = 1.2
        ctx.stroke()

        // Edge label if hovered or selected
        const isHover = hoveredNode && (hoveredNode.id === n1.id || hoveredNode.id === n2.id)
        if (isHover && e.label) {
          const mx = (n1.x + n2.x) / 2
          const my = (n1.y + n2.y) / 2
          ctx.font = '10px Inter, sans-serif'
          ctx.fillStyle = 'rgba(0,212,255,0.7)'
          ctx.textAlign = 'center'
          ctx.fillText(e.label, mx, my - 4)
        }
      })

      // Draw nodes
      snodes.forEach(n => {
        const isSelected = selectedNode && selectedNode.id === n.id
        const isHovered = hoveredNode && hoveredNode.id === n.id
        const r = isSelected ? n.radius + 3 : isHovered ? n.radius + 2 : n.radius

        // Outer glow
        const glowRad = r * (isSelected ? 3.5 : 2.5)
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRad)
        grad.addColorStop(0, `${n.color}${isSelected ? '70' : '40'}`)
        grad.addColorStop(1, `${n.color}00`)
        ctx.beginPath()
        ctx.arc(n.x, n.y, glowRad, 0, 2 * Math.PI)
        ctx.fillStyle = grad
        ctx.fill()

        // Selection ring
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 4, 0, 2 * Math.PI)
          ctx.strokeStyle = n.color
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Node Body
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

        // Node Title Label
        const fontSize = Math.max(11 / cam.k, 7)
        ctx.font = `${isSelected || isHovered ? '700' : '500'} ${fontSize}px Outfit, Inter, sans-serif`
        ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#00d4ff' : 'rgba(255,255,255,0.85)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const title = n.title || n.id
        ctx.fillText(
          title.length > 22 ? title.slice(0, 20) + '…' : title,
          n.x,
          n.y + r + 4
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
  }, [selectedNode, hoveredNode])

  // Mouse interaction: Hover, Pan, Drag, Click
  const getCanvasCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 }
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

  const handleMouseDown = (e) => {
    const { worldX, worldY, mx, my } = getCanvasCoords(e)

    // Check if clicked a node
    const hit = simRef.current.nodes.find(n => {
      const dx = n.x - worldX
      const dy = n.y - worldY
      return dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)
    })

    if (hit) {
      simRef.current.dragNode = hit
    } else {
      simRef.current.isPanning = true
      simRef.current.panStart = { x: mx - simRef.current.camera.x, y: my - simRef.current.camera.y }
    }
  }

  const handleMouseMove = (e) => {
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

    // Hover check
    const hit = simRef.current.nodes.find(n => {
      const dx = n.x - worldX
      const dy = n.y - worldY
      return dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)
    })

    setHoveredNode(hit || null)
  }

  const handleMouseUp = (e) => {
    if (simRef.current.dragNode) {
      if (onNodeSelect) onNodeSelect(simRef.current.dragNode)
      simRef.current.dragNode = null
    } else if (!simRef.current.isPanning) {
      const { worldX, worldY } = getCanvasCoords(e)
      const hit = simRef.current.nodes.find(n => {
        const dx = n.x - worldX
        const dy = n.y - worldY
        return dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)
      })
      if (hit && onNodeSelect) onNodeSelect(hit)
    }
    simRef.current.isPanning = false
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    setCamera(prev => ({
      ...prev,
      k: Math.min(Math.max(prev.k * zoomFactor, 0.25), 3.5),
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
        width: '100%', height: '100%', position: 'relative',
        cursor: hoveredNode ? 'pointer' : simRef.current.isPanning ? 'grabbing' : 'grab',
        userSelect: 'none', background: '#040810', overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 6, pointerEvents: 'none' }}>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: `${color}18`, color, border: `1px solid ${color}35`, fontSize: 10, fontFamily: 'Outfit, sans-serif', fontWeight: 600, textTransform: 'capitalize' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            {type}
          </span>
        ))}
      </div>

      {/* Node stats */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Outfit, sans-serif', pointerEvents: 'none' }}>
        {nodes.length} nodes · {edges.length} edges
      </div>

      {/* Control buttons */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, display: 'flex', gap: 6 }}>
        <button onClick={() => setCamera(prev => ({ ...prev, k: Math.min(prev.k * 1.25, 3.5) }))}
          style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(0,212,255,0.9)', fontSize: 14, cursor: 'pointer' }}>+</button>
        <button onClick={() => setCamera(prev => ({ ...prev, k: Math.max(prev.k * 0.8, 0.25) }))}
          style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(0,212,255,0.9)', fontSize: 14, cursor: 'pointer' }}>-</button>
        <button onClick={fitCamera}
          style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(0,212,255,0.9)', fontSize: 11, fontFamily: 'Outfit', cursor: 'pointer' }}>⊞ Fit</button>
      </div>
    </div>
  )
}
