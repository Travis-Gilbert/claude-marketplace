"""Pydantic models for plan-pro plans."""
from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, Field, field_validator


class Task(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    files: list[Path] = Field(default_factory=list)
    delegate_plugin: str = Field(..., min_length=1)
    acceptance: str = Field(..., min_length=1)

    @field_validator("delegate_plugin")
    @classmethod
    def _no_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("delegate_plugin must be non-empty")
        return v.strip()

    @property
    def full_text(self) -> str:
        return (
            f"# Task {self.id}: {self.title}\n\n"
            f"{self.body}\n\n"
            f"Delegate to: {self.delegate_plugin}"
        )


class Stage(BaseModel):
    number: int = Field(..., ge=1)
    slug: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    tasks: list[Task] = Field(default_factory=list)


class PlanModel(BaseModel):
    title: str
    overview: str
    file_structure: list[Path] = Field(default_factory=list)
    stages: list[Stage] = Field(default_factory=list)
    tasks: list[Task] = Field(default_factory=list)
    is_multi_stage: bool = False

    LARGE_STAGE_THRESHOLD: int = 4
    LARGE_TASK_THRESHOLD: int = 10

    def total_task_count(self) -> int:
        if self.is_multi_stage:
            return sum(len(s.tasks) for s in self.stages)
        return len(self.tasks)

    def is_large(self) -> bool:
        if self.is_multi_stage and len(self.stages) >= self.LARGE_STAGE_THRESHOLD:
            return True
        return self.total_task_count() >= self.LARGE_TASK_THRESHOLD

    def all_tasks(self) -> list[Task]:
        if self.is_multi_stage:
            return [t for s in self.stages for t in s.tasks]
        return list(self.tasks)
