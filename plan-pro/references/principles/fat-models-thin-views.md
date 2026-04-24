# Fat Models, Thin Views

Business logic belongs on the model (or in a domain service module). Views / controllers / endpoints are glue: parse input, call the model, render output.

## The principle

A view that has a SQL join, a validation rule, and a business calculation is a view doing too much. Each of those belongs somewhere more durable than the request handler.

| Belongs on the model | Belongs on the view |
|---|---|
| Business rules | HTTP status selection |
| Validation of domain invariants | JSON serialization |
| Computed properties | Query param parsing |
| Authorization (who can do what) | Response content negotiation |
| Event emission | Rate-limiting decisions |

## Why this matters

Models are reusable across contexts (views, CLIs, background jobs, tests). Views are specific to one context.

Business logic in a view is logic you can't invoke from a CLI, can't test in isolation, and can't reuse when a mobile app wants the same behavior with a different response shape.

## plan-pro's quality-reviewer check

When reviewing backend code:

- View body > 10 lines doing non-trivial work → flag
- View body containing `.filter()`, `.aggregate()`, or calculations → consider moving to manager or service
- View body containing `if user.is_admin or user.is_owner:` (authorization) → move to a `can_access(user)` method
- View body with business validation → move to model validator or service

## The "thin view" shape

```python
def share_project(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    form = ShareForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)
    share = project.share_with(
        recipient_email=form.cleaned_data["email"],
        initiator=request.user,
    )
    return JsonResponse(ShareSerializer(share).data, status=201)
```

Four lines of glue, one call into the domain. The `share_with` method on the Project model owns: authorization, Share creation, event emission, side effects.

## Counter-cases

- Very small views in very small apps don't need extraction. The rule of three applies here too: if one view has the logic once, leave it. If three views have it, extract.
- Anemic models (data classes with no behavior) are not virtuous either. If you're writing `Service` classes for every model method, you've swung too far — that's Java DAO thinking.

## Applies to

- Django (fat models, thin views)
- Rails (fat models, thin controllers)
- Next.js API routes (thin route handlers, domain logic in `lib/` or `services/`)
- Any web framework with request → handler → response

## Related

- `kiss-dry-yagni.md` — if the same logic lives in three views, DRY applies: extract to model or service
- `elegance-via-constraint.md` — fat models emerge when you constrain view responsibility to glue
