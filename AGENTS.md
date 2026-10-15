<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Application structure

- Keep reference screen markup in `src/data/screens.json` and render it through the shared Radar screen component, so all supplied variants preserve their source layouts.
- Keep reference visual values in `src/styles.css` semantic tokens; imported reference classes resolve to those tokens rather than embedded colors.
- Use TanStack file routes for each workspace page and the shared screen renderer for navigation and preview interactions; this project currently recreates a demo UI, not live API integrations or persistent storage.
