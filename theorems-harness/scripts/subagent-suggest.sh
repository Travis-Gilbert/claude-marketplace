#!/usr/bin/env bash
# UserPromptSubmit companion hook. The native Ensemble route now owns capability
# selection, so this hook no longer calls the old Pairformer complexity endpoint.

set -uo pipefail

printf '{"continue":true}\n'
