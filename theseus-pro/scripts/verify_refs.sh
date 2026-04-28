#!/usr/bin/env bash
set -euo pipefail

# Verify which reference repos are cloned.
REFS_DIR="$(cd "$(dirname "$0")/.." && pwd)/refs"

if [ ! -d "$REFS_DIR" ]; then
    echo "refs/ directory not found. Run bootstrap_refs.sh first."
    exit 1
fi

EXPECTED=(
    # Tier 1
    sentence-transformers networkx spacy scikit-learn faiss pykeen
    pytorch rank-bm25 firecrawl tree-sitter
    # Tier 2
    pyg dgl slaps-gnn ultra tgn tgn-official de-simple pyg-temporal
    xgboost lightgbm torchrec torchtune transformers dspy autogen
    native autoschemakg
    # Tier 3
    pyreason belief-revision-engine rnnlogic scallop anasime
    minerva stable-baselines3 di-engine kg-rl deap optuna learn2learn
    metar gen subgraph-gnn pymc evidential-dl gduq box-embeddings
    aiida-core structrag shap
    # Codebase
    index-api
)

present=0
missing=0

for ref in "${EXPECTED[@]}"; do
    if [ -d "$REFS_DIR/$ref" ] || [ -L "$REFS_DIR/$ref" ]; then
        echo "[ok]   $ref"
        ((present++))
    else
        echo "[MISS] $ref"
        ((missing++))
    fi
done

echo ""
echo "Present: $present / ${#EXPECTED[@]}"
echo "Missing: $missing / ${#EXPECTED[@]}"

if [ "$missing" -gt 0 ]; then
    echo ""
    echo "Run scripts/bootstrap_refs.sh to clone missing repos."
fi
