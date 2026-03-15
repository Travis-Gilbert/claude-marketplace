"""
Firecrawl to Corpus Example
==============================
Demonstrates the Firecrawl scraping pipeline: define target URLs, scrape
via Firecrawl, clean the markdown output, store as Objects in research_api,
and tag with source metadata for provenance.

Pipeline:
  define URLs -> scrape via Firecrawl -> clean markdown -> store as Objects
  -> tag with source metadata -> deduplicate via SHA

Key concepts:
  - Firecrawl returns markdown-formatted content from web pages
  - Content cleaning: strip navigation, ads, boilerplate
  - Objects store the cleaned content with full source provenance
  - SHA-hash identity prevents duplicate ingestion
  - Rate limiting to respect target sites
  - Objects enter as 'draft' status (LLMs propose, humans review)
"""

import hashlib
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode import: Firecrawl (requires API key, not always available)
# ---------------------------------------------------------------------------
try:
    from firecrawl import FirecrawlApp
    _FIRECRAWL_AVAILABLE = True
except ImportError:
    _FIRECRAWL_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class ScrapeTarget:
    """A URL to scrape with configuration."""
    url: str
    tags: list[str] = field(default_factory=list)
    max_depth: int = 0        # 0 = single page, 1+ = follow links
    include_patterns: list[str] = field(default_factory=list)
    exclude_patterns: list[str] = field(default_factory=list)


@dataclass
class ScrapedObject:
    """An Object created from scraped web content.

    Per architectural invariant #10: every epistemic primitive carries
    its provenance. Scraped Objects record source URL, scrape timestamp,
    and cleaning steps applied.
    """
    title: str
    body: str                  # cleaned markdown content
    object_type: str = "source"
    status: str = "draft"      # draft -> reviewed -> canonical
    source_url: str = ""
    scraped_at: datetime = field(default_factory=datetime.utcnow)
    cleaning_steps: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    word_count: int = 0
    sha: str = ""

    def __post_init__(self):
        self.word_count = len(self.body.split())
        if not self.sha:
            self.sha = self._generate_sha()

    def _generate_sha(self) -> str:
        """SHA-hash identity for deduplication.
        Based on URL + content hash to catch both exact duplicates
        and re-scrapes of updated pages."""
        payload = f"{self.source_url}|{hashlib.md5(self.body.encode()).hexdigest()}"
        return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Stage 1: Scrape URLs via Firecrawl
# ---------------------------------------------------------------------------
def scrape_urls(
    targets: list[ScrapeTarget],
    api_key: str = "",
    rate_limit_seconds: float = 2.0,
) -> list[dict]:
    """Scrape target URLs using Firecrawl API.

    Firecrawl handles JavaScript rendering, cookie consent dialogs,
    and returns clean markdown. Rate limiting is enforced between requests.

    Falls back to a simple requests-based scraper if Firecrawl is unavailable.
    """
    results = []

    if _FIRECRAWL_AVAILABLE and api_key:
        app = FirecrawlApp(api_key=api_key)

        for i, target in enumerate(targets):
            logger.info("Scraping [%d/%d]: %s", i + 1, len(targets), target.url)

            try:
                result = app.scrape_url(
                    target.url,
                    params={
                        "formats": ["markdown"],
                        "onlyMainContent": True,
                    },
                )
                results.append({
                    "url": target.url,
                    "markdown": result.get("markdown", ""),
                    "metadata": result.get("metadata", {}),
                    "tags": target.tags,
                    "success": True,
                })
            except Exception as e:
                logger.error("Failed to scrape %s: %s", target.url, e)
                results.append({
                    "url": target.url,
                    "markdown": "",
                    "metadata": {},
                    "tags": target.tags,
                    "success": False,
                    "error": str(e),
                })

            # Rate limiting
            if i < len(targets) - 1:
                time.sleep(rate_limit_seconds)
    else:
        # Fallback: simple requests-based scraping
        results = _scrape_fallback(targets, rate_limit_seconds)

    successful = sum(1 for r in results if r["success"])
    logger.info("Scraped %d/%d URLs successfully", successful, len(targets))
    return results


def _scrape_fallback(
    targets: list[ScrapeTarget],
    rate_limit_seconds: float,
) -> list[dict]:
    """Simple fallback scraper using requests + BeautifulSoup.
    Less capable than Firecrawl (no JS rendering) but works without API key."""
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        logger.warning("Neither Firecrawl nor requests+bs4 available")
        return [{"url": t.url, "markdown": "", "tags": t.tags,
                 "success": False, "error": "No scraper available"} for t in targets]

    results = []
    for i, target in enumerate(targets):
        try:
            resp = requests.get(target.url, timeout=30,
                                headers={"User-Agent": "research_api/1.0"})
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove scripts, styles, nav elements
            for tag in soup(["script", "style", "nav", "header", "footer"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            results.append({
                "url": target.url,
                "markdown": text,
                "metadata": {"title": soup.title.string if soup.title else ""},
                "tags": target.tags,
                "success": True,
            })
        except Exception as e:
            results.append({
                "url": target.url, "markdown": "", "tags": target.tags,
                "success": False, "error": str(e),
            })

        if i < len(targets) - 1:
            time.sleep(rate_limit_seconds)

    return results


# ---------------------------------------------------------------------------
# Stage 2: Clean scraped content
# ---------------------------------------------------------------------------
import re

# Patterns to remove from scraped markdown
BOILERPLATE_PATTERNS = [
    r"^#{1,6}\s*(cookie|privacy|terms|subscribe|newsletter|sign up|log in).*$",
    r"^\s*\[.*\]\(#.*\)\s*$",              # anchor-only links
    r"^(share|tweet|pin|email)\s*$",        # social sharing buttons
    r"^\s*advertisement\s*$",
    r"^copyright\s*.*\d{4}.*$",
    r"^\s*all rights reserved.*$",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE | re.MULTILINE)
                     for p in BOILERPLATE_PATTERNS]


def clean_markdown(raw_markdown: str) -> tuple[str, list[str]]:
    """Clean scraped markdown by removing boilerplate, navigation remnants,
    and excessive whitespace.

    Returns (cleaned_text, list_of_cleaning_steps_applied).
    """
    text = raw_markdown
    steps = []

    # Step 1: Remove boilerplate patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            text = pattern.sub("", text)
            steps.append(f"removed_pattern:{pattern.pattern[:30]}")

    # Step 2: Collapse excessive blank lines (3+ -> 2)
    if "\n\n\n" in text:
        text = re.sub(r"\n{3,}", "\n\n", text)
        steps.append("collapsed_blank_lines")

    # Step 3: Remove lines that are just dashes or equals (decorative separators)
    text = re.sub(r"^[-=]{5,}\s*$", "", text, flags=re.MULTILINE)
    if "removed_separators" not in steps:
        steps.append("removed_decorative_separators")

    # Step 4: Strip leading/trailing whitespace
    text = text.strip()
    steps.append("stripped_whitespace")

    return text, steps


# ---------------------------------------------------------------------------
# Stage 3: Create Objects from cleaned content
# ---------------------------------------------------------------------------
def create_objects(
    scrape_results: list[dict],
    notebook_id: int = 1,
) -> list[ScrapedObject]:
    """Convert scraped and cleaned content into Object records.

    Each Object enters as 'draft' status per invariant #7:
    LLMs propose, humans review. Nothing auto-promotes.
    """
    objects = []
    seen_shas = set()

    for result in scrape_results:
        if not result["success"] or not result["markdown"]:
            continue

        cleaned, steps = clean_markdown(result["markdown"])
        if not cleaned or len(cleaned.split()) < 20:
            logger.debug("Skipping %s: too short after cleaning", result["url"])
            continue

        # Derive title from metadata or URL
        title = result.get("metadata", {}).get("title", "")
        if not title:
            parsed = urlparse(result["url"])
            title = parsed.path.strip("/").replace("-", " ").replace("/", " - ")
            if not title:
                title = parsed.netloc

        obj = ScrapedObject(
            title=title,
            body=cleaned,
            source_url=result["url"],
            cleaning_steps=steps,
            tags=result.get("tags", []),
        )

        # Deduplicate using SHA
        if obj.sha in seen_shas:
            logger.debug("Duplicate detected: %s (sha=%s)", result["url"], obj.sha)
            continue

        seen_shas.add(obj.sha)
        objects.append(obj)

    logger.info("Created %d Objects from %d scrape results", len(objects), len(scrape_results))
    return objects


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def scrape_to_corpus(
    targets: list[ScrapeTarget],
    api_key: str = "",
    notebook_id: int = 1,
    rate_limit_seconds: float = 2.0,
) -> dict:
    """Full Firecrawl-to-corpus pipeline.

    1. Scrape URLs via Firecrawl (or fallback)
    2. Clean markdown content
    3. Create Object records with provenance
    4. Deduplicate via SHA-hash identity

    Objects enter as 'draft' and await human review before promotion.
    """
    results = scrape_urls(targets, api_key, rate_limit_seconds)
    objects = create_objects(results, notebook_id)

    return {
        "targets": len(targets),
        "scraped": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "objects_created": len(objects),
        "total_words": sum(o.word_count for o in objects),
        "objects": objects,
    }


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    targets = [
        ScrapeTarget(
            url="https://en.wikipedia.org/wiki/Reinforced_concrete",
            tags=["materials", "concrete", "structural"],
        ),
        ScrapeTarget(
            url="https://en.wikipedia.org/wiki/Prestressed_concrete",
            tags=["materials", "concrete", "prestressed"],
        ),
        ScrapeTarget(
            url="https://en.wikipedia.org/wiki/Structural_engineering",
            tags=["engineering", "structural"],
        ),
    ]

    result = scrape_to_corpus(
        targets,
        api_key="",  # Set FIRECRAWL_API_KEY in .env
        notebook_id=1,
        rate_limit_seconds=1.0,
    )

    print(f"Targets: {result['targets']}")
    print(f"Scraped: {result['scraped']}")
    print(f"Failed: {result['failed']}")
    print(f"Objects created: {result['objects_created']}")
    print(f"Total words: {result['total_words']}")

    for obj in result["objects"]:
        print(f"\n  Title: {obj.title}")
        print(f"  URL: {obj.source_url}")
        print(f"  Words: {obj.word_count}")
        print(f"  SHA: {obj.sha}")
        print(f"  Status: {obj.status}")
        print(f"  Tags: {obj.tags}")
        print(f"  Cleaning: {obj.cleaning_steps}")
