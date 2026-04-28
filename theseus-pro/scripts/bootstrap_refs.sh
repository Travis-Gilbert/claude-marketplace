#!/usr/bin/env bash
set -euo pipefail

# Theseus-Pro: Clone all reference repositories.
# Run from the plugin root: ./scripts/bootstrap_refs.sh
# Requires: git

REFS_DIR="$(cd "$(dirname "$0")/.." && pwd)/refs"
mkdir -p "$REFS_DIR"

clone_if_absent() {
    local url="$1" dir="$2"
    if [ ! -d "$REFS_DIR/$dir" ]; then
        echo "[clone] $dir"
        git clone --depth 1 "$url" "$REFS_DIR/$dir"
    else
        echo "[skip]  $dir (already cloned)"
    fi
}

echo "============================================"
echo "  Theseus-Pro Reference Repository Bootstrap"
echo "============================================"
echo ""

echo "=== Tier 1: Epistemic Foundation (from SciPy-Pro v4) ==="
clone_if_absent https://github.com/UKPLab/sentence-transformers.git   sentence-transformers
clone_if_absent https://github.com/networkx/networkx.git              networkx
clone_if_absent https://github.com/explosion/spaCy.git                spacy
clone_if_absent https://github.com/scikit-learn/scikit-learn.git      scikit-learn
clone_if_absent https://github.com/facebookresearch/faiss.git         faiss
clone_if_absent https://github.com/pykeen/pykeen.git                  pykeen
clone_if_absent https://github.com/pytorch/pytorch.git                pytorch
clone_if_absent https://github.com/dorianbrown/rank_bm25.git         rank-bm25
clone_if_absent https://github.com/mendableai/firecrawl.git           firecrawl
clone_if_absent https://github.com/tree-sitter/tree-sitter.git        tree-sitter

echo ""
echo "=== Tier 2: Intelligence Layer ==="

# Graph Neural Networks
clone_if_absent https://github.com/pyg-team/pytorch_geometric.git     pyg
clone_if_absent https://github.com/dmlc/dgl.git                       dgl
clone_if_absent https://github.com/BorealisAI/SLAPS-GNN.git           slaps-gnn
clone_if_absent https://github.com/DeepGraphLearning/ULTRA.git        ultra

# Temporal Graph Memory
clone_if_absent https://github.com/Travis-Gilbert/Temporal-Graph-Networks_tgn.git  tgn
clone_if_absent https://github.com/twitter-research/tgn.git            tgn-official
clone_if_absent https://github.com/BorealisAI/de-simple.git            de-simple
clone_if_absent https://github.com/benedekrozemberczki/pytorch_geometric_temporal.git  pyg-temporal

# Learned Scoring
clone_if_absent https://github.com/dmlc/xgboost.git                   xgboost
clone_if_absent https://github.com/microsoft/LightGBM.git             lightgbm
clone_if_absent https://github.com/pytorch/torchrec.git                torchrec

# Language Model Training
clone_if_absent https://github.com/pytorch/torchtune.git               torchtune
clone_if_absent https://github.com/huggingface/transformers.git        transformers
clone_if_absent https://github.com/stanfordnlp/dspy.git                dspy

# Multi-Agent Reasoning
clone_if_absent https://github.com/microsoft/autogen.git               autogen

# Multimodal
clone_if_absent https://github.com/zjukg/NATIVE.git                    native
clone_if_absent https://github.com/HKUST-KnowComp/AutoSchemaKG.git    autoschemakg

echo ""
echo "=== Tier 3: Generative Intelligence ==="

# Symbolic Reasoning
clone_if_absent https://github.com/lab-v2/pyreason.git                 pyreason
clone_if_absent https://github.com/tdiam/belief-revision-engine.git    belief-revision-engine
clone_if_absent https://github.com/DeepGraphLearning/RNNLogic.git      rnnlogic
clone_if_absent https://github.com/scallop-lang/scallop.git            scallop
clone_if_absent https://github.com/Tijl/ANASIME.git                    anasime

# Reinforcement Learning
clone_if_absent https://github.com/shehzaadzd/MINERVA.git              minerva
clone_if_absent https://github.com/DLR-RM/stable-baselines3.git        stable-baselines3
clone_if_absent https://github.com/opendilab/DI-engine.git              di-engine
clone_if_absent https://github.com/owenonline/Knowledge-Graph-Reasoning-with-Self-supervised-Reinforcement-Learning.git  kg-rl

# Evolutionary Optimization
clone_if_absent https://github.com/DEAP/deap.git                       deap
clone_if_absent https://github.com/optuna/optuna.git                    optuna
clone_if_absent https://github.com/learnables/learn2learn.git           learn2learn

# Few-Shot and Generalization
clone_if_absent https://github.com/AnselCmy/MetaR.git                  metar
clone_if_absent https://github.com/JinheonBaek/GEN.git                 gen
clone_if_absent https://github.com/snap-stanford/neural-subgraph-learning-GNN.git  subgraph-gnn

# Uncertainty
clone_if_absent https://github.com/pymc-devs/pymc.git                  pymc
clone_if_absent https://github.com/clabrugere/evidential-deeplearning.git  evidential-dl
clone_if_absent https://github.com/pujacomputes/gduq.git               gduq
clone_if_absent https://github.com/iesl/box-embeddings.git             box-embeddings

# Provenance and Workflow
clone_if_absent https://github.com/aiidateam/aiida-core.git            aiida-core

# RAG and Structured Answering
clone_if_absent https://github.com/kbeaugrand/KernelMemory.StructRAG.git  structrag

# Interpretability
clone_if_absent https://github.com/shap/shap.git                       shap

echo ""
echo "=== Symlinking Index-API codebase ==="
# Try common locations
for candidate in \
    "$REFS_DIR/../../../Index-API" \
    "$HOME/Index-API" \
    "$HOME/projects/Index-API" \
    "$HOME/code/Index-API"; do
    if [ -d "$candidate" ]; then
        ln -sfn "$(cd "$candidate" && pwd)" "$REFS_DIR/index-api"
        echo "[link] index-api -> $candidate"
        break
    fi
done
if [ ! -L "$REFS_DIR/index-api" ]; then
    echo "[warn] Index-API not found locally."
    echo "       Clone https://github.com/Travis-Gilbert/Index-API.git"
    echo "       and run this script again, or create the symlink manually:"
    echo "       ln -s /path/to/Index-API $REFS_DIR/index-api"
fi

echo ""
TOTAL=$(find "$REFS_DIR" -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')
echo "=== Done. $TOTAL reference directories ready. ==="
