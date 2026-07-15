# Practice System Source Provenance

The Harness practice system is a maintained Theorem adaptation. It is not an
unmodified bundle and does not add a second MCP server.

| Source | Pinned commit | Imported semantics | License |
|---|---|---|---|
| `obra/superpowers` | `d884ae04edebef577e82ff7c4e143debd0bbec99` | problem framing, planning, isolation, test-first execution, systematic debugging, review, verification, branch completion, subagent-driven execution when available | MIT |
| `obra/episodic-memory` | `10757690210574421f1df5f35835af8d0c74d984` | idempotent episode capture, bounded search/read, source pointers, project/session/branch filters, opt-out | MIT |
| `obra/the-elements-of-style` | `6099c505c2a8eb066f3777f83a97d9d828f7954c` | the 1918 rule catalog and progressive disclosure for Writing Engineering | Public domain per upstream |

The pinned Superpowers tree is
`795caed14920f27a1d2d152a09b4720194f64472`. The runtime binds each imported
Superpowers skill source to a SHA-256 manifest and compiles the canonical graph
to content address
`eab1a8bcbc25189e586dcc3d6b620dab7a2f21ee766f45822fd423a6aa67c0ce`.

The Elements import remains inside the existing Writing Engineering pack. Its
full source hash is
`sha256:d0edf854b5d39e22da68793603830e5bbdddb9266d272007993bcb821ba2799d`
and its source skill hash is
`sha256:1448ea19147b339ce37ae70551b233bb329d6bdfa46f0bf627b43b6133372233`.

## Adaptation boundary

- Harness Plans replace ad hoc task files.
- Harness coordination replaces generic subagent choreography.
- Ensemble holds versioned practice graphs and deterministic selection.
- The runtime records practice and validation evidence.
- RustyRed graph/vector/memory contracts hold episodes.
- Compound Engineering owns outcome attribution and proposal-based learning.
- Writing Engineering owns Elements-derived rules and receipts.

Do not restore retired practice aliases, standalone episodic-memory storage, or a
parallel Elements skill pack.
