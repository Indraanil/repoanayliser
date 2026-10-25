"""
HR Service
----------
Provides HR management capabilities:
1. Multi-project contributor & commit aggregation across all analyzed repositories.
2. Developer commit history & deep commit impact analysis.
3. PR (Pull Request) notification feed & event tracking.
4. HR Authentication & Session management.
"""

import json
import logging
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class HRService:
    def __init__(self, workspace_dir: Optional[str] = None, data_dir: Optional[str] = None):
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.workspace_dir = Path(workspace_dir or (base_dir / "workspace"))
        self.data_dir = Path(data_dir or (base_dir / ".data"))
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.notifications_file = self.data_dir / "hr_notifications.json"
        self._init_default_notifications()

    def _init_default_notifications(self):
        """Seed default PR notifications if none exist."""
        if not self.notifications_file.exists():
            default_notifications = [
                {
                    "id": "pr-101",
                    "repo_name": "repoanayliser",
                    "repo_id": "eac55829cf3ea1d6",
                    "pr_number": 1,
                    "title": "feat: add Graph RAG project chat assistant",
                    "author": "NHR-09",
                    "author_email": "NHR-09@users.noreply.github.com",
                    "source_branch": "feat/project-chat-assistant",
                    "target_branch": "main",
                    "status": "merged",
                    "created_at": datetime.fromtimestamp(1792876785).isoformat(),
                    "read": False,
                    "commit_hash": "b92b6fea0097a68212f88b4df23f8223fe7ef812",
                    "description": "Integrated Qdrant 768-dim Graph RAG query pipeline and interactive chat assistant UI.",
                    "changed_files_count": 9,
                    "impact_level": "medium"
                },
                {
                    "id": "pr-102",
                    "repo_name": "ai-task-planner",
                    "repo_id": "1072ddb2dce82dcb",
                    "pr_number": 4,
                    "title": "fix: resolve plan ID override & dependency cycle detector",
                    "author": "NHR-09",
                    "author_email": "NIHAR.MEHAKARE24@VIT.EDU",
                    "source_branch": "bugfix/plan-override",
                    "target_branch": "main",
                    "status": "open",
                    "created_at": datetime.fromtimestamp(1767251137).isoformat(),
                    "read": False,
                    "commit_hash": "4243351dd80c9f1727a565820a450fe8a2dc5150",
                    "description": "Fixes automated task dependency scheduling and prevents silent plan ID overwriting.",
                    "changed_files_count": 4,
                    "impact_level": "high"
                },
                {
                    "id": "pr-103",
                    "repo_name": "attendance-backend",
                    "repo_id": "dc2e75b2aed15bf7",
                    "pr_number": 2,
                    "title": "feat: add Haar fallback for face verification + validation",
                    "author": "NHR-09",
                    "author_email": "NHR-09@users.noreply.github.com",
                    "source_branch": "feat/haar-cascade",
                    "target_branch": "main",
                    "status": "open",
                    "created_at": datetime.fromtimestamp(1776078878).isoformat(),
                    "read": False,
                    "commit_hash": "a76cdca91acc5a9fcef71218cd52389e18ce5018",
                    "description": "Implements graceful degradation when deep learning model weights are unavailable.",
                    "changed_files_count": 3,
                    "impact_level": "medium"
                }
            ]
            try:
                with open(self.notifications_file, "w", encoding="utf-8") as f:
                    json.dump(default_notifications, f, indent=2)
            except Exception as e:
                logger.error(f"Failed to write default notifications: {e}")

    def authenticate_hr(self, username: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Simple HR authentication flow."""
        clean_user = username.strip().lower()
        # Default test credentials or any valid corporate HR email
        is_hr = (
            clean_user == "hr@architech.io" or
            "hr" in clean_user or
            clean_user == "admin" or
            clean_user.endswith("@architech.io")
        )
        if not is_hr and clean_user != "user":
            # Allow flexible demo login
            pass

        return {
            "token": f"hr_token_{int(datetime.now().timestamp())}",
            "user": {
                "email": username.strip(),
                "name": username.split("@")[0].capitalize() if "@" in username else username.strip(),
                "role": "hr",
                "permissions": ["view_all_commits", "manage_contributors", "review_prs", "view_analytics"]
            }
        }

    def _get_workspace_repos(self, registered_repos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Combine registered repositories with any git workspaces."""
        repos = []
        seen_paths = set()

        for r in registered_repos:
            path_str = r.get("path", "")
            full_path = self.workspace_dir / path_str.replace("workspace\\", "").replace("workspace/", "")
            if not full_path.exists():
                full_path = Path(path_str)
            if full_path.exists() and (full_path / ".git").exists():
                repos.append({
                    "repo_id": r.get("repo_id"),
                    "name": r.get("name") or full_path.name,
                    "path": str(full_path.resolve())
                })
                seen_paths.add(str(full_path.resolve()).lower())

        # Also discover subfolders in workspace_dir
        if self.workspace_dir.exists():
            for sub in self.workspace_dir.iterdir():
                if sub.is_dir() and (sub / ".git").exists():
                    sub_res = str(sub.resolve())
                    if sub_res.lower() not in seen_paths:
                        repos.append({
                            "repo_id": sub.name.lower().replace(" ", "-"),
                            "name": sub.name,
                            "path": sub_res
                        })
                        seen_paths.add(sub_res.lower())

        # Also add root project if valid git repo
        root_repo = self.workspace_dir.parent.parent
        if (root_repo / ".git").exists() and str(root_repo.resolve()).lower() not in seen_paths:
            repos.append({
                "repo_id": "root-repoanayliser",
                "name": "repoanayliser (Current Workspace)",
                "path": str(root_repo.resolve())
            })

        return repos

    def get_cross_project_contributors(self, registered_repos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Aggregate all developer contributions across every project repository.
        Returns grouped contributors with their per-project commit counts.
        """
        repos = self._get_workspace_repos(registered_repos)
        contributors_map: Dict[str, Dict[str, Any]] = {}

        for repo in repos:
            repo_path = repo["path"]
            repo_name = repo["name"]
            repo_id = repo["repo_id"]

            try:
                cmd = ["git", "-C", repo_path, "log", "-n", "100", "--format=%H|%an|%ae|%at|%s"]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=10, encoding="utf-8", errors="replace")
                if res.returncode != 0 or not res.stdout.strip():
                    continue

                for line in res.stdout.strip().splitlines():
                    parts = line.split("|", 4)
                    if len(parts) < 5:
                        continue
                    chash, author_name, author_email, ts_str, msg = parts
                    try:
                        timestamp = int(ts_str)
                    except ValueError:
                        timestamp = int(datetime.now().timestamp())

                    # Normalize identifier
                    dev_key = (author_email.lower().strip() or author_name.lower().strip())
                    if not dev_key:
                        continue

                    if dev_key not in contributors_map:
                        contributors_map[dev_key] = {
                            "developer_id": dev_key,
                            "developer": author_name,
                            "email": author_email,
                            "total_commits": 0,
                            "projects": {},
                            "latest_timestamp": 0,
                            "latest_commit": None,
                            "first_timestamp": timestamp,
                        }

                    c_entry = contributors_map[dev_key]
                    c_entry["total_commits"] += 1

                    # Project breakdown
                    if repo_name not in c_entry["projects"]:
                        c_entry["projects"][repo_name] = {
                            "repo_id": repo_id,
                            "repo_name": repo_name,
                            "commits_count": 0,
                            "latest_commit": msg,
                            "latest_timestamp": timestamp
                        }

                    proj_entry = c_entry["projects"][repo_name]
                    proj_entry["commits_count"] += 1
                    if timestamp > proj_entry["latest_timestamp"]:
                        proj_entry["latest_timestamp"] = timestamp
                        proj_entry["latest_commit"] = msg

                    # Global latest
                    if timestamp > c_entry["latest_timestamp"]:
                        c_entry["latest_timestamp"] = timestamp
                        c_entry["developer"] = author_name  # keep freshest name
                        c_entry["latest_commit"] = {
                            "hash": chash[:8],
                            "full_hash": chash,
                            "repo_name": repo_name,
                            "repo_id": repo_id,
                            "message": msg,
                            "date": datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")
                        }

                    if timestamp < c_entry["first_timestamp"]:
                        c_entry["first_timestamp"] = timestamp

            except Exception as e:
                logger.warning(f"Error inspecting git log in {repo_path}: {e}")

        result_list = []
        for dev_key, data in contributors_map.items():
            proj_list = list(data["projects"].values())
            proj_list.sort(key=lambda p: p["commits_count"], reverse=True)
            result_list.append({
                "developer_id": data["developer_id"],
                "developer": data["developer"],
                "email": data["email"],
                "total_commits": data["total_commits"],
                "repositories_count": len(data["projects"]),
                "projects": proj_list,
                "latest_commit": data["latest_commit"],
                "last_active": datetime.fromtimestamp(data["latest_timestamp"]).strftime("%Y-%m-%d %H:%M") if data["latest_timestamp"] else "Unknown",
                "first_active": datetime.fromtimestamp(data["first_timestamp"]).strftime("%Y-%m-%d") if data["first_timestamp"] else "Unknown"
            })

        result_list.sort(key=lambda x: x["total_commits"], reverse=True)
        return result_list

    def get_developer_commits(
        self,
        developer_id: str,
        registered_repos: List[Dict[str, Any]],
        repo_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve complete chronological commit history for a particular person across all projects.
        """
        repos = self._get_workspace_repos(registered_repos)
        clean_dev = developer_id.lower().strip()
        all_commits = []

        for repo in repos:
            repo_path = repo["path"]
            repo_name = repo["name"]
            repo_id = repo["repo_id"]

            if repo_filter and repo_filter not in [repo_id, repo_name]:
                continue

            try:
                cmd = ["git", "-C", repo_path, "log", "-n", "100", "--format=%H|%an|%ae|%at|%s"]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=10, encoding="utf-8", errors="replace")
                if res.returncode != 0 or not res.stdout.strip():
                    continue

                for line in res.stdout.strip().splitlines():
                    parts = line.split("|", 4)
                    if len(parts) < 5:
                        continue
                    chash, author_name, author_email, ts_str, msg = parts

                    # Check match against developer_id
                    match = (
                        clean_dev in author_email.lower() or
                        clean_dev in author_name.lower() or
                        author_email.lower().strip() == clean_dev or
                        author_name.lower().strip() == clean_dev
                    )
                    if not match:
                        continue

                    try:
                        timestamp = int(ts_str)
                    except ValueError:
                        timestamp = int(datetime.now().timestamp())

                    all_commits.append({
                        "commit_hash": chash,
                        "short_hash": chash[:8],
                        "message": msg,
                        "timestamp": timestamp,
                        "date": datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M"),
                        "author_name": author_name,
                        "author_email": author_email,
                        "repo_name": repo_name,
                        "repo_id": repo_id,
                        "analysis_url": f"/hr/commit-analysis/{repo_id}/{chash}"
                    })

            except Exception as e:
                logger.warning(f"Error fetching commits for {clean_dev} in {repo_path}: {e}")

        all_commits.sort(key=lambda c: c["timestamp"], reverse=True)
        return all_commits

    def analyze_commit(self, repo_id: str, commit_hash: str, registered_repos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Detailed architectural & diff analysis for an individual commit.
        """
        repos = self._get_workspace_repos(registered_repos)
        target_repo = next((r for r in repos if r["repo_id"] == repo_id or r["name"] == repo_id), None)
        if not target_repo:
            return {"error": f"Repository '{repo_id}' not found"}

        repo_path = target_repo["path"]
        repo_name = target_repo["name"]

        try:
            # 1. Commit Metadata
            log_cmd = ["git", "-C", repo_path, "log", "-1", "--format=%H|%an|%ae|%at|%s|%B", commit_hash]
            log_res = subprocess.run(log_cmd, capture_output=True, text=True, timeout=10, encoding="utf-8", errors="replace")
            log_parts = log_res.stdout.strip().split("|", 5)

            full_hash = log_parts[0] if len(log_parts) > 0 else commit_hash
            author_name = log_parts[1] if len(log_parts) > 1 else "Unknown"
            author_email = log_parts[2] if len(log_parts) > 2 else "Unknown"
            ts = int(log_parts[3]) if len(log_parts) > 3 and log_parts[3].isdigit() else int(datetime.now().timestamp())
            subject = log_parts[4] if len(log_parts) > 4 else "Commit"
            full_msg = log_parts[5] if len(log_parts) > 5 else subject

            # 2. Changed Files Stat
            stat_cmd = ["git", "-C", repo_path, "show", "--stat", "--oneline", commit_hash]
            stat_res = subprocess.run(stat_cmd, capture_output=True, text=True, timeout=10, encoding="utf-8", errors="replace")

            # 3. Status per file (Added, Modified, Deleted)
            diff_tree_cmd = ["git", "-C", repo_path, "diff-tree", "--no-commit-id", "--name-status", "-r", "--root", commit_hash]
            diff_tree_res = subprocess.run(diff_tree_cmd, capture_output=True, text=True, timeout=10, encoding="utf-8", errors="replace")

            files_status = []
            for line in diff_tree_res.stdout.strip().splitlines():
                if not line.strip():
                    continue
                parts = line.split(None, 1)
                if len(parts) == 2:
                    status_code, fpath = parts
                    status_map = {"A": "Added", "M": "Modified", "D": "Deleted", "R": "Renamed"}
                    files_status.append({
                        "file": fpath,
                        "status": status_map.get(status_code[0], "Modified"),
                        "is_critical": any(k in fpath.lower() for k in ["main.py", "config", "auth", "security", "connection", "migration"])
                    })

            # Calculate risk heuristics
            critical_files = [f["file"] for f in files_status if f["is_critical"]]
            risk_score = min(100, len(files_status) * 8 + len(critical_files) * 25)
            risk_level = "low"
            if risk_score >= 70:
                risk_level = "high"
            elif risk_score >= 35:
                risk_level = "medium"

            return {
                "commit_hash": full_hash,
                "short_hash": full_hash[:8],
                "repo_name": repo_name,
                "repo_id": repo_id,
                "author": author_name,
                "email": author_email,
                "date": datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S"),
                "subject": subject,
                "full_message": full_msg.strip(),
                "stat_summary": stat_res.stdout.strip(),
                "files_count": len(files_status),
                "files": files_status,
                "critical_files_count": len(critical_files),
                "critical_files": critical_files,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "architectural_impact": (
                    f"Modifies {len(files_status)} files ({len(critical_files)} architectural core modules). "
                    f"Structural impact estimated as {risk_level.upper()}."
                )
            }

        except Exception as e:
            logger.error(f"Commit analysis failed for {commit_hash} in {repo_path}: {e}")
            return {"error": f"Failed to analyze commit: {str(e)}"}

    def get_pr_notifications(self) -> Dict[str, Any]:
        """Fetch all PR notifications and unread counter."""
        if not self.notifications_file.exists():
            self._init_default_notifications()

        try:
            with open(self.notifications_file, "r", encoding="utf-8") as f:
                notifications = json.load(f)
        except Exception:
            notifications = []

        unread_count = sum(1 for n in notifications if not n.get("read", False))
        return {
            "total": len(notifications),
            "unread_count": unread_count,
            "notifications": notifications
        }

    def mark_notification_read(self, notification_id: str) -> Dict[str, Any]:
        """Mark a PR notification as read."""
        if not self.notifications_file.exists():
            return {"status": "not_found"}

        try:
            with open(self.notifications_file, "r", encoding="utf-8") as f:
                notifications = json.load(f)
            updated = False
            for n in notifications:
                if n.get("id") == notification_id:
                    n["read"] = True
                    updated = True
                    break

            if updated:
                with open(self.notifications_file, "w", encoding="utf-8") as f:
                    json.dump(notifications, f, indent=2)

            return {"status": "success", "id": notification_id}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def create_pr_notification(self, pr_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or receive a new PR notification."""
        notifs_data = self.get_pr_notifications()["notifications"]
        new_id = f"pr-{int(datetime.now().timestamp())}"
        new_item = {
            "id": new_id,
            "repo_name": pr_data.get("repo_name", "repoanayliser"),
            "repo_id": pr_data.get("repo_id", "eac55829cf3ea1d6"),
            "pr_number": pr_data.get("pr_number", len(notifs_data) + 1),
            "title": pr_data.get("title", "New Pull Request"),
            "author": pr_data.get("author", "Developer"),
            "author_email": pr_data.get("author_email", "developer@architech.io"),
            "source_branch": pr_data.get("source_branch", "feature/update"),
            "target_branch": pr_data.get("target_branch", "main"),
            "status": "open",
            "created_at": datetime.now().isoformat(),
            "read": False,
            "commit_hash": pr_data.get("commit_hash", ""),
            "description": pr_data.get("description", "A new pull request was submitted for review."),
            "changed_files_count": pr_data.get("changed_files_count", 3),
            "impact_level": pr_data.get("impact_level", "medium")
        }
        notifs_data.insert(0, new_item)
        try:
            with open(self.notifications_file, "w", encoding="utf-8") as f:
                json.dump(notifs_data, f, indent=2)
            return {"status": "created", "notification": new_item}
        except Exception as e:
            return {"status": "error", "message": str(e)}
