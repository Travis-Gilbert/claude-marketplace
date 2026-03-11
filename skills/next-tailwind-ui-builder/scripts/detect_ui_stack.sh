#!/usr/bin/env bash
set -euo pipefail

root="${1:-.}"

find_package_json() {
  if [[ -f "$root/package.json" ]]; then
    printf '%s\n' "$root/package.json"
    return
  fi

  local found
  found="$(find "$root" -maxdepth 3 -name package.json | head -n 1 || true)"
  if [[ -n "$found" ]]; then
    printf '%s\n' "$found"
  fi
}

has_file() {
  find "$root" -maxdepth 4 \( -name "$1" \) | grep -q .
}

has_path() {
  find "$root" -maxdepth 5 -path "$1" | grep -q .
}

pkg="$(find_package_json || true)"

echo "UI stack report"
echo "Root: $(cd "$root" && pwd)"

if [[ -z "${pkg:-}" ]]; then
  echo "package.json: not found"
  exit 0
fi

echo "package.json: $pkg"

if rg -q '"next"' "$pkg"; then
  echo "Framework: Next.js"
else
  echo "Framework: React or other"
fi

if has_path "*/app" || has_path "*/src/app"; then
  echo "Router: app router detected"
elif has_path "*/pages" || has_path "*/src/pages"; then
  echo "Router: pages router detected"
else
  echo "Router: not detected"
fi

if has_file "tailwind.config.js" || has_file "tailwind.config.ts" || has_file "tailwind.config.cjs" || has_file "tailwind.config.mjs"; then
  echo "Tailwind config: present"
elif rg -q '@tailwind|tailwindcss' "$root" -g '!**/node_modules/**' -g '!**/.next/**' -g '!**/dist/**'; then
  echo "Tailwind config: inferred from source"
else
  echo "Tailwind config: not detected"
fi

if has_file "components.json"; then
  echo "shadcn config: present"
else
  echo "shadcn config: not detected"
fi

for dir in "components/ui" "src/components/ui" "app/components" "src/app/components"; do
  if [[ -d "$root/$dir" ]]; then
    echo "Component dir: $dir"
  fi
done

check_dep() {
  local label="$1"
  local pattern="$2"
  if rg -q "$pattern" "$pkg"; then
    echo "$label: yes"
  else
    echo "$label: no"
  fi
}

check_dep "Radix" '@radix-ui/'
check_dep "Sonner" '"sonner"'
check_dep "Vaul" '"vaul"'
check_dep "Iconoir" '"iconoir-react"|"iconoir"'
check_dep "Ant Design" '"antd"'
check_dep "CVA" '"class-variance-authority"'
check_dep "tailwind-merge" '"tailwind-merge"'

echo "Notes:"
if rg -q '"next"' "$pkg" && (has_path "*/app" || has_path "*/src/app"); then
  echo "- Prefer server components by default."
fi
if ! has_file "components.json" && ! [[ -d "$root/components/ui" || -d "$root/src/components/ui" ]]; then
  echo "- No local ui directory detected; create reusable primitives before adding page-specific one-offs."
fi
if ! rg -q '"sonner"' "$pkg" && ! rg -q '"vaul"' "$pkg"; then
  echo "- No toast or drawer helper detected; check whether the repo already ships equivalents before adding new libraries."
fi
