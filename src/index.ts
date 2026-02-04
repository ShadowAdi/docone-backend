import { textTranslate } from "./utils/text-translate";
import { extractFromDocument } from "./utils/document-extractor";
import { translateAndSaveDocx } from "./utils/docx-xml-handler";

// Option 1: Extract text from any supported document format
// Currently only DOCX works - PDF, PPTX, and DOC will throw errors with proper logging
extractFromDocument("./src/data/test.docx")
  .then((result) => {
    console.log("Extracted text nodes:", result.length);
    result.forEach((r) => {
      console.log(`[${r.id}] ${r.text} → ${textTranslate(r.text)}`);
    });
  })
  .catch((error) => {
    console.log(`Failed to extract text from the file:`, error);
  });

// Option 2: Translate and save DOCX (preserves formatting)
// translateAndSaveDocx(
//   "./src/data/test.docx",
//   "./src/data/test-translated.docx",
//   textTranslate
// )
//   .then(() => {
//     console.log("✅ Translation complete! Check ./src/data/test-translated.docx");
//   })
//   .catch((error) => {
//     console.log(`Failed to translate DOCX:`, error);
//   });