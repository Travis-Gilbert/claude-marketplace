#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly DEFAULT_SOURCE_URL="https://raw.githubusercontent.com/Travis-Gilbert/claude-marketplace/main/theorems-harness"

bundle="core"
source_ref="${THEOREMS_HARNESS_SKILL_SOURCE_URL:-}"
claude_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
codex_dir="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
install_claude=true
install_codex=true
dry_run=false

core_skills=(
    "theorems-harness"
    "harness-coordinate"
    "practice-system"
    "compute_code"
    "encode"
    "research"
    "peer-review"
    "execute"
)

full_skills=(
    "ambition"
    "browser-web"
    "claudeai-session-writer"
    "compute_code"
    "commitments-policy"
    "context-management"
    "curiosity"
    "data-reconstruction"
    "design-engineering"
    "dispatch"
    "encode"
    "execute"
    "graph-version"
    "graph-lisp"
    "graph_theorem"
    "harness-coordinate"
    "identity-bindings"
    "peer-review"
    "planning-theorem"
    "practice-system"
    "programmable-wasm"
    "replay-last-run"
    "research"
    "rust-engineering"
    "session-offload"
    "solvers"
    "surface-idea"
    "symbolic"
    "theorems-harness"
    "theorize"
    "verified-cognition"
    "writing-engineering"
)

# These names were installed by earlier Harness releases but are intentionally
# absent from 0.9.x. Hosts discover skills by directory, so leaving the old
# directories behind would keep retired interfaces callable after an upgrade.
retired_skills=(
    "code_theorem"
    "context-refresh"
    "ponytail"
    "ponytail-audit"
    "ponytail-debt"
    "ponytail-gain"
    "ponytail-help"
    "ponytail-review"
    "show-context"
)

usage() {
    cat <<'USAGE'
Usage: install-harness-skills.sh [options]

Install Theorem's Harness skills into Claude Code and/or Codex skill dirs.

Options:
  --bundle minimal|core|full  Skill bundle to install. Default: core.
  --source PATH_OR_URL        Plugin root path or raw URL base.
  --claude-dir DIR           Claude skills directory. Default: ~/.claude/skills.
  --codex-dir DIR            Codex skills directory. Default: ~/.codex/skills.
  --claude-only              Install only Claude skills.
  --codex-only               Install only Codex skills.
  --dry-run                  Print actions without writing.
  -h, --help                 Show this help.

Examples:
  ./scripts/install-harness-skills.sh
  ./scripts/install-harness-skills.sh --bundle full
  curl -fsSL https://raw.githubusercontent.com/Travis-Gilbert/claude-marketplace/main/theorems-harness/scripts/install-harness-skills.sh | bash
USAGE
}

log() {
    printf '%s\n' "$*" >&2
}

fail() {
    log "Error: $*"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --bundle)
            [[ $# -ge 2 ]] || fail "--bundle requires a value"
            bundle="$2"
            shift 2
            ;;
        --source)
            [[ $# -ge 2 ]] || fail "--source requires a value"
            source_ref="$2"
            shift 2
            ;;
        --claude-dir)
            [[ $# -ge 2 ]] || fail "--claude-dir requires a value"
            claude_dir="$2"
            shift 2
            ;;
        --codex-dir)
            [[ $# -ge 2 ]] || fail "--codex-dir requires a value"
            codex_dir="$2"
            shift 2
            ;;
        --claude-only)
            install_claude=true
            install_codex=false
            shift
            ;;
        --codex-only)
            install_claude=false
            install_codex=true
            shift
            ;;
        --dry-run)
            dry_run=true
            shift
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            fail "unknown argument: $1"
            ;;
    esac
done

case "$bundle" in
    minimal)
        skills=("theorems-harness")
        ;;
    core)
        skills=("${core_skills[@]}")
        ;;
    full)
        skills=("${full_skills[@]}")
        ;;
    *)
        fail "unknown bundle: $bundle"
        ;;
esac

if [[ -z "$source_ref" ]]; then
    if [[ -d "$PLUGIN_ROOT/skills/theorems-harness" ]]; then
        source_ref="$PLUGIN_ROOT"
    else
        source_ref="$DEFAULT_SOURCE_URL"
    fi
fi

is_url=false
case "$source_ref" in
    http://* | https://*)
        is_url=true
        ;;
esac

if [[ "$is_url" == true ]] && ! command -v curl >/dev/null 2>&1; then
    fail "curl is required when --source is a URL"
fi

install_from_local() {
    local skill=$1
    local target_root=$2
    local source_dir="$source_ref/skills/$skill"
    local target_dir="$target_root/$skill"

    [[ -d "$source_dir" ]] || fail "missing local skill directory: $source_dir"
    log "install $skill -> $target_dir"
    if [[ "$dry_run" == true ]]; then
        return
    fi
    mkdir -p "$target_dir"
    find "$target_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    while IFS= read -r -d '' item; do
        cp -R "$item" "$target_dir/"
    done < <(find "$source_dir" -mindepth 1 -maxdepth 1 ! -name '.DS_Store' -print0)
}

install_from_url() {
    local skill=$1
    local target_root=$2
    local target_dir="$target_root/$skill"
    local base="${source_ref%/}/skills/$skill"
    local temp_file

    log "install $skill -> $target_dir"
    if [[ "$dry_run" == true ]]; then
        return
    fi
    mkdir -p "$target_dir"
    curl -fsSL "$base/SKILL.md" -o "$target_dir/SKILL.md"
    temp_file="$(mktemp)"
    if curl -fsSL "$base/provenance.json" -o "$temp_file"; then
        mv "$temp_file" "$target_dir/provenance.json"
    else
        rm -f "$temp_file"
    fi
}

install_skill() {
    local skill=$1
    local target_root=$2

    if [[ "$is_url" == true ]]; then
        install_from_url "$skill" "$target_root"
    else
        install_from_local "$skill" "$target_root"
    fi
}

remove_retired_skills() {
    local target_root=$1
    local skill target_dir

    [[ -n "$target_root" ]] || fail "skill target directory must not be empty"
    for skill in "${retired_skills[@]}"; do
        target_dir="$target_root/$skill"
        [[ -e "$target_dir" || -L "$target_dir" ]] || continue
        log "remove retired skill $skill -> $target_dir"
        if [[ "$dry_run" == false ]]; then
            rm -rf -- "$target_dir"
        fi
    done
}

if [[ "$install_claude" == false && "$install_codex" == false ]]; then
    fail "no target selected"
fi

log "Source: $source_ref"
log "Bundle: $bundle (${#skills[@]} skills)"

if [[ "$install_claude" == true ]]; then
    remove_retired_skills "$claude_dir"
fi
if [[ "$install_codex" == true ]]; then
    remove_retired_skills "$codex_dir"
fi

for skill in "${skills[@]}"; do
    if [[ "$install_claude" == true ]]; then
        install_skill "$skill" "$claude_dir"
    fi
    if [[ "$install_codex" == true ]]; then
        install_skill "$skill" "$codex_dir"
    fi
done

log "Done. Restart Claude Code or Codex so the new skills are discovered."
