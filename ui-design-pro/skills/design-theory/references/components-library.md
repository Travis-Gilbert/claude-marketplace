# Components Library

Curated catalog of 39 saved component implementations. Source files live
in the user's project at:

`/Users/travisgilbert/Tech Dev Local/Creative/Website/Index-API/docs/Design Components/`

Each row points at a single `.md` file whose body is a ready-to-adapt
TSX/JSX implementation. Most components target Next.js + Tailwind +
shadcn/Radix conventions and use `@/lib/utils` for `cn()`.

## Components-first protocol

**When the user asks to build a UI surface, scan this catalog FIRST.**
If a row's bucket and one-line summary match the user's intent, propose
that file as the starting point before writing any new JSX. Quote the
file path verbatim so the user can open the source.

If nothing fits, fall back to `external-design-knowledge.md` (vendored
component libraries). Only if BOTH fail do you write hand-rolled JSX,
and you must explicitly flag in the response that nothing in the library
fit and why.

## Catalog

| File | Bucket | Use case |
|---|---|---|
| `API Play ground.md` | dev playground | Interactive API playground UI (request/response panel) |
| `Bento cards layout.md` | layout / grid | Bento grid of feature cards with mixed sizes |
| `Best Dock Design.md` | navigation / dock | macOS-style dock with hover scaling |
| `Book component.md` | composition | Book-style page viewer with spread layout |
| `Browser style tabs.md` | navigation / tabs | Tabs styled like browser address-bar tabs |
| `CPU Architecture.md` | decorative / tech visual | Animated CPU/chip diagram, marketing hero filler |
| `Connect icons.md` | decorative / icon row | Row of brand/tech icons with connecting lines |
| `Cool links.md` | composition / link list | Stylized link list with hover effects |
| `Dashboard 1.md` | monitoring / dashboard | Full dashboard layout (sidebar + cards + chart) |
| `Dashboard 2.md` | monitoring / dashboard | Alternate dashboard layout, denser variant |
| `Dotted animation surface.md` | decorative / background | Animated dot-grid background surface |
| `Download Button.md` | input / button | Download button with progress/state animation |
| `Dynamic Island TOC.md` | navigation / TOC | Floating dynamic-island-style table of contents |
| `Example mockup.md` | composition / mockup | Generic browser/device mockup frame |
| `Feature Carousel.md` | marketing / carousel | Horizontal carousel of feature cards |
| `File tree 1.md` | navigation / file tree | Collapsible file tree, classic style |
| `File tree 2.md` | navigation / file tree | File tree variant with different chrome |
| `File uploader.md` | input / uploader | Drag-and-drop file upload zone |
| `Footer.md` | marketing / footer | Multi-column site footer |
| `Globe.md` | decorative / 3D viz | Animated 3D globe (likely cobe or react-globe) |
| `Marketing hero.md` | marketing / hero | Landing-page hero section with CTA |
| `Menu.md` | navigation / menu | Dropdown or context menu |
| `Mobile dock.md` | navigation / mobile dock | Bottom-anchored mobile navigation dock |
| `Morphing notes.md` | decorative / animation | Stacked note cards with morphing transition |
| `Morphing text.md` | decorative / text animation | Text that morphs between strings |
| `Moving border.md` | decorative / animation | Animated gradient border on a card |
| `Pricing .md` | marketing / pricing | Pricing card grid |
| `Pricing 2.md` | marketing / pricing | Alternate pricing layout |
| `Pricing interaction.md` | marketing / pricing | Pricing with interactive comparison toggle |
| `Shadcn.md` | reference / shadcn | Generic shadcn pattern reference |
| `Shadnc block 2.md` | composition / shadcn block | Shadcn-style composed block (probably hero or feature) |
| `Simple tabs.md` | navigation / tabs | Minimal tab bar |
| `Skill Chart.md` | monitoring / chart | Skill/proficiency chart (likely radar or bar) |
| `Slider.md` | input / slider | Range slider component |
| `Snipped.md` | misc / snippet | (Unclear: likely code-snippet display component) |
| `Tabs 2.md` | navigation / tabs | Alternate tab variant |
| `Test scrammble.md` | decorative / text animation | Text-scramble effect |
| `Text scramble corners.md` | decorative / text animation | Scramble effect at corners of a layout |
| `Tilt card.md` | composition / card | 3D-tilt card on mouse hover |

## Buckets at a glance

- **monitoring**: Dashboard 1, Dashboard 2, Skill Chart
- **navigation**: Best Dock Design, Browser style tabs, Dynamic Island TOC, File tree 1, File tree 2, Menu, Mobile dock, Simple tabs, Tabs 2
- **marketing**: Feature Carousel, Footer, Marketing hero, Pricing, Pricing 2, Pricing interaction
- **input**: Download Button, File uploader, Slider
- **composition**: Bento cards layout, Book component, Cool links, Example mockup, Shadnc block 2, Tilt card
- **decorative / animation**: Connect icons, CPU Architecture, Dotted animation surface, Globe, Morphing notes, Morphing text, Moving border, Test scrammble, Text scramble corners
- **dev / exploration**: API Play ground
- **reference / misc**: Shadcn, Snipped

## Notes

- Filenames are kept verbatim including typos (`Shadnc block 2`,
  `Test scrammble`) so paths resolve. Do not rename the source files.
- The folder also contains 3 meta files (`Design Components.md`,
  `Design Ideas .md`, `Ideas to build from.md`) that are not components
  and are not listed here.
- When a row is a better starting point than a vendored library
  primitive, prefer the row. These were curated; the libraries are
  general.
