"""
GitHub Service — Public Repository Fetcher & Inspector.
Fetches repository metadata, directory structure, README, configuration, and source files safely.
Enforces security, secret filtering, binary exclusion, and size limits.
Includes fallback direct raw download mode for rate-limited environments.
"""
import os
import re
import httpx
from typing import List, Dict, Tuple, Optional

# Secret file & pattern blocklist
SECRET_PATTERNS = [
    r"^\.env.*",
    r".*\.pem$",
    r".*\.key$",
    r".*id_rsa.*",
    r".*id_ed25519.*",
    r".*credentials.*\.json$",
    r".*secrets?\.yaml$",
    r".*\.p12$",
    r".*\.pfx$",
    r".*\.kdbx$",
    r"client_secret.*\.json$",
    r".*token.*\.json$",
]

# Ignored directory names
IGNORED_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "env",
    ".env",
    "dist",
    "build",
    "__pycache__",
    ".idea",
    ".vscode",
    ".next",
    ".nuget",
    "target",
    "vendor",
}

# Binary file extensions to exclude
BINARY_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp", "ico", "svg", "bmp", "tiff",
    "mp4", "webm", "avi", "mov", "mp3", "wav", "ogg", "flac",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "zip", "tar", "gz", "bz2", "7z", "rar", "iso",
    "exe", "dll", "so", "dylib", "bin", "o", "a", "pyc", "class", "jar",
    "wasm", "woff", "woff2", "ttf", "eot", "otf", "db", "sqlite"
}

# Standard files to probe in direct raw mode if GitHub API is rate-limited
COMMON_PROBE_FILES = [
    "README.md", "README.rst", "README.txt", "README",
    "package.json", "requirements.txt", "pyproject.toml", "Cargo.toml",
    "go.mod", "pom.xml", "build.gradle", "Dockerfile", "docker-compose.yml",
    "Makefile", "setup.py", "tsconfig.json", "vite.config.js", "vite.config.ts",
    "index.js", "main.py", "app.py", "server.js", "src/App.jsx", "src/App.tsx",
    "src/index.js", "src/main.ts", "src/main.rs", "cmd/main.go"
]

# Priority configuration & manifest filenames
PRIORITY_FILENAMES = {
    "readme.md", "readme.rst", "readme.txt", "readme",
    "package.json", "requirements.txt", "pyproject.toml", "pipfile",
    "cargo.toml", "go.mod", "pom.xml", "build.gradle", "build.sbt",
    "dockerfile", "docker-compose.yml", "docker-compose.yaml",
    "makefile", "tsconfig.json", "vite.config.js", "vite.config.ts",
    "next.config.js", "tailwind.config.js", "setup.py"
}

MAX_SINGLE_FILE_BYTES = 100 * 1024  # 100 KB max per file
MAX_TOTAL_FILES_FETCH = 45           # Up to 45 key files
MAX_TOTAL_CHARS_CONTEXT = 120 * 1024 # ~120 KB max total text


def parse_github_url(url: str) -> Tuple[str, str]:
    """Extract (owner, repo) from various GitHub URL formats."""
    cleaned = url.strip()
    # Remove trailing .git and slashes
    cleaned = re.sub(r"\.git$", "", cleaned, flags=re.IGNORECASE).rstrip("/")

    match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)", cleaned, re.IGNORECASE)
    if match:
        return match.group(1), match.group(2)

    parts = [p for p in cleaned.split("/") if p]
    if len(parts) == 2:
        return parts[0], parts[1]

    raise ValueError(f"Invalid GitHub repository URL or format: '{url}'. Expected format: 'https://github.com/owner/repo' or 'owner/repo'.")


def is_secret_file(filename: str) -> bool:
    """Check if filename matches secret / credential patterns."""
    base_name = filename.split("/")[-1].lower()
    for pattern in SECRET_PATTERNS:
        if re.match(pattern, base_name, re.IGNORECASE):
            return True
    return False


def is_binary_file(filename: str) -> bool:
    """Check if file extension indicates binary file."""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    return ext in BINARY_EXTENSIONS


def is_ignored_path(path: str) -> bool:
    """Check if file path belongs to ignored directories."""
    parts = path.split("/")
    for p in parts[:-1]:
        if p.lower() in IGNORED_DIRS:
            return True
    return False


def build_tree_string(tree_items: List[Dict]) -> str:
    """Build a visually clean directory tree representation."""
    paths = sorted([item["path"] for item in tree_items if not is_ignored_path(item["path"])])
    if not paths:
        return "Empty repository structure"
    
    display_paths = paths[:120]
    tree_str = "REPOSITORY STRUCTURE:\n" + "\n".join(f"  ├── {p}" for p in display_paths)
    if len(paths) > 120:
        tree_str += f"\n  └── ... ({len(paths) - 120} additional files omitted for brevity)"
    return tree_str


async def _fetch_via_direct_raw_probe(client: httpx.AsyncClient, owner: str, repo: str) -> Dict:
    """
    Fallback method when GitHub REST API is rate-limited (HTTP 403).
    Fetches raw files directly from raw.githubusercontent.com without hitting API rate limits.
    """
    print(f"[GitHub Service Fallback] Probing raw.githubusercontent.com for {owner}/{repo}...")
    
    branches_to_try = ["master", "main", "dev"]
    working_branch = None
    fetched_files: List[Dict[str, str]] = []
    total_chars = 0

    for branch in branches_to_try:
        # Check README existence to verify branch
        test_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
        res = await client.get(test_url)
        if res.status_code == 200:
            working_branch = branch
            break
        # Or try upper case / rst README
        test_url2 = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.rst"
        res2 = await client.get(test_url2)
        if res2.status_code == 200:
            working_branch = branch
            break

    if not working_branch:
        working_branch = "master"

    # Probe common files
    for file_path in COMMON_PROBE_FILES:
        if total_chars >= MAX_TOTAL_CHARS_CONTEXT:
            break
        raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{working_branch}/{file_path}"
        try:
            raw_res = await client.get(raw_url)
            if raw_res.status_code == 200:
                content_text = raw_res.text
                if "BEGIN RSA PRIVATE KEY" in content_text or "BEGIN PRIVATE KEY" in content_text:
                    continue
                truncated_text = content_text[:15000]
                total_chars += len(truncated_text)
                fetched_files.append({
                    "filename": file_path,
                    "content": truncated_text
                })
        except Exception as e:
            print(f"[GitHub Direct Probe] Error probing {file_path}: {e}")

    if not fetched_files:
        raise ValueError(f"GitHub API rate limit exceeded and repository '{owner}/{repo}' could not be read via raw fallback. Please verify the URL or try again shortly.")

    tree_paths = [f["filename"] for f in fetched_files]
    tree_str = "REPOSITORY STRUCTURE (Direct Raw Probe Mode):\n" + "\n".join(f"  ├── {p}" for p in tree_paths)

    context_parts = [
        f"REPOSITORY: {owner}/{repo}",
        f"URL: https://github.com/{owner}/{repo}",
        f"DEFAULT BRANCH: {working_branch}",
        f"\n{tree_str}\n"
    ]
    for file_obj in fetched_files:
        context_parts.append(f"--- FILE: {file_obj['filename']} ---\n{file_obj['content']}\n")

    return {
        "owner": owner,
        "repo_name": repo,
        "url": f"https://github.com/{owner}/{repo}",
        "description": f"Public GitHub Repository ({owner}/{repo})",
        "language": "Source Code",
        "stars": 0,
        "forks": 0,
        "default_branch": working_branch,
        "tree_str": tree_str,
        "files": fetched_files,
        "raw_summary_context": "\n".join(context_parts)
    }


async def fetch_github_repository(repo_url: str) -> Dict:
    """
    Fetch public repository metadata, file tree, README, dependencies, and core source files.
    """
    owner, repo = parse_github_url(repo_url)
    
    headers = {
        "User-Agent": "Gemini-Nexus-GitHub-Analyzer",
        "Accept": "application/vnd.github.v3+json"
    }

    # Optional GitHub Token from environment
    github_token = os.getenv("GITHUB_TOKEN") or os.getenv("GITHUB_API_KEY")
    if github_token:
        headers["Authorization"] = f"token {github_token}"
        print(f"[GitHub Service] Using authenticated GitHub token header.")

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=headers) as client:
        # 1. Fetch Repository Metadata
        repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        res = await client.get(repo_api_url)

        if res.status_code == 404:
            # Fallback to direct raw probe in case 404 is API obfuscation or rate limit
            try:
                return await _fetch_via_direct_raw_probe(client, owner, repo)
            except Exception:
                raise ValueError(f"GitHub repository '{owner}/{repo}' not found or is private. MINDX Nexus supports public GitHub repositories only.")

        elif res.status_code == 403:
            # Rate limit exceeded on REST API -> Use direct raw download fallback!
            print(f"[GitHub Service] API 403 Rate Limit hit for '{owner}/{repo}'. Switching to direct raw file mode.")
            return await _fetch_via_direct_raw_probe(client, owner, repo)

        elif res.status_code != 200:
            return await _fetch_via_direct_raw_probe(client, owner, repo)

        repo_data = res.json()
        if repo_data.get("private", False):
            raise ValueError(f"Repository '{owner}/{repo}' is private. MINDX Nexus supports public GitHub repositories only.")

        default_branch = repo_data.get("default_branch", "main")
        description = repo_data.get("description") or "No description provided."
        stars = repo_data.get("stargazers_count", 0)
        forks = repo_data.get("forks_count", 0)
        language = repo_data.get("language") or "Unspecified"

        # 2. Fetch Git Tree
        tree_api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        tree_res = await client.get(tree_api_url)
        
        tree_items = []
        if tree_res.status_code == 200:
            tree_data = tree_res.json()
            tree_items = [item for item in tree_data.get("tree", []) if item.get("type") == "blob"]

        tree_str = build_tree_string(tree_items) if tree_items else "Directory tree unavailable"

        # 3. Select key files to download
        candidate_files = []
        for item in tree_items:
            path = item.get("path", "")
            size = item.get("size", 0)

            if is_ignored_path(path) or is_secret_file(path) or is_binary_file(path):
                continue
            if size > MAX_SINGLE_FILE_BYTES:
                continue
            candidate_files.append(path)

        # Sort candidate files by priority
        def file_priority(path: str) -> int:
            base_lower = path.split("/")[-1].lower()
            if base_lower in PRIORITY_FILENAMES:
                return 0
            if "readme" in base_lower:
                return 0
            if "/" not in path:  # root level files
                return 1
            if path.startswith("src/") or path.startswith("lib/") or path.startswith("app/") or path.startswith("backend/"):
                return 2
            if path.endswith(".md") or path.endswith(".rst"):
                return 3
            return 4

        candidate_files.sort(key=file_priority)
        selected_files = candidate_files[:MAX_TOTAL_FILES_FETCH]

        if not selected_files:
            return await _fetch_via_direct_raw_probe(client, owner, repo)

        # 4. Raw contents download via raw.githubusercontent.com
        fetched_files: List[Dict[str, str]] = []
        total_chars = 0

        for file_path in selected_files:
            if total_chars >= MAX_TOTAL_CHARS_CONTEXT:
                break

            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{file_path}"
            try:
                raw_res = await client.get(raw_url)
                if raw_res.status_code == 200:
                    content_text = raw_res.text
                    if "BEGIN RSA PRIVATE KEY" in content_text or "BEGIN PRIVATE KEY" in content_text:
                        continue
                    
                    max_chunk = min(15000, MAX_TOTAL_CHARS_CONTEXT - total_chars)
                    truncated_text = content_text[:max_chunk]
                    total_chars += len(truncated_text)

                    fetched_files.append({
                        "filename": file_path,
                        "content": truncated_text
                    })
            except Exception as err:
                print(f"[GitHub Service] Failed to fetch raw file '{file_path}': {err}")

        if not fetched_files:
            return await _fetch_via_direct_raw_probe(client, owner, repo)

        # Build raw summary context for prompt
        context_parts = [
            f"REPOSITORY: {owner}/{repo}",
            f"URL: https://github.com/{owner}/{repo}",
            f"PRIMARY LANGUAGE: {language}",
            f"DESCRIPTION: {description}",
            f"STARS: {stars} | FORKS: {forks}",
            f"\n{tree_str}\n"
        ]

        for file_obj in fetched_files:
            context_parts.append(f"--- FILE: {file_obj['filename']} ---\n{file_obj['content']}\n")

        raw_summary_context = "\n".join(context_parts)

        return {
            "owner": owner,
            "repo_name": repo,
            "url": f"https://github.com/{owner}/{repo}",
            "description": description,
            "language": language,
            "stars": stars,
            "forks": forks,
            "default_branch": default_branch,
            "tree_str": tree_str,
            "files": fetched_files,
            "raw_summary_context": raw_summary_context
        }
