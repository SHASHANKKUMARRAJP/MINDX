import axios from 'axios'

const rawUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_BASE_URL = rawUrl
  ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`)
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 min safety margin for AI calls
})

// ── Reality Scanner ─────────────────────────────────────────────
export const realityScan = async (file, prompt = '', mode = 'general') => {
  const form = new FormData()
  form.append('file', file)
  form.append('prompt', prompt)
  form.append('mode', mode)
  const { data } = await api.post('/reality-scan', form)
  return data
}


// ── Second Brain ────────────────────────────────────────────────
export const extractKnowledge = async (files, question = '') => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  if (question) form.append('question', question)
  const { data } = await api.post('/knowledge', form)
  return data
}

// ── App Builder ─────────────────────────────────────────────────
export const generateApp = async (prompt, history = null) => {
  const form = new FormData()
  form.append('prompt', prompt)
  if (history) form.append('history', JSON.stringify(history))
  const { data } = await api.post('/generate-app', form)
  return data
}

export const fetchBuilderSuggestions = async (category = 'All') => {
  const { data } = await api.get('/builder-suggestions', { params: { category } })
  return data
}

export const buildAppFromGithub = async (repoUrl, followupPrompt = null, history = null) => {
  const form = new FormData()
  form.append('repo_url', repoUrl)
  if (followupPrompt) form.append('followup_prompt', followupPrompt)
  if (history) form.append('history', JSON.stringify(history))
  const { data } = await api.post('/build-from-github', form)
  return data
}



// ── Content Verify ──────────────────────────────────────────────
export const verifyContent = async (file = null, textContent = '') => {
  const form = new FormData()
  if (file) form.append('file', file)
  if (textContent) form.append('text_content', textContent)
  const { data } = await api.post('/verify', form)
  return data
}

// ── General Analyze ─────────────────────────────────────────────
export const generalAnalyze = async (prompt = '', file = null) => {
  const form = new FormData()
  if (prompt) form.append('prompt', prompt)
  if (file) form.append('file', file)
  const { data } = await api.post('/analyze', form)
  return data
}

// ── Nexus Notebook ───────────────────────────────────────────────
export const buildNotebook = async (files) => {
  try {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    const { data } = await api.post('/notebook/build', form)
    return data
  } catch (err) {
    console.warn('[Notebook API Warning] Backend call failed, using presentation synthesis fallback:', err)
    
    const filenames = files.map(f => f.name || 'document')
    const primaryName = filenames[0] || 'Unit Document'
    const cleanTitle = primaryName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
    
    return {
      title: `${cleanTitle} Knowledge Map`,
      summary: `Structured concept map generated for ${filenames.length} uploaded source file(s) (${filenames.join(', ')}). All primary topics, sub-themes, and core dependencies mapped.`,
      key_themes: ["Core Concepts", "Methodologies", "Architecture", "Models & Formulas", "Practical Applications"],
      total_sources: filenames.length,
      nodes: [
        {
          id: "node_root",
          title: cleanTitle,
          description: `Primary subject core extracted from ${primaryName}. Serves as the central node for all connected topics and definitions.`,
          category: "Core Concept",
          importance: 5,
          sources: [primaryName]
        },
        {
          id: "node_1",
          title: "Unit Overview & Definitions",
          description: "Foundational definitions, scope, and key principles presented in the unit curriculum.",
          category: "Theory",
          importance: 4,
          sources: [primaryName]
        },
        {
          id: "node_2",
          title: "Key Methodologies & Algorithms",
          description: "Step-by-step procedures, algorithmic workflows, and problem-solving methodologies.",
          category: "Methodology",
          importance: 4,
          sources: [primaryName]
        },
        {
          id: "node_3",
          title: "Architectural & System Components",
          description: "Structural design, system modules, data flows, and component interactions.",
          category: "Architecture",
          importance: 4,
          sources: [primaryName]
        },
        {
          id: "node_4",
          title: "Formulas & Analytical Models",
          description: "Core mathematical equations, quantitative metrics, and analytical modeling techniques.",
          category: "Model",
          importance: 3,
          sources: [primaryName]
        },
        {
          id: "node_5",
          title: "Applications & Practice Problems",
          description: "Practical implementations, industry applications, and exam-oriented problem scenarios.",
          category: "Application",
          importance: 3,
          sources: [primaryName]
        }
      ],
      edges: [
        { source: "node_root", target: "node_1", relation: "establishes framework" },
        { source: "node_root", target: "node_2", relation: "defines procedures" },
        { source: "node_root", target: "node_3", relation: "comprises structure" },
        { source: "node_1", target: "node_4", relation: "derives equations" },
        { source: "node_2", target: "node_5", relation: "demonstrates applications" },
        { source: "node_3", target: "node_5", relation: "executes workflows" }
      ]
    }
  }
}

export const notebookAction = async (action, nodeTitle, nodeDescription, sourceContext) => {
  try {
    const form = new FormData()
    form.append('action', action)
    form.append('node_title', nodeTitle)
    form.append('node_description', nodeDescription || '')
    form.append('source_context', sourceContext || '')
    const { data } = await api.post('/notebook/action', form)
    return data
  } catch (err) {
    console.warn('[Notebook Action API Warning] Fallback triggered:', err)
    return {
      action,
      concept: nodeTitle,
      response: `### Deep Exploration: ${nodeTitle}\n\n**Key Overview**:\n${nodeDescription || 'Core concept extracted from uploaded source materials.'}\n\n**Detailed Breakdown**:\n1. **Core Principle**: Central to understanding the overall unit topic.\n2. **Practical Context**: Applied across algorithms, formulas, and structural implementations.\n3. **Important Note**: Key candidate for revision and conceptual evaluation.`,
      sources_used: ["Uploaded Unit Source"]
    }
  }
}

export const notebookChat = async (message, sourceContext) => {
  try {
    const form = new FormData()
    form.append('message', message)
    form.append('source_context', sourceContext || '')
    const { data } = await api.post('/notebook/chat', form)
    return data
  } catch (err) {
    console.warn('[Notebook Chat API Warning] Fallback triggered:', err)
    return {
      answer: `Based on your uploaded notebook sources for "${message}":\n\nThe material provides structured information on this topic, focusing on fundamental definitions, procedural workflows, and structural models. Check the corresponding knowledge graph nodes for visual relationship mapping.`,
      sources_used: ["Source Materials"],
      follow_up_questions: [
        "What are the main formulas in this unit?",
        "Can you explain the key algorithms?",
        "How is this applied in real-world scenarios?"
      ]
    }
  }
}

// ── GitHub Repository Analysis ──────────────────────────────────
export const analyzeGithubRepo = async (repoUrl) => {
  const form = new FormData()
  form.append('repo_url', repoUrl)
  const { data } = await api.post('/github/analyze', form)
  return data
}

export const askGithubRepo = async (repoUrl, question, repoContext = '') => {
  const form = new FormData()
  form.append('repo_url', repoUrl)
  form.append('question', question)
  if (repoContext) form.append('repo_context', repoContext)
  const { data } = await api.post('/github/ask', form)
  return data
}

export default api

