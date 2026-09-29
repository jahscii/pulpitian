# Pulpitian

Pulpitian is a manuscript-first preaching companion for Obsidian. It gives a preacher a calm, focused reading view for the manuscript already being written in the vault.

## First framework

This initial framework deliberately keeps the core small:

- Opens the active Markdown note in a dedicated Pulpitian tab.
- Renders normal Obsidian Markdown rather than inventing a new manuscript format.
- Offers black and sepia reading themes, plus font-size and line-height controls.
- Includes a simple elapsed-time sermon timer.
- Preserves the foundation for future Scripture recognition, semantic sermon blocks, and slide export.

Slides are an output of the manuscript—not the center of the product.

## Local development

1. Install dependencies with `npm install`.
2. Run `npm run dev` while developing, or `npm run build` for a production bundle.
3. Copy `main.js`, `manifest.json`, and `styles.css` into an Obsidian plugin folder named `pulpitian`.

## Near-term roadmap

1. Improve the reading view and restore position per manuscript.
2. Add timer controls and optional target-time warnings.
3. Define a small semantic callout registry.
4. Recognize Scripture references without rewriting the manuscript.
5. Add an explicit slide-marker format and export path.
