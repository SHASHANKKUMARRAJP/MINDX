"""
FastAPI Router — GitHub Repository Analysis
"""
from fastapi import APIRouter, Form, HTTPException
from typing import Optional
from services.github_service import fetch_github_repository
from services.gemini_service import analyze_github_repository, ask_github_repository
from schemas.models import GithubRepoAnalysisResponse, GithubAskResponse

router = APIRouter()


@router.post("/github/analyze", response_model=GithubRepoAnalysisResponse)
async def analyze_repo(repo_url: str = Form(...)):
    """Fetch public GitHub repository, analyze architecture, dependencies, structure, and code."""
    try:
        url_str = repo_url.strip()
        if not url_str:
            raise HTTPException(status_code=400, detail="Please provide a valid GitHub repository URL.")

        print(f"[GitHub Router] Fetching repository: {url_str}")
        repo_data = await fetch_github_repository(url_str)

        print(f"[GitHub Router] Analyzing repository with Gemini: {repo_data['owner']}/{repo_data['repo_name']}")
        result = await analyze_github_repository(repo_data)
        return result

    except ValueError as val_err:
        print(f"[GitHub Router Validation Error] {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        print(f"[GitHub Router System Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze repository: {str(e)}")


@router.post("/github/ask", response_model=GithubAskResponse)
async def ask_repo(
    repo_url: str = Form(...),
    question: str = Form(...),
    repo_context: Optional[str] = Form("")
):
    """Answer user questions about an analyzed GitHub repository."""
    try:
        if not question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        result = await ask_github_repository(repo_url, question, repo_context or "")
        return result
    except Exception as e:
        print(f"[GitHub Ask Router Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))
