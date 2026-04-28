# Domain Packs: Knowledge Domain Specialization

> Pre-built ontology extensions and evaluation benchmarks that teach the engine how a specific domain organizes knowledge.

## What Is a Domain Pack

A domain pack is a bundle of domain-specific configuration that lets the engine
perform better in a particular knowledge area. Without packs, the engine treats
all knowledge identically. With a CS domain pack installed, it knows that
"function" and "method" are related concepts, that "inherits from" is a
meaningful relation type, and that a CS-specific NER model should recognize
framework names.

Domain packs are the mechanism behind Level 5 (Self-Modifying Pipeline) and
feed into the domain-specialization agent.

## Pack Contents

Each domain pack includes:

**Entity types**: Domain-specific Object subtypes or classification labels.
For CS: Algorithm, Data Structure, Design Pattern, Framework, Language.

**Relation types**: Domain-specific Edge types beyond the base 14.
For CS: implements, extends, deprecates, benchmarks-against.

**NER patterns**: PhraseMatcher rules and entity lists for adaptive NER.
For CS: framework names, algorithm names, API terms.

**Evaluation benchmarks**: Ground-truth connection sets for measuring engine
accuracy within this domain. Used by the IQ Tracker for domain-specific scoring.

**Reference sources**: Curated list of authoritative sources for web validation.
For CS: official documentation sites, key papers, canonical textbooks.

## Pack Format

Domain packs are Django fixtures (JSON) loadable via `manage.py loaddata`.
This keeps them version-controlled, portable, and testable.

```
domain-packs/
    cs/
        entity_types.json
        relation_types.json
        ner_patterns.json
        benchmarks.json
        sources.json
        manifest.json       # Pack metadata, version, dependencies
    law/
        ...
```

## Installation

```bash
# Install a domain pack
python manage.py loaddata domain-packs/cs/entity_types.json
python manage.py loaddata domain-packs/cs/relation_types.json
# ... or a management command that loads all fixtures in a pack:
python manage.py install_domain_pack cs
```

Packs are additive. Installing a pack never removes or modifies existing
data. Uninstalling is a separate operation (soft-delete pack-contributed types).

## CS Domain Pack (Reference Implementation)

The computer science domain pack is the first and serves as the template for
all future packs. See `docs/computer-science-domain-pack-source-map.md` for
the source mapping.

<!-- Fill in specifics during implementation -->

**Entity types**: Algorithm, Data Structure, Design Pattern, Framework,
Programming Language, Library, Protocol, Specification.

**Relation types**: implements, extends, alternative-to, deprecates,
wraps, benchmarks-against, compiles-to, depends-on.

**NER patterns**: ~500 terms covering major frameworks, languages,
algorithms, and CS concepts.

**Benchmarks**: Curated set of 100+ known-good connections from CS
literature for IQ Discovery axis evaluation.

## Creating New Packs

Steps to create a domain pack for a new field:

1. Identify 5-10 entity types specific to the domain
2. Identify 5-10 relation types beyond the base 14
3. Compile NER term lists (100+ terms minimum for useful coverage)
4. Create evaluation benchmarks (50+ known-good connections)
5. Curate reference source list for web validation
6. Write Django fixtures in the pack format
7. Test: install pack, ingest domain content, measure IQ axes
8. Document in manifest.json with version and dependencies

<!-- Future packs under consideration: law, philosophy, built environment,
biology, economics -->
