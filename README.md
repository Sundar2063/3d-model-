# Forma — Photo to 3D Studio

An initial responsive frontend for a multi-category, four-view photo-to-3D platform.

## Run locally

No build step is required. With Python 3 installed:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. Internet access is needed for the pinned model-viewer module and optional Google Fonts. The viewer requires a browser with WebGL.

## Working features

- Front, back, left and right photo selection with previews and removal.
- JPG/PNG/WebP validation, image decoding, and a 15 MB per-photo limit.
- Categories for people, animals, furniture, products and other subjects.
- Download a JSON photo brief after selecting all four photos. The brief contains metadata, not image bytes.
- Import a self-contained GLB 2.0 model (up to 50 MB), orbit, zoom, auto-rotate and reset its view.
- Download the original imported GLB. This is not a format conversion or AI output.
- Responsive layouts and keyboard-accessible controls.

Photos and imported models stay in browser memory and are lost on refresh. This version does not send them to a generation service or provide account storage. The browser requests viewer code and fonts from third-party CDNs.

## Not implemented yet

**AI photo-to-3D generation is not connected.** The Generate button is intentionally disabled and the UI states this clearly. There is no generated example pretending to be the user's result.

The 4K texture setting is a planned target, not an implemented texture pipeline or a promise of accurate detail. OBJ conversion, rigging, authentication, persistent projects, billing and deployment are also not implemented.

## Next: real generation

Select a provider with explicit multi-view image support and appropriate output/licensing terms. Add a server-side adapter that accepts the four photos, creates a generation job, polls its status, and returns a downloadable GLB. Provider secrets must live in server environment variables, never frontend code, commits, or a public repository. Add authentication, per-user quotas, file validation, upload limits, consent controls and job storage before opening a paid generation endpoint publicly. Human, animal and object results require separate quality evaluation; four photos cannot capture all hidden surfaces.

Suggested API contract (design only, no endpoints exist yet):

- `POST /api/generations`: authenticated multipart upload; returns a job ID.
- `GET /api/generations/:id`: ownership-checked status and result metadata.
- `GET /api/generations/:id/model`: ownership-checked GLB download.

## Files

- `index.html`: studio structure and controls.
- `style.css`: responsive visual design.
- `app.js`: local photo and model interactions.

## Validation

`node --check app.js` checks JavaScript syntax. The initial implementation also passed static HTML parsing, DOM ID/reference checks and local HTTP delivery checks. Interactive browser/WebGL behavior still requires manual verification.

Manual smoke test: select four valid photos; replace and remove one; reject an oversized or malformed image; export the brief; import a valid GLB; orbit/zoom, toggle rotation, reset and download; try an invalid GLB; inspect on mobile and with keyboard navigation.

## Hosting

These static files can be hosted on a static web host. No hosting has been enabled by this commit. For GitHub Pages, select the `main` branch and repository root in repository Settings → Pages if you want the frontend publicly accessible. A server-side generation service must be deployed separately.
