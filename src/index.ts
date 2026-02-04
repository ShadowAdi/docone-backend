import { textTranslate } from "./utils/text-translate";
import { extractFromDocument, translateAndSaveDocument } from "./utils/document-extractor";

// Option 1: Extract text only (for preview/testing)
// extractFromDocument("./src/data/test.docx")
//   .then((result) => {
//     console.log("Extracted text nodes:", result.length);
//     result.forEach((r) => {
//       console.log(`[${r.id}] ${r.text} → ${textTranslate(r.text)}`);
//     });
//   })
//   .catch((error) => {
//     console.log(`Failed to extract text from the file:`, error);
//   });

// Option 2: Translate and save any document (DOCX and PPTX work!)
// Automatically detects format and preserves structure
translateAndSaveDocument(
  "./src/data/test2.pdf",  // Supports: .docx, .pptx, .pdf
  "./src/data/test2-translated.pptx",
  textTranslate
)
  .then(() => {
    console.log("✅ Translation complete! Check the output file");
  })
  .catch((error) => {
    console.log(`Failed to translate document:`, error);
  });

// Example for PDF (uses CloudConvert API - only called during translation)
// translateAndSaveDocument(
//   "./src/data/sample.pdf",
//   "./src/data/sample-translated.pdf",
//   textTranslate
// )
//   .then(() => {
//     console.log("✅ PDF Translation complete!");
//   })
//   .catch((error) => {
//     console.log(`Failed to translate PDF:`, error);
//   });