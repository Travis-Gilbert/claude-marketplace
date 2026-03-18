---
name: framework-migration
description: Guided framework migration checklist — pick source and target framework, get a step-by-step migration plan with grep commands to find what needs changing.
type: command
---

# Framework Migration Checklist

You are a **migration specialist**. When the user invokes `/framework-migration`, guide them through a structured migration workflow.

## Step 1: Identify Source Framework

Ask the user what they're migrating FROM. Detect automatically if possible by scanning the codebase:

```bash
# Auto-detect source framework
grep -rn "angular\.\|ng-\|\$scope" src/          # AngularJS 1.x
grep -rn "\$.ajax\|\$.get\|jQuery\|\$(" src/      # jQuery
grep -rn "require(\|module\.exports" src/         # CommonJS
grep -rn "extends React\.Component\|this\.state\|this\.setState" src/  # React class components
grep -rn "createClass\|React\.createClass" src/   # React legacy
grep -rn "Vue\.\|new Vue\|createApp" src/         # Vue.js
```

### Source Patterns Reference

| Source | Key Patterns | Detection |
|--------|-------------|-----------|
| **AngularJS 1.x** | `$scope`, `ng-repeat`, `ng-if`, `.controller()`, `.service()`, `.factory()`, DI arrays | `grep -rn "ng-\|angular\.\|\$scope"` |
| **jQuery** | `$()`, `$.ajax`, `.click()`, `.on()`, `.html()`, `.append()` | `grep -rn "\$(\|\$.ajax\|jQuery"` |
| **CommonJS** | `require()`, `module.exports` | `grep -rn "require(\|module\.exports"` |
| **React class components** | `extends Component`, `this.state`, `this.setState`, lifecycle methods | `grep -rn "extends.*Component\|this\.setState"` |
| **Vue 2 Options API** | `new Vue()`, `data()`, `methods:`, `computed:`, `watch:` | `grep -rn "new Vue\|data()\|methods:"` |

## Step 2: Choose Target Framework

Present these options based on the source:

| Target | Best For | Complexity |
|--------|----------|-----------|
| **React 19** | Full SPA, complex state, large team | High |
| **Next.js 15** | SSR/SSG, SEO, full-stack React | High |
| **Alpine.js** | Sprinkle interactivity, small apps, familiar Angular-like syntax | Low |
| **HTMX** | Server-rendered apps, minimal JS, keep existing backend | Very Low |
| **ESM (no framework)** | Just modernize module system | Low |
| **React hooks** | Already React, just modernizing class → function | Medium |

## Step 3: Generate Migration Checklist

Based on source → target selection, generate a specific checklist. Below are the migration maps:

---

### AngularJS 1.x → React 19

| AngularJS Pattern | React Equivalent | Migration Step |
|-------------------|-----------------|----------------|
| `$scope` properties | `useState()` | Extract state variables from controllers |
| `$scope.$watch(expr, fn)` | `useEffect(() => {}, [deps])` | Convert watchers to effects with dep arrays |
| `.controller('Name', fn)` | `function Name(props) {}` | Controller → function component |
| `ng-repeat="item in items"` | `{items.map(item => <div key={item.id}/>)}` | Always add `key` prop |
| `ng-if="condition"` | `{condition && <div/>}` | Conditional rendering |
| `ng-click="handler()"` | `onClick={handler}` | Event handler props |
| `ng-model` | `value={state} onChange={e => setState(e.target.value)}` | Explicit two-way binding |
| `ng-class="{cls: cond}"` | `className={cond ? 'cls' : ''}` | Conditional classes |
| `$http.get()` / `$http.post()` | `fetch()` with `async/await` | Standard web APIs |
| `.service()` / `.factory()` | Custom hooks or Context API | Extract into `useXxx()` |
| `$scope.$emit` / `$scope.$on` | Context API or state manager | Replace event bus |
| Filters `{{ val \| filter }}` | Inline function calls `{format(val)}` | No pipe syntax in JSX |
| `angular.module()` | ES module `import/export` | File-based modules |

**Find candidates:**
```bash
grep -rn "ng-repeat\|ng-if\|ng-show\|ng-click\|ng-model" src/
grep -rn "\$scope\.\$watch\|\$scope\.\$on\|\$scope\.\$emit" src/
grep -rn "\$http\.get\|\$http\.post" src/
grep -rn "module\.controller\|module\.service\|module\.factory" src/
```

---

### AngularJS 1.x → Next.js 15

Same as AngularJS → React, plus:

| Additional Step | What to Do |
|----------------|-----------|
| Routing | Replace `ng-route` / `ui-router` with Next.js App Router file-based routing |
| Server data | Move `$http.get()` calls to Server Components or `fetch()` in server actions |
| SEO | Use `generateMetadata()` for `<title>`, `<meta>` (was manual in Angular) |
| Forms | Use React Server Actions for form submissions |
| API endpoints | Create `route.ts` handlers in `app/api/` |

---

### AngularJS 1.x → Alpine.js

| AngularJS | Alpine.js | Notes |
|-----------|-----------|-------|
| `.controller('X', fn)` | `x-data="{ state }"` | No DI container needed |
| `$scope` properties | Properties in `x-data` | Direct JS objects |
| `ng-repeat` | `x-for="item in items"` | Nearly identical syntax |
| `ng-if` | `x-if="condition"` | Nearly identical |
| `ng-show` / `ng-hide` | `x-show="condition"` | Toggle visibility |
| `$scope.$watch()` | Automatic (Proxy reactivity) | No explicit watchers |
| `ng-click="fn()"` | `@click="fn()"` | Short event syntax |
| `ng-class` | `:class="{ cls: cond }"` | Same concept |
| `$http.get()` | `fetch()` | Standard APIs |

**Lowest effort migration** — syntax similarities make this nearly 1:1.

---

### jQuery → HTMX

| jQuery Pattern | HTMX Equivalent | Notes |
|----------------|-----------------|-------|
| `$.ajax({ url, success })` | `hx-get="/url"` | Declarative AJAX |
| `$.post(url, data)` | `hx-post="/url"` | Form-encoded by default |
| `$(target).html(response)` | `hx-target="#target" hx-swap="innerHTML"` | Server returns HTML |
| `$('.btn').click(fn)` | `hx-trigger="click"` | Declarative events |
| `$(el).append(html)` | `hx-swap="beforeend"` | Append strategy |
| `$(el).fadeIn()` | CSS transitions + `htmx:afterSwap` | CSS-based animation |
| `$.getJSON()` | Keep as-is or use `hx-get` + JSON response handler | HTMX is HTML-first |

**Find candidates:**
```bash
grep -rn "\$.ajax\|\$.get\|\$.post" src/
grep -rn "\.click(\|\.on(\|\.bind(" src/
grep -rn "\$(.*).html(\|\$(.*).append(\|\$(.*).replaceWith(" src/
```

---

### CommonJS → ESM

| CommonJS | ESM | Notes |
|----------|-----|-------|
| `const x = require('x')` | `import x from 'x'` | Default import |
| `const { a, b } = require('x')` | `import { a, b } from 'x'` | Named imports |
| `module.exports = x` | `export default x` | Default export |
| `module.exports.fn = fn` | `export function fn() {}` | Named export |
| `__dirname` | `import.meta.dirname` (Node 21+) or `fileURLToPath(import.meta.url)` | Path resolution |
| `__filename` | `import.meta.filename` (Node 21+) | File path |
| Dynamic `require(expr)` | `await import(expr)` | Dynamic import (async) |

Add to `package.json`: `"type": "module"`

**Find candidates:**
```bash
grep -rn "require(\|module\.exports" src/
grep -rn "__dirname\|__filename" src/
```

---

### React Class → Hooks

| Class Pattern | Hook Equivalent | Notes |
|---------------|----------------|-------|
| `this.state = {}` | `const [state, setState] = useState()` | Per-value useState |
| `this.setState()` | `setState()` or `dispatch()` | Direct or reducer |
| `componentDidMount` | `useEffect(() => {}, [])` | Empty dep array |
| `componentDidUpdate` | `useEffect(() => {}, [deps])` | With dependencies |
| `componentWillUnmount` | `useEffect(() => { return cleanup }, [])` | Return cleanup function |
| `shouldComponentUpdate` | `React.memo()` wrapper | Wrap the function component |
| `this.refs.x` | `const ref = useRef()` | Ref hook |
| `static contextType` | `useContext(MyContext)` | Context hook |
| Error boundaries | Keep as class (no hook equivalent yet) | Only exception |

**Find candidates:**
```bash
grep -rn "extends.*Component\|extends.*PureComponent" src/
grep -rn "this\.state\|this\.setState" src/
grep -rn "componentDidMount\|componentWillUnmount\|componentDidUpdate" src/
```

## Step 4: Execution Plan

After generating the checklist, provide an ordered execution plan:

1. **Audit** — Run the grep commands to quantify the migration scope
2. **Setup** — Install target framework, configure build tools
3. **Shared utilities first** — Migrate helpers, services, API clients
4. **Leaf components** — Start with smallest, most isolated components
5. **Work inward** — Progress from leaves to container/page components
6. **Routes last** — Migrate routing after all components are done
7. **Test each step** — Run tests after each component migration
8. **Remove old code** — Only after full migration + test pass

## Verification

Reference repos available for pattern verification:
- React: `~/.claude/js-pro/refs/react-main/`
- Angular 1.x: `~/.claude/js-pro/refs/angular.js-master/`
- Alpine.js: `~/.claude/js-pro/refs/alpine-main/`
- HTMX: `~/.claude/js-pro/refs/htmx-master/`
- Observable Framework: `~/.claude/js-pro/refs/framework-main/`
