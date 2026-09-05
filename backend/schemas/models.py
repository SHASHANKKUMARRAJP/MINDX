from pydantic import BaseModel
from typing import Optional, List, Any


# ── Reality Scanner ──────────────────────────────────────────────
class RealityObject(BaseModel):
    name: str
    description: str
    confidence: Optional[str] = None
    score: Optional[int] = 90  # Percentage 0-100
    location: Optional[str] = None
    bounding_box: Optional[List[float]] = None  # [ymin, xmin, ymax, xmax] 0-100 percentage


class LabelItem(BaseModel):
    name: str
    score: int  # Percentage 0-100
    category: Optional[str] = "General"


class ColorSwatch(BaseModel):
    hex: str
    name: str
    percentage: Optional[int] = None


class SafeSearchRating(BaseModel):
    adult: str = "Very Unlikely"
    spoof: str = "Very Unlikely"
    medical: str = "Very Unlikely"
    violence: str = "Very Unlikely"
    racy: str = "Very Unlikely"


class RealityScanResponse(BaseModel):
    objects: List[RealityObject]
    labels: List[LabelItem]
    explanation: str
    components: List[str]
    issues: List[str]
    suggested_actions: List[str]
    overall_assessment: str
    dominant_colors: Optional[List[ColorSwatch]] = []
    extracted_text: Optional[str] = None
    spatial_depth: Optional[str] = None
    lighting_condition: Optional[str] = None
    detected_scene_type: Optional[str] = None
    safe_search: Optional[SafeSearchRating] = None
    micro_features: Optional[List[LabelItem]] = []




# ── Second Brain ─────────────────────────────────────────────────
class GraphNode(BaseModel):
    id: str
    label: str
    type: str          # requirement | component | dependency | risk | gap | action
    description: Optional[str] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None


class KnowledgeResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    gaps: List[str]
    next_actions: List[str]
    summary: str


# ── App Builder ──────────────────────────────────────────────────
class AppComponent(BaseModel):
    name: str
    purpose: str
    props: Optional[List[str]] = []


class AppBuilderResponse(BaseModel):
    app_name: str
    description: str
    components: List[AppComponent]
    code: str
    tech_stack: List[str]
    preview_hint: str


class ProjectSuggestion(BaseModel):
    id: str
    name: str
    category: str
    description: str
    problem_solved: str
    key_features: List[str]
    difficulty: str  # Beginner | Intermediate | Advanced
    why_useful: str
    prompt: str


class BuilderSuggestionsResponse(BaseModel):
    category: str
    suggestions: List[ProjectSuggestion]



# ── Verify ───────────────────────────────────────────────────────
class VerifyIndicator(BaseModel):
    label: str
    status: str    # clean | warning | suspicious
    detail: str


class VerifyResponse(BaseModel):
    consistency_score: float   # 0.0 – 1.0
    context_score: float
    indicators: List[VerifyIndicator]
    summary: str
    verdict: str               # "No anomalies detected" | "Possible inconsistencies" | "Multiple anomalies"
    disclaimer: str


# ── General Analyze ──────────────────────────────────────────────
class AnalyzeResponse(BaseModel):
    summary: str
    key_findings: List[str]
    suggested_modules: List[str]
    follow_up_questions: List[str]


# ── Nexus Notebook ────────────────────────────────────────────────
class NotebookNode(BaseModel):
    id: str
    title: str
    type: str          # concept | entity | topic | dependency | fact | gap
    description: Optional[str] = None
    sources: Optional[List[str]] = []      # source filenames that mention this node
    related_concepts: Optional[List[str]] = []  # ids of related nodes


class NotebookEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None
    strength: Optional[float] = 1.0        # 0.0 – 1.0


class NotebookBuildResponse(BaseModel):
    nodes: List[NotebookNode]
    edges: List[NotebookEdge]
    summary: str
    key_themes: List[str]
    total_sources: int
    source_context: Optional[str] = ""


class NotebookActionResponse(BaseModel):
    action: str
    concept: str
    response: str
    sources_used: List[str]


class NotebookChatResponse(BaseModel):
    answer: str
    sources_used: List[str]
    follow_up_questions: List[str]


# ── GitHub Repository Analysis ──────────────────────────────────
class GithubImportantFile(BaseModel):
    path: str
    purpose: str


class GithubComplexityScore(BaseModel):
    level: str  # Low | Medium | High | Enterprise
    explanation: str


class GithubRepoAnalysisResponse(BaseModel):
    repo_name: str
    owner: str
    url: str
    project_overview: str
    problem_solved: str
    features: List[str]
    tech_stack: List[str]
    folder_structure: str
    important_files: List[GithubImportantFile]
    architecture: str
    step_by_step_workflow: List[str]
    api_and_database: str
    ai_ml_components: str
    dependencies: List[str]
    setup_instructions: List[str]
    potential_issues: List[str]
    complexity_score: GithubComplexityScore
    suggested_improvements: List[str]
    extracted_files: Optional[List[dict]] = []
    raw_summary_context: Optional[str] = ""


class GithubAskResponse(BaseModel):
    answer: str
    follow_up_questions: List[str]


class GithubBuildAppResponse(BaseModel):
    app_name: str
    description: str
    components: List[AppComponent]
    code: str
    tech_stack: List[str]
    preview_hint: str
    repo_owner: str
    repo_name: str
    repo_url: str
    original_overview: str
    technologies_detected: List[str]
    features_extracted: List[str]
    files_analyzed_count: int
    files_analyzed: List[str]
    build_spec: str
    raw_summary_context: Optional[str] = ""


