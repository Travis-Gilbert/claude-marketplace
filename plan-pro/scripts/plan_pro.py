"""plan-pro orchestrator entry point."""
from __future__ import annotations

import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: plan_pro.py {plan|execute|review|retrofit} [args...]", file=sys.stderr)
        return 2
    cmd = sys.argv[1]
    print(f"plan_pro: {cmd} (not yet implemented)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
