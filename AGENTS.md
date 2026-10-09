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

# Agent rules

- All app data (parties, products, rates, vehicles, entries) lives in Supabase tables and is read through live hooks in src/lib/store.ts with realtime subscriptions — so every device sees the same data instantly.
- Photos/signatures upload directly from the browser to Cloudinary using a server-signed request — keeps the API secret on the server and large files off the worker.
- Slip OCR runs in a server function calling the AI gateway — keeps the AI key server-side.
