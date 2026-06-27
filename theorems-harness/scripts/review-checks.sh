#!/usr/bin/env bash
# Stop hook: changed-language checks. Runs the default cheap or project-native
# checkers for common languages and records a normalized receipt.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

cleanup() {
  for f in ${tmp_files:-}; do
    [ -n "$f" ] && [ -f "$f" ] && rm -f "$f"
  done
}
finish() {
  cleanup
  printf '{"continue":true,"suppressOutput":true}\n'
}
trap cleanup EXIT

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

if [ "${THEOREM_REVIEW_LANGUAGE_CHECKS:-1}" = "0" ]; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

tmp_files=""
new_tmp() {
  local f
  f=$(mktemp)
  tmp_files="${tmp_files} ${f}"
  printf '%s' "$f"
}
quote() {
  printf '%q' "$1"
}
join_quoted_file_args() {
  local list_file="$1"
  local max="${2:-50}"
  local count=0 path out=""
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    out="${out} $(quote "$repo_root/$path")"
    count=$((count + 1))
    [ "$count" -ge "$max" ] && break
  done < "$list_file"
  printf '%s' "$out"
}

input=$(theorem_read_stdin)
cwd=$(theorem_resolve_cwd "$input")
repo_root=$(theorem_repo_root "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
sid=$(theorem_session_id "$input")
run_id=$(theorem_run_id "$sid" 2>/dev/null || true)
actor="${THEOREM_ACTOR:-$(theorem_host)}"
mode="${THEOREM_REVIEW_MODE:-${THEOREM_LANGUAGE_REVIEW_MODE:-advisory}}"
review_dir=$(theorem_review_dir "$repo_root")
reports_file=$(new_tmp)
changed_file=$(new_tmp)

append_report() {
  local checker="$1"
  local language="$2"
  local status="$3"
  local severity="$4"
  local message="$5"
  local command_text="$6"
  local exit_code="$7"
  local output="$8"
  local duration_ms="${9:-0}"
  jq -c -n \
    --arg checker "$checker" \
    --arg language "$language" \
    --arg status "$status" \
    --arg severity "$severity" \
    --arg message "$message" \
    --arg command "$command_text" \
    --arg output "$output" \
    --argjson exit_code "$exit_code" \
    --argjson duration_ms "$duration_ms" \
    '{
      checker: $checker,
      language: $language,
      status: $status,
      severity: $severity,
      message: $message,
      command: $command,
      exit_code: $exit_code,
      duration_ms: $duration_ms,
      output: $output
    }' >> "$reports_file"
}

run_check() {
  local checker="$1"
  local language="$2"
  local severity="$3"
  local command_text="$4"
  local output code status message start end duration_ms
  start=$(date +%s)
  set +e
  output=$(cd "$repo_root" && /bin/bash -lc "$command_text" 2>&1)
  code=$?
  set -u
  end=$(date +%s)
  duration_ms=$(( (end - start) * 1000 ))
  output=$(printf '%s' "$output" | head -c 12000)
  if [ "$code" -eq 0 ]; then
    status="passed"
    message="${checker} passed"
  else
    status="failed"
    message="${checker} failed"
  fi
  append_report "$checker" "$language" "$status" "$severity" "$message" "$command_text" "$code" "$output" "$duration_ms"
}

has_changed_ext() {
  local pattern="$1"
  grep -E "$pattern" "$changed_file" >/dev/null 2>&1
}

find_ancestor_file() {
  local path="$1"
  local target="$2"
  local dir
  dir="$repo_root/$(dirname "$path")"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/$target" ]; then
      printf '%s' "$dir/$target"
      return 0
    fi
    [ "$dir" = "$repo_root" ] && break
    dir=$(dirname "$dir")
  done
  return 1
}

find_ancestor_any() {
  local path="$1"
  shift
  local name found
  for name in "$@"; do
    found=$(find_ancestor_file "$path" "$name" 2>/dev/null || true)
    if [ -n "$found" ]; then
      printf '%s' "$found"
      return 0
    fi
  done
  return 1
}

package_has_script() {
  local package_json="$1"
  local script="$2"
  jq -e --arg s "$script" '.scripts[$s] // empty' "$package_json" >/dev/null 2>&1
}

if ! git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

if git -C "$repo_root" rev-parse --verify HEAD >/dev/null 2>&1; then
  git -C "$repo_root" diff --name-only --diff-filter=ACMRTUXB -z HEAD -- . ':!.theorem' ':!.harness' 2>/dev/null || true
else
  git -C "$repo_root" ls-files -z 2>/dev/null || true
fi | while IFS= read -r -d '' path; do
  [ -n "$path" ] || continue
  [ -f "$repo_root/$path" ] || continue
  printf '%s\n' "$path"
done >> "$changed_file"
git -C "$repo_root" ls-files --others --exclude-standard -z 2>/dev/null | while IFS= read -r -d '' path; do
  [ -n "$path" ] || continue
  case "$path" in .theorem/*|.harness/*) continue ;; esac
  [ -f "$repo_root/$path" ] || continue
  printf '%s\n' "$path"
done >> "$changed_file"
sort -u "$changed_file" -o "$changed_file"

if [ ! -s "$changed_file" ]; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

# Rust
if has_changed_ext '\.rs$'; then
  if command -v cargo >/dev/null 2>&1; then
    rust_manifests=$(new_tmp)
    grep -E '\.rs$' "$changed_file" | while IFS= read -r path; do
      find_ancestor_file "$path" "Cargo.toml" 2>/dev/null || true
      printf '\n'
    done | sed '/^$/d' | sort -u > "$rust_manifests"
    if [ -s "$rust_manifests" ]; then
      while IFS= read -r manifest; do
        run_check "cargo_fmt" "rust" "error" "cargo fmt --manifest-path $(quote "$manifest") -- --check"
        run_check "cargo_check" "rust" "error" "cargo check --manifest-path $(quote "$manifest")"
        if [ "${THEOREM_REVIEW_RUN_TESTS:-0}" = "1" ]; then
          run_check "cargo_test" "rust" "error" "cargo test --manifest-path $(quote "$manifest")"
        fi
      done < "$rust_manifests"
    else
      append_report "cargo_manifest" "rust" "skipped" "info" "Rust files changed, but no nearest Cargo.toml was found." "" 0 "" 0
    fi
  else
    append_report "cargo_available" "rust" "skipped" "info" "cargo is not available on PATH." "" 0 "" 0
  fi
fi

# JavaScript, TypeScript, and package-owned CSS.
if has_changed_ext '\.(mjs|cjs|js|jsx|ts|tsx|css|scss|sass|less)$'; then
  package_jsons=$(new_tmp)
  grep -E '\.(mjs|cjs|js|jsx|ts|tsx|css|scss|sass|less)$' "$changed_file" | while IFS= read -r path; do
    find_ancestor_file "$path" "package.json" 2>/dev/null || true
    printf '\n'
  done | sed '/^$/d' | sort -u > "$package_jsons"
  if [ -s "$package_jsons" ]; then
    if command -v npm >/dev/null 2>&1; then
      while IFS= read -r package_json; do
        package_dir=$(dirname "$package_json")
        if package_has_script "$package_json" "lint"; then
          run_check "npm_lint" "javascript/typescript/css" "error" "npm --prefix $(quote "$package_dir") run lint --if-present"
        else
          append_report "npm_lint" "javascript/typescript/css" "skipped" "info" "package.json has no lint script." "npm run lint --if-present" 0 "$package_json" 0
        fi
        if package_has_script "$package_json" "typecheck"; then
          run_check "npm_typecheck" "typescript" "error" "npm --prefix $(quote "$package_dir") run typecheck --if-present"
        elif package_has_script "$package_json" "tsc"; then
          run_check "npm_tsc" "typescript" "error" "npm --prefix $(quote "$package_dir") run tsc --if-present"
        fi
        if package_has_script "$package_json" "stylelint"; then
          run_check "npm_stylelint" "css" "error" "npm --prefix $(quote "$package_dir") run stylelint --if-present"
        fi
        if [ "${THEOREM_REVIEW_RUN_TESTS:-0}" = "1" ] && package_has_script "$package_json" "test"; then
          run_check "npm_test" "javascript/typescript" "error" "npm --prefix $(quote "$package_dir") test --if-present"
        fi
      done < "$package_jsons"
    else
      append_report "npm_available" "javascript/typescript/css" "skipped" "info" "npm is not available on PATH." "" 0 "" 0
    fi
  fi
fi

# Python
if has_changed_ext '\.py$'; then
  py_files=$(new_tmp)
  grep -E '\.py$' "$changed_file" > "$py_files"
  py_args=$(join_quoted_file_args "$py_files" 50)
  if command -v ruff >/dev/null 2>&1; then
    run_check "ruff_check" "python" "error" "ruff check${py_args}"
  else
    append_report "ruff_available" "python" "skipped" "info" "ruff is not available on PATH." "" 0 "" 0
  fi
  if command -v pyright >/dev/null 2>&1 && { [ -f "$repo_root/pyrightconfig.json" ] || [ -f "$repo_root/pyproject.toml" ]; }; then
    run_check "pyright" "python" "error" "pyright"
  elif command -v mypy >/dev/null 2>&1 && { [ -f "$repo_root/mypy.ini" ] || [ -f "$repo_root/pyproject.toml" ]; }; then
    run_check "mypy" "python" "error" "mypy${py_args}"
  fi
  if [ "${THEOREM_REVIEW_RUN_TESTS:-0}" = "1" ] && command -v pytest >/dev/null 2>&1; then
    run_check "pytest" "python" "error" "pytest"
  fi
fi

# C and C++
if has_changed_ext '\.(c|h|cc|cpp|cxx|hh|hpp|hxx)$'; then
  c_files=$(new_tmp)
  grep -E '\.(c|h|cc|cpp|cxx|hh|hpp|hxx)$' "$changed_file" > "$c_files"
  c_args=$(join_quoted_file_args "$c_files" 50)
  if command -v clang-format >/dev/null 2>&1; then
    run_check "clang_format" "c/c++" "error" "clang-format --dry-run --Werror${c_args}"
  else
    append_report "clang_format_available" "c/c++" "skipped" "info" "clang-format is not available on PATH." "" 0 "" 0
  fi
  if command -v clang-tidy >/dev/null 2>&1 && { [ -f "$repo_root/compile_commands.json" ] || [ -f "$repo_root/build/compile_commands.json" ]; }; then
    run_check "clang_tidy" "c/c++" "error" "clang-tidy${c_args}"
  fi
fi

# Java
if has_changed_ext '\.java$'; then
  java_roots=$(new_tmp)
  grep -E '\.java$' "$changed_file" | while IFS= read -r path; do
    found=$(find_ancestor_any "$path" "pom.xml" "gradlew" "build.gradle" "build.gradle.kts" 2>/dev/null || true)
    [ -n "$found" ] && dirname "$found"
    printf '\n'
  done | sed '/^$/d' | sort -u > "$java_roots"
  while IFS= read -r java_root; do
    [ -n "$java_root" ] || continue
    if [ -x "$java_root/gradlew" ]; then
      if [ "${THEOREM_REVIEW_RUN_TESTS:-0}" = "1" ]; then
        run_check "gradle_check" "java" "error" "cd $(quote "$java_root") && ./gradlew -q check"
      else
        run_check "gradle_classes" "java" "error" "cd $(quote "$java_root") && ./gradlew -q classes"
      fi
    elif [ -f "$java_root/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
      if [ "${THEOREM_REVIEW_RUN_TESTS:-0}" = "1" ]; then
        run_check "maven_test" "java" "error" "cd $(quote "$java_root") && mvn -q test"
      else
        run_check "maven_compile" "java" "error" "cd $(quote "$java_root") && mvn -q -DskipTests compile"
      fi
    elif command -v gradle >/dev/null 2>&1 && { [ -f "$java_root/build.gradle" ] || [ -f "$java_root/build.gradle.kts" ]; }; then
      run_check "gradle_classes" "java" "error" "cd $(quote "$java_root") && gradle -q classes"
    else
      append_report "java_build_tool" "java" "skipped" "info" "No usable Java build tool was found." "" 0 "$java_root" 0
    fi
  done < "$java_roots"
fi

# SQL
if has_changed_ext '\.sql$'; then
  sql_files=$(new_tmp)
  grep -E '\.sql$' "$changed_file" > "$sql_files"
  sql_args=$(join_quoted_file_args "$sql_files" 50)
  if command -v sqlfluff >/dev/null 2>&1; then
    run_check "sqlfluff_lint" "sql" "error" "sqlfluff lint${sql_args}"
  else
    append_report "sqlfluff_available" "sql" "skipped" "info" "sqlfluff is not available on PATH." "" 0 "" 0
  fi
fi

# C#
if has_changed_ext '\.cs$'; then
  dotnet_targets=$(new_tmp)
  find "$repo_root" -maxdepth 3 \( -name '*.sln' -o -name '*.csproj' \) -print 2>/dev/null | sort -u > "$dotnet_targets"
  if command -v dotnet >/dev/null 2>&1 && [ -s "$dotnet_targets" ]; then
    while IFS= read -r target; do
      run_check "dotnet_build" "csharp" "error" "dotnet build $(quote "$target") --no-restore"
      if [ "${THEOREM_REVIEW_RUN_TESTS:-0}" = "1" ]; then
        run_check "dotnet_test" "csharp" "error" "dotnet test $(quote "$target") --no-restore --no-build"
      fi
      break
    done < "$dotnet_targets"
  else
    append_report "dotnet_available" "csharp" "skipped" "info" "dotnet or a .sln/.csproj target was not found." "" 0 "" 0
  fi
fi

reports=$(jq -s -c '.' "$reports_file" 2>/dev/null || printf '[]')
if [ "$reports" = "[]" ]; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

changed_files_json=$(jq -R . "$changed_file" | jq -s -c '.[0:200]' 2>/dev/null || printf '[]')
failed_count=$(printf '%s' "$reports" | jq '[.[] | select(.status == "failed")] | length')
skipped_count=$(printf '%s' "$reports" | jq '[.[] | select(.status == "skipped")] | length')
hard_axis_failed=false
if [ "$failed_count" -gt 0 ]; then
  hard_axis_failed=true
fi

receipt=$(jq -n \
  --arg kind "language_review_receipt" \
  --arg timestamp "$(theorem_now_iso)" \
  --arg repo_root "$repo_root" \
  --arg branch "$(theorem_git_branch "$repo_root")" \
  --arg head "$(theorem_git_head "$repo_root")" \
  --arg mode "$mode" \
  --argjson changed_files "$changed_files_json" \
  --argjson failed_count "$failed_count" \
  --argjson skipped_count "$skipped_count" \
  --argjson hard_axis_failed "$hard_axis_failed" \
  --argjson reports "$reports" \
  '{
    kind: $kind,
    timestamp: $timestamp,
    repo_root: $repo_root,
    branch: $branch,
    commit_sha: $head,
    mode: $mode,
    changed_files: $changed_files,
    failed_count: $failed_count,
    skipped_count: $skipped_count,
    hard_axis_failed: $hard_axis_failed,
    reports: $reports
  }')

stamp=$(theorem_now_stamp)
receipt_file="$review_dir/language-checks-${stamp}.json"
printf '%s\n' "$receipt" > "$receipt_file" 2>/dev/null || true
printf '%s\n' "$receipt" > "$review_dir/latest-language-checks.json" 2>/dev/null || true

if [ -n "$run_id" ]; then
  payload=$(jq -n --argjson receipt "$receipt" '{
    event_subtype: "language_review_receipt",
    boundary: "repo_stop",
    language_review_receipts: [$receipt]
  }')
  receipt_hash=$(printf '%s' "$receipt" | shasum -a 256 | awk '{print $1}')
  append_args=$(jq -n \
    --arg run_id "$run_id" \
    --arg actor "$actor" \
    --arg key "language_review_receipt:${run_id}:${receipt_hash}" \
    --argjson payload "$payload" \
    '{
      run_id: $run_id,
      event_type: "SESSION.EVENT_RECORDED",
      actor: $actor,
      idempotency_key: $key,
      payload: $payload
    }')
  theorem_native_call "harness_append_transition" "$append_args" >/dev/null 2>&1 || true
fi

if [ "$hard_axis_failed" = "true" ] && [ "$mode" = "enforce" ]; then
  reason=$(printf '%s' "$reports" | jq -r '
    [.[] | select(.status == "failed") | "- " + .language + "/" + .checker + ": " + .message + (if (.output // "") != "" then "\n" + (.output | split("\n")[0:8] | join("\n")) else "" end)][0:5] | join("\n")
  ')
  jq -n --arg reason "Language review checks failed:\n${reason}" '{continue: false, decision: "block", reason: $reason}'
  exit 0
fi

if [ "$hard_axis_failed" = "true" ] && [ "$mode" = "advisory" ]; then
  context=$(printf '%s' "$reports" | jq -r '
    [.[] | select(.status == "failed") | "- " + .language + "/" + .checker + ": " + .message + (if (.output // "") != "" then "\n  " + (.output | split("\n")[0:3] | join("\n  ")) else "" end)][0:6] | join("\n")
  ')
  if [ -n "$context" ]; then
    jq -n --arg ctx "## Language review checks\n${context}" '{
      continue: true,
      suppressOutput: true,
      hookSpecificOutput: {
        hookEventName: "Stop",
        additionalContext: $ctx
      }
    }'
    exit 0
  fi
fi

printf '{"continue":true,"suppressOutput":true}\n'
