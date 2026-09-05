from fastapi import APIRouter, Form, HTTPException
from typing import Optional
import json
from services.gemini_service import generate_app, get_builder_suggestions, build_app_from_github
from services.github_service import fetch_github_repository
from schemas.models import AppBuilderResponse, BuilderSuggestionsResponse, GithubBuildAppResponse

router = APIRouter()


@router.post("/generate-app", response_model=AppBuilderResponse)
async def build_app(
    prompt: str = Form(...),
    history: Optional[str] = Form(None),   # JSON string of previous result
):
    try:
        history_obj = None
        if history:
            try:
                history_obj = [json.loads(history)]
            except (json.JSONDecodeError, TypeError) as parse_err:
                print(f"[Builder History Parse Notice] {parse_err}")
                history_obj = None
        
        result = await generate_app(prompt, history_obj)
        return result
    except Exception as e:
        print(f"[Builder API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/builder-suggestions", response_model=BuilderSuggestionsResponse)
async def fetch_builder_suggestions(category: str = "All"):
    try:
        result = await get_builder_suggestions(category)
        return result
    except Exception as e:
        print(f"[Builder Suggestions Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/build-from-github", response_model=GithubBuildAppResponse)
async def build_from_github(
    repo_url: str = Form(...),
    followup_prompt: Optional[str] = Form(None),
    history: Optional[str] = Form(None),
):
    try:
        url_str = repo_url.strip()
        if not url_str:
            raise HTTPException(status_code=400, detail="Please provide a valid GitHub repository URL.")

        print(f"[Builder Router] Fetching repository for app build: {url_str}")
        repo_data = await fetch_github_repository(url_str)

        print(f"[Builder Router] Generating app prototype for: {repo_data['owner']}/{repo_data['repo_name']}")
        result = await build_app_from_github(repo_data, followup_prompt)
        return result
    except ValueError as val_err:
        print(f"[Builder Router Validation Error] {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        print(f"[Builder Router System Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to build app from GitHub repository: {str(e)}")



