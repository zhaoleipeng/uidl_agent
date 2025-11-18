"""UIDL agent capable of understanding requirements and editing UIDL JSON.

The agent is intentionally framework-agnostic but exposes integration points
for LangChain or LangGraph pipelines.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List, Mapping, Optional


@dataclass
class UIDLPlanStep:
    """Represents a single todo item for UIDL modification."""

    title: str
    target_section: str
    rationale: str
    patch_hint: Optional[str] = None


@dataclass
class UIDLSectionKnowledge:
    """Stores knowledge about one UIDL section for quick recall."""

    name: str
    path: List[str]
    payload: Any
    description: str = ""


class UIDLAgent:
    """Agent for reasoning over a UIDL document and applying modifications."""

    def __init__(self, uidl: Mapping[str, Any]):
        self.uidl = dict(uidl)
        self.sections: Dict[str, UIDLSectionKnowledge] = self._extract_sections()

    def _extract_sections(self) -> Dict[str, UIDLSectionKnowledge]:
        """Index key UIDL sections to enable targeted reasoning."""

        mapping: Dict[str, UIDLSectionKnowledge] = {}
        for key, description in [
            ("name", "页面基础信息"),
            ("importMaps", "依赖包映射"),
            ("nodeUIDL", "节点树"),
            ("resources", "资源定义"),
            ("observerDataSources", "数据请求"),
            ("flows", "流程编排"),
        ]:
            if key in self.uidl:
                mapping[key] = UIDLSectionKnowledge(
                    name=key,
                    path=[key],
                    payload=self.uidl[key],
                    description=description,
                )
        return mapping

    def understand_requirements(self, requirement: str) -> str:
        """Produce a concise understanding of the requirement."""

        return (
            "基于输入的需求，将其映射到 UIDL 的六大板块："
            "页面基础信息、依赖、节点树、资源、数据源、流程编排。"
            "代理会先对需求进行拆解，再映射到可修改的 JSON 区域。"
        )

    def create_todo(self, requirement: str) -> List[UIDLPlanStep]:
        """Generate a todo list aligned to UIDL sections."""

        todos: List[UIDLPlanStep] = []
        keywords = {
            "form": "nodeUIDL",
            "表单": "nodeUIDL",
            "接口": "observerDataSources",
            "流程": "flows",
            "依赖": "importMaps",
            "资源": "resources",
            "页面": "name",
        }
        matched_sections = {value for key, value in keywords.items() if key in requirement}
        if not matched_sections:
            matched_sections = set(self.sections.keys())

        for section in matched_sections:
            knowledge = self.sections.get(section)
            rationale = f"需求涉及 {section}，需要检查并更新对应 JSON。"
            todos.append(
                UIDLPlanStep(
                    title=f"更新 {section}",
                    target_section=section,
                    rationale=rationale,
                    patch_hint=(knowledge.description if knowledge else None),
                )
            )
        return todos

    def recall_section(self, section: str) -> UIDLSectionKnowledge:
        """Return cached knowledge for a specific section."""

        if section not in self.sections:
            raise KeyError(f"未知的 UIDL 板块: {section}")
        return self.sections[section]

    def apply_modification(
        self,
        section: str,
        mutator: Callable[[Any], Any],
    ) -> None:
        """Apply a mutation function to a section and refresh caches."""

        knowledge = self.recall_section(section)
        updated = mutator(knowledge.payload)
        self.uidl[section] = updated
        self.sections = self._extract_sections()

    def propose_patch(
        self, requirement: str, mutators: Optional[Dict[str, Callable[[Any], Any]]] = None
    ) -> Mapping[str, Any]:
        """High-level helper to generate todos and apply optional mutators."""

        todos = self.create_todo(requirement)
        applied = []
        for step in todos:
            if mutators and step.target_section in mutators:
                self.apply_modification(step.target_section, mutators[step.target_section])
                applied.append(step.target_section)
        return {
            "todos": [step.__dict__ for step in todos],
            "applied": applied,
            "uidl": self.uidl,
        }

    @classmethod
    def from_json_file(cls, path: Path) -> "UIDLAgent":
        import json

        data = json.loads(path.read_text(encoding="utf-8"))
        return cls(data)


def demo(requirement: str, uidl_path: Path) -> Mapping[str, Any]:
    """Simple demo entrypoint used by __main__ to showcase the agent."""

    agent = UIDLAgent.from_json_file(uidl_path)
    update_type_hint = lambda node_uidl: node_uidl  # noqa: E731
    mutators = {"nodeUIDL": update_type_hint}
    return agent.propose_patch(requirement, mutators)


if __name__ == "__main__":
    import json

    sample_path = Path(__file__).resolve().parent.parent / "samples" / "page.json"
    result = demo("需要调整表单和接口，补充流程", sample_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
