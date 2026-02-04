import { textTranslate } from "./utils/text-translate";
import { extractFromDocument, translateAndSaveDocument } from "./utils/document-extractor";

// Option 1: Extract text only (for preview/testing)
// Test with different file formats:
// extractFromDocument("./src/data/test.txt")     // Plain text
// extractFromDocument("./src/data/test.md")      // Markdown
// extractFromDocument("./src/data/test.html")    // HTML
// extractFromDocument("./src/data/test.csv")     // CSV
// extractFromDocument("./src/data/test.rtf")     // RTF
// extractFromDocument("./src/data/test.docx")    // DOCX
// extractFromDocument("./src/data/test.pptx")    // PowerPoint
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

// Option 2: Translate and save any document
// Supports: .docx, .pptx, .pdf, .txt, .md, .html, .csv, .rtf
// translateAndSaveDocument(
//   "./src/data/test.txt",  // Input file
//   "./src/data/test-translated.txt",  // Output file
//   textTranslate
// )
//   .then(() => {
//     console.log("✅ Translation complete! Check the output file");
//   })
//   .catch((error) => {
//     console.log(`Failed to translate document:`, error);
//   });