"""
GridPulse AI — Base Agent Framework
All agents inherit from BaseAgent and return AgentResult.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict
import uuid
import traceback


class BaseAgent(ABC):
    agent_id: str = "base_agent"
    version: str = "1.0"

    def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent with full error handling and contract wrapping."""
        run_id = str(uuid.uuid4())
        started = datetime.utcnow()
        try:
            result = self._run(inputs)
            result["agent_id"] = self.agent_id
            result["run_id"] = run_id
            result["timestamp"] = datetime.utcnow().isoformat()
            if "status" not in result:
                result["status"] = "success"
            if "inputs" not in result:
                result["inputs"] = {k: v for k, v in inputs.items()
                                    if not isinstance(v, (list,)) or len(v) < 10}
            if "warnings" not in result:
                result["warnings"] = []
            if "next_actions" not in result:
                result["next_actions"] = []
            if "evidence" not in result:
                result["evidence"] = []
            return result
        except Exception as exc:
            return {
                "agent_id": self.agent_id,
                "run_id": run_id,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "error",
                "confidence": 0.0,
                "data_quality": 0.0,
                "inputs": {},
                "results": {},
                "evidence": [],
                "warnings": [f"Agent error: {str(exc)}"],
                "next_actions": [],
                "error_detail": traceback.format_exc(),
            }

    @abstractmethod
    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        pass
