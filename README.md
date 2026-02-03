# DocOne Backend — Text Extraction

This service extracts plain text from uploaded documents. For now, it reads text that is natively stored in the file formats (e.g., text boxes in PPTX, paragraphs in DOC/DOCX/PDF). Text embedded inside images is intentionally ignored — no OCR is performed.

## Supported File Types

- DOC (`word-extractor`)
- DOCX (`word-extractor`)
- PDF (`pdf-parse`)
- PPT/PPTX (`node-pptx-parser`)

## Current Behavior

- Extracts text content from supported formats.
- Filters out empty lines and returns an array of line objects: `{ id, text, type: 'line' }`.
- In PPT/PPTX, reads text from slides (titles, text boxes, etc.).
- Does not extract text contained inside images (no OCR).

## Limitations (By Design)

- No OCR: images with text are skipped.
- This keeps processing fast and simple. If OCR is needed, we can add it later as an opt-in feature.

## Usage

Minimal example using the high-level `TextExtraction` utility:

```ts
import { TextExtraction } from "./src/utils/textExtraction";

TextExtraction("./src/data/test3.pptx")
  .then((result) => {
    console.log("Extracted lines:", result);
  })
  .catch((error) => {
    console.error("Failed to extract text:", error);
  });
```

## Run Locally

```bash
npm install
npm run dev
```

Place a test file under `src/data/` and update the path in `src/index.ts` as needed.

## Future Work (Optional)

- Add an OCR mode to process images (e.g., via `tesseract.js` or cloud OCR), gated behind a config flag to avoid performance hits when not needed.
