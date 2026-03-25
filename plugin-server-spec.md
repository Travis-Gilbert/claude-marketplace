# Plugin Server: Architecture Spec

**Project:** Universal MCP access point for the Codex plugin ecosystem
**Repo:** `Travis-Gilbert/Plugins-building` (source of truth)
**Deployment target:** Railway (PostgreSQL; pgvector added in Phase 2)
**API framework:** Django Ninja (read-heavy, Pydantic-typed, async-native)
**Handoff to:** Claude Code with Django-Engine-Pro plugin

---

## Context

The Plugins-building repo contains ~15 Claude Code plugins. Each plugin
carries agents (markdown role definitions), references (curated knowledge
docs), templates (starter patterns), and in some cases large `refs/`
directories containing actual library source code (d3-pro has 23 D3 module
source trees, for example). Today these only work when Claude Code runs
locally with the repo cloned and symlinked.

This server makes that knowledge accessible from anywhere: claude.ai,
mobile, other Claude Code sessions, or any MCP-capable client. It ingests
the entire repo, chunks source files, stores them in PostgreSQL, and
exposes everything through MCP tools backed by Django Ninja endpoints.
Phase 2 adds pgvector semantic search once the core retrieval layer is
proven.

---

## Models

### Inheritance Strategy: Abstract Base

All content models inherit from `TimestampedModel` (abstract base).
No cross-type queries are needed. No polymorphic dispatch required.
Each content type has distinct fields and distinct query patterns.
Abstract base costs nothing at query time.

```python
# core/models.py

class TimestampedModel(models.Model):
    """Abstract base. Shared timestamps, soft-delete."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True
```

### Plugin (registry entry)

```python
# plugins/models.py
from pgvector.django import VectorField

class Plugin(TimestampedModel):
    """
    One row per plugin directory in the repo.
    slug is the directory name (e.g., "d3-pro", "django-engine-pro").
    """
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    version = models.CharField(max_length=20, default="1.0.0")
    description = models.TextField(blank=True)
    claude_md = models.TextField(blank=True, help_text="Full CLAUDE.md content")
    agents_md = models.TextField(blank=True, help_text="Full AGENTS.md content")
    manifest = models.JSONField(default=dict, blank=True,
        help_text="Contents of .claude-plugin/plugin.json. Schema: {keywords: [], author: str}")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.version})"
```

### AgentDefinition (specialist role prompts)

```python
class AgentDefinition(TimestampedModel):
    """One row per agent .md file."""
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE,
        related_name="agents")
    # CASCADE: agents are meaningless without parent plugin context.
    slug = models.SlugField(max_length=100)  # filename without .md
    name = models.CharField(max_length=200)
    content = models.TextField()
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    # Phase 2: populated by pgvector semantic search.
    # Phase 1: direct retrieval and full-text search handle lookups.

    class Meta:
        unique_together = [("plugin", "slug")]
        indexes = [models.Index(fields=["plugin", "slug"])]

    def __str__(self):
        return f"{self.plugin.slug}/{self.slug}"
```

### ReferenceDoc (curated knowledge markdown)

```python
class ReferenceDoc(TimestampedModel):
    """Curated knowledge from references/ and knowledge/ directories."""
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE,
        related_name="references")
    # CASCADE: same rationale as AgentDefinition.
    slug = models.SlugField(max_length=200)
    title = models.CharField(max_length=300)
    content = models.TextField()
    file_path = models.CharField(max_length=500,
        help_text="Path relative to plugin root (e.g., references/orm-performance.md)")
    doc_type = models.CharField(max_length=50, db_index=True, choices=[
        ("reference", "Reference Doc"), ("knowledge", "Knowledge File"),
        ("skill", "Skill Definition"), ("readme", "README"),
    ])
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    class Meta:
        unique_together = [("plugin", "file_path")]
        indexes = [models.Index(fields=["plugin", "doc_type"])]

    def __str__(self):
        return f"{self.plugin.slug}/{self.file_path}"
```

### SourceChunk (source code from refs/)

```python
class SourceChunk(TimestampedModel):
    """
    Chunked source code from refs/ directories. Chunks are meaningful
    code units (functions, classes, modules), not arbitrary splits.
    """
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE,
        related_name="source_chunks")
    # CASCADE: source chunks are derived from plugin refs.
    file_path = models.CharField(max_length=500, db_index=True,
        help_text="Path relative to plugin root (e.g., refs/d3-force/src/simulation.js)")
    ref_library = models.CharField(max_length=200, db_index=True)
    language = models.CharField(max_length=30, db_index=True, choices=[
        ("javascript", "JavaScript"), ("typescript", "TypeScript"),
        ("python", "Python"), ("markdown", "Markdown"),
        ("json", "JSON"), ("other", "Other"),
    ])
    chunk_type = models.CharField(max_length=30, choices=[
        ("function", "Function"), ("class", "Class"),
        ("module", "Module/File"), ("section", "Markdown Section"),
        ("config", "Configuration"),
    ])
    symbol_name = models.CharField(max_length=200, blank=True, db_index=True)
    content = models.TextField()
    start_line = models.IntegerField(default=0)
    end_line = models.IntegerField(default=0)
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["plugin", "ref_library"]),
            models.Index(fields=["plugin", "language"]),
            models.Index(fields=["ref_library", "symbol_name"]),
        ]

    def __str__(self):
        label = self.symbol_name or self.chunk_type
        return f"{self.plugin.slug}/{self.file_path}::{label}"
```

### Template (starter patterns)

```python
class Template(TimestampedModel):
    """Complete, copy-paste-ready scaffolds from templates/ directories."""
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE,
        related_name="templates")
    # CASCADE: templates are plugin-specific.
    slug = models.SlugField(max_length=200)
    name = models.CharField(max_length=300)
    category = models.CharField(max_length=100,
        help_text="Template subdirectory (e.g., polymorphic-api)")
    file_path = models.CharField(max_length=500)
    content = models.TextField()
    language = models.CharField(max_length=30, default="python")

    class Meta:
        unique_together = [("plugin", "file_path")]
```

### IngestionRun (sync tracking)

```python
class IngestionRun(TimestampedModel):
    """Tracks each sync from GitHub."""
    commit_sha = models.CharField(max_length=40)
    status = models.CharField(max_length=20, choices=[
        ("running", "Running"), ("completed", "Completed"), ("failed", "Failed"),
    ])
    plugins_synced = models.IntegerField(default=0)
    chunks_created = models.IntegerField(default=0)
    embeddings_generated = models.IntegerField(default=0)
    error_log = models.TextField(blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
```

---

## Managers and QuerySets

```python
class ActiveManager(models.Manager):
    """Default manager that excludes soft-deleted rows."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

# Usage: objects = ActiveManager(); all_objects = models.Manager()
```

### Key QuerySet Patterns

```python
# Direct file retrieval (the "render from need" pattern)
SourceChunk.objects.filter(
    plugin__slug="d3-pro", ref_library="d3-force",
    file_path__contains="simulation.js",
).order_by("start_line")

# Agent lookup with plugin prefetch
AgentDefinition.objects.filter(plugin__slug="d3-pro").select_related("plugin")

# Full-text search (Phase 1 search strategy)
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
SourceChunk.objects.annotate(
    rank=SearchRank(SearchVector("content", "symbol_name"), SearchQuery(query_text))
).filter(plugin__slug=plugin_slug, is_deleted=False, rank__gte=0.1
).order_by("-rank")[:limit]

# Semantic search (Phase 2)
from pgvector.django import CosineDistance
SourceChunk.objects.annotate(
    distance=CosineDistance("embedding", query_vector)
).filter(plugin__slug=plugin_slug, is_deleted=False
).order_by("distance")[:limit]
```

---

## API Layer

### Framework Choice: Django Ninja

Read-heavy, Pydantic-typed, async-native, built-in OpenAPI.
No nested write operations needed.

### Endpoint Inventory

```
# Plugin Registry
GET /api/plugins/                                -> list all plugins
GET /api/plugins/{slug}/                         -> plugin detail with counts
GET /api/plugins/{slug}/context                  -> CLAUDE.md + agents

# Agents
GET /api/plugins/{slug}/agents/                  -> list agents
GET /api/plugins/{slug}/agents/{agent}/          -> single agent

# References
GET /api/plugins/{slug}/references/              -> list reference docs
GET /api/plugins/{slug}/references/{ref}/        -> single reference

# Source (direct retrieval)
GET /api/plugins/{slug}/source/{ref_library}/    -> list files in ref
GET /api/plugins/{slug}/source/{ref_library}/{path} -> reassembled file

# Templates
GET /api/plugins/{slug}/templates/               -> list templates
GET /api/plugins/{slug}/templates/{category}/{name}/ -> single template

# Search (Phase 1: full-text; Phase 2: pgvector)
POST /api/search/         -> search across everything
POST /api/search/source/  -> search source chunks only
POST /api/search/agents/  -> search agent definitions

# Admin
POST /api/admin/sync/     -> trigger GitHub re-sync (API key auth)
```

### Permissions

All read endpoints open (content is public on GitHub). Sync endpoint
protected by `PLUGIN_SERVER_ADMIN_KEY` env var. Rate limit: 60 req/min.

---

## MCP Exposure

SSE endpoint at `/mcp/` wrapping the Ninja API as MCP tools.

### MCP Tool Definitions

- **list_plugins**: List all plugins with descriptions.
- **get_plugin_context(plugin)**: Load CLAUDE.md + routing table. Call first.
- **get_agent(plugin, agent)**: Load specialist agent definition.
- **get_reference(plugin, reference)**: Load curated knowledge doc.
- **get_source_file(plugin, ref_library, file_path)**: Retrieve source file for API verification.
- **search_knowledge(query, plugin?, content_type?, limit?)**: Search across all knowledge.
- **search_source(query, plugin?, ref_library?, language?, limit?)**: Search source code refs.
- **get_template(plugin, category, name?)**: Retrieve starter template.

All tools scoped through ActiveManager. No auth (public content).

---

## Ingestion Pipeline

### Management Command: `sync_plugins`

```
python manage.py sync_plugins [--plugin SLUG] [--skip-embeddings] [--force]
```

1. Clone/pull `Travis-Gilbert/Plugins-building.git`
2. Read root CLAUDE.md for plugin registry
3. For each plugin: parse manifest, read CLAUDE.md/AGENTS.md, walk agents/,
   references/, knowledge/, templates/, refs/
4. Source chunking: .py via `ast`, .js/.ts via regex splitter, .md via
   header splits, files under 200 lines as single "module" chunk
5. Embeddings (Phase 2 only): OpenAI text-embedding-3-small, batches of 100
6. Soft-delete rows whose file_path no longer exists in repo

Sync triggers: manual `railway run`, GitHub webhook, or Railway cron.

---

## Migration Plan

### Phase 1: Ship this

1. `startproject plugin_server`, apps: core, plugins, api
2. Initial migration (VectorFields nullable, unfilled)
3. Ninja API endpoints + direct retrieval + full-text search
4. Ingestion management command (no embeddings)
5. MCP SSE endpoint
6. Deploy to Railway with PostgreSQL

### Phase 2: Semantic search

1. Enable pgvector: `CREATE EXTENSION vector;`
2. Add embedding generation to sync command (~$0.02/sync)
3. Add semantic search endpoints (CosineDistance)

All migrations reversible. Ingestion is idempotent (upserts).

---

## Project Structure

```
plugin-server/
  manage.py
  plugin_server/
    settings.py, urls.py, asgi.py
  core/
    models.py          # TimestampedModel, ActiveManager
  plugins/
    models.py          # Plugin, AgentDefinition, ReferenceDoc,
                       #   SourceChunk, Template, IngestionRun
    admin.py           # django-unfold admin
    chunkers.py        # AST Python chunker, JS regex chunker, MD splitter
    embeddings.py      # OpenAI embedding client (Phase 2)
    management/commands/
      sync_plugins.py  # GitHub clone + ingest
  api/
    schemas.py         # Pydantic schemas
    router.py          # Ninja API endpoints
    mcp.py             # MCP SSE endpoint
  Dockerfile
  railway.toml
  requirements.txt
```

---

## Resolved Decisions

1. **Embeddings:** Deferred to Phase 2. Phase 1 uses direct retrieval +
   PostgreSQL full-text search. Phase 2: OpenAI text-embedding-3-small
   (~$0.02/sync). Revisit for local model only if vendor independence matters.

2. **Chat skills:** Companion .skill files (design-pro, three-design,
   django-engine-design, theseus-ml, etc.) remain in claude.ai skill system.
   Separate distribution channel. Plugin server serves Claude Code content only.

3. **MCP transport:** SSE. claude.ai supports SSE for connected MCP servers.

---

## Open Questions

1. **Ref update cadence:** D3 and React source refs are snapshots. How often
   refresh against upstream? Orthogonal to the plugin server (it ingests
   whatever is in the repo).

2. **Claims/knowledge JSONL:** django-engine-pro has `knowledge/claims.jsonl`
   from epistemic layer work. Ingest as separate content type, or superseded
   by reference docs?
