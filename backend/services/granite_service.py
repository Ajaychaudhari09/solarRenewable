"""
GridPulse AI — IBM Granite / watsonx.ai Service Layer
Uses the IBM Cloud API key from apikey.json to authenticate.
Falls back to deterministic templates when Granite is unavailable.

Supports:
  - IBM watsonx.ai text generation (ibm/granite-13b-instruct-v2)
  - Auto-IAM token refresh
  - Graceful fallback when project_id not set
"""
from __future__ import annotations
import os
import json
import time
from typing import Any, Dict, Optional
import httpx

IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token"
WATSONX_GENERATE_URL = "{url}/ml/v1/text/generation?version=2023-05-29"
WATSONX_PROJECTS_URL  = "{url}/ml/v1/workspaces?version=2023-05-29"

# Fallback: try to read API key from apikey.json at repo root
# services/ -> backend/ -> solarenergy/ (repo root)
_HERE = os.path.dirname(os.path.abspath(__file__))       # .../backend/services
_BACKEND = os.path.dirname(_HERE)                          # .../backend
_REPO_ROOT = os.path.dirname(_BACKEND)                    # .../solarenergy  (repo root)
_APIKEY_FILE = os.path.join(_REPO_ROOT, "apikey.json")


def _load_apikey_from_file() -> str:
    """Load IBM Cloud API key from apikey.json if present."""
    try:
        with open(_APIKEY_FILE) as f:
            data = json.load(f)
            return data.get("apikey", "")
    except Exception:
        return ""


class GraniteService:
    """IBM Granite / watsonx.ai integration with structured context injection."""

    TOKEN_TTL = 3500  # seconds before refresh (IBM IAM tokens expire in 3600s)

    def __init__(self):
        # Try env first, then file
        self.api_key = (os.getenv("GRANITE_API_KEY", "") or _load_apikey_from_file())
        self.project_id = os.getenv("GRANITE_PROJECT_ID", "")
        self.url = os.getenv("GRANITE_URL", "https://us-south.ml.cloud.ibm.com")
        self.model_id = os.getenv("GRANITE_MODEL_ID", "ibm/granite-13b-instruct-v2")

        self._access_token: Optional[str] = None
        self._token_fetched_at: float = 0.0

        # We're available if we have an API key (project_id optional for some endpoints)
        self.available = bool(self.api_key)

    # ─────────────────────────────────────────────
    # Token management
    # ─────────────────────────────────────────────

    def _get_token(self) -> str:
        """Get a cached IAM token, refreshing if needed."""
        now = time.time()
        if self._access_token and (now - self._token_fetched_at) < self.TOKEN_TTL:
            return self._access_token

        resp = httpx.post(
            IAM_TOKEN_URL,
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": self.api_key,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20,
        )
        resp.raise_for_status()
        self._access_token = resp.json()["access_token"]
        self._token_fetched_at = now
        return self._access_token

    # ─────────────────────────────────────────────
    # Project discovery
    # ─────────────────────────────────────────────

    def _discover_project_id(self, token: str) -> str:
        """Auto-discover the first available watsonx project."""
        try:
            resp = httpx.get(
                f"{self.url}/v2/projects",
                headers={"Authorization": f"Bearer {token}"},
                params={"limit": 1},
                timeout=15,
            )
            if resp.status_code == 200:
                projects = resp.json().get("resources", [])
                if projects:
                    pid = projects[0]["metadata"]["guid"]
                    self.project_id = pid
                    return pid
        except Exception:
            pass
        return ""

    # ─────────────────────────────────────────────
    # Prompt construction
    # ─────────────────────────────────────────────

    def _build_prompt(self, question: str, context: Dict) -> str:
        critical_assets  = context.get("critical_assets", [])
        at_risk          = context.get("at_risk_assets", [])
        immediate        = context.get("immediate_maintenance", {})
        daily_loss       = context.get("daily_loss_inr", 0)
        daily_rev        = context.get("daily_revenue_inr", 0)
        total_gen        = context.get("total_gen_kw", 0)
        grid_risk        = context.get("grid_risk_level", "low")
        carbon           = context.get("carbon_daily_tonnes", 0)
        rca_list         = context.get("rca_results", [])
        alert_count      = len(context.get("critical_alerts", []))

        rca_text = ""
        for r in rca_list[:3]:
            hyps = r.get("hypotheses", [])
            if hyps:
                top = hyps[0]
                rca_text += (f"  - {r['asset_id']}: {top.get('cause','unknown').replace('_',' ')} "
                             f"({top.get('confidence',0)*100:.0f}% confidence)\n")

        context_block = f"""GRIDPULSE AI — VERIFIED OPERATIONAL DATA (do not invent values outside this context):
Total generation   : {total_gen:,.0f} kW
Daily revenue      : INR {daily_rev:,.0f}
Daily energy loss  : INR {daily_loss:,.0f}
Critical alerts    : {alert_count}
Critical assets    : {', '.join(critical_assets) if critical_assets else 'None'}
Assets at risk     : {', '.join(at_risk) if at_risk else 'None'}
Immediate maint.   : {', '.join(immediate.keys()) if immediate else 'None'}
Grid risk level    : {grid_risk}
CO2 avoided today  : {carbon:.2f} tonnes
Root cause findings:
{rca_text if rca_text else '  No active faults detected'}

INSTRUCTIONS:
- You are GridPulse AI Operations Copilot for a solar-wind hybrid park in Kutch, India.
- Answer ONLY using facts from the context above. Do NOT invent sensor readings, prices, or forecasts.
- If the data is unavailable, say: "Data unavailable for this analysis."
- Be concise, professional, and actionable. Maximum 3 short paragraphs.
"""
        return f"{context_block}\nOPERATOR QUESTION: {question}\n\nANSWER:"

    # ─────────────────────────────────────────────
    # Text generation
    # ─────────────────────────────────────────────

    def answer(self, question: str, context: Dict) -> str:
        if not self.available:
            raise RuntimeError("IBM Granite API key not configured")

        token = self._get_token()

        # Auto-discover project if not set
        if not self.project_id:
            self.project_id = self._discover_project_id(token)

        if not self.project_id:
            raise RuntimeError(
                "watsonx.ai project_id not found. "
                "Set GRANITE_PROJECT_ID in .env or ensure the API key has access to a watsonx project."
            )

        prompt = self._build_prompt(question, context)

        payload: Dict[str, Any] = {
            "model_id": self.model_id,
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 350,
                "min_new_tokens": 30,
                "repetition_penalty": 1.1,
                "stop_sequences": ["\n\nOPERATOR", "\n\nGRIDPULSE"],
            },
            "project_id": self.project_id,
        }

        resp = httpx.post(
            WATSONX_GENERATE_URL.format(url=self.url),
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=45,
        )
        resp.raise_for_status()

        result = resp.json()
        generated = result["results"][0]["generated_text"].strip()

        # Strip any prompt echo that leaked through
        if "ANSWER:" in generated:
            generated = generated.split("ANSWER:")[-1].strip()

        return generated

    def test_connection(self) -> Dict[str, Any]:
        """Test IBM Cloud connectivity and return status."""
        if not self.api_key:
            return {"status": "no_api_key", "message": "No IBM Cloud API key configured"}
        try:
            token = self._get_token()
            pid = self.project_id or self._discover_project_id(token)
            return {
                "status": "connected",
                "iam_token_obtained": True,
                "project_id": pid or "not_found",
                "model": self.model_id,
                "url": self.url,
            }
        except httpx.HTTPStatusError as e:
            return {"status": "http_error", "code": e.response.status_code, "detail": str(e)}
        except Exception as e:
            return {"status": "error", "message": str(e)}


def create_granite_service() -> Optional[GraniteService]:
    """Factory — returns service if API key available, else None."""
    svc = GraniteService()
    return svc if svc.available else None
