import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const { data } = await api.post('/notebook/build', form)
  return data
}

export const notebookAction = async (action, nodeTitle, nodeDescription, sourceContext) => {
  const form = new FormData()
  form.append('action', action)
  form.append('node_title', nodeTitle)
  form.append('node_description', nodeDescription || '')
  form.append('source_context', sourceContext || '')
  const { data } = await api.post('/notebook/action', form)
  return data
}

export const notebookChat = async (message, sourceContext) => {
  const form = new FormData()
  form.append('message', message)
  form.append('source_context', sourceContext || '')
  const { data } = await api.post('/notebook/chat', form)
  return data
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

