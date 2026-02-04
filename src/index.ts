import { textTranslate } from "./utils/text-translate";
import { extractFromDocument, translateAndSaveDocument } from "./utils/document-extractor";

/**
 * SUPPORTED FILE FORMATS:
 * - Text-based: .txt, .md, .html, .csv, .rtf
 * - Documents: .docx (✅), .pptx (✅), .pdf (⚠️ requires API key)
 */

// ============================================================================
// OPTION 1: Extract text only (for preview/testing)
// ============================================================================
// Use this to preview extracted text before translation
// extractFromDocument("./src/data/test.txt")
//   .then((result) => {
//     console.log("Extracted text nodes:", result.length);
//     result.forEach((r) => {
//       console.log(`[${r.id}] ${r.text} → ${textTranslate(r.text)}`);
//     });
//   })
//   .catch((error) => {
//     console.log(`Failed to extract text:`, error);
//   });

// ============================================================================
// OPTION 2: Translate and save document (RECOMMENDED)
// ============================================================================
// This is the complete workflow - extract, translate, and save in one step

// Example 1: Text file (.txt)
// translateAndSaveDocument(
//   "./src/data/test.txt",
//   "./src/data/test-translated.txt",
//   textTranslate
// )
//   .then(() => console.log("✅ TXT translation complete!"))
//   .catch((error) => console.log(`Failed to translate TXT:`, error));

// Example 2: Markdown file (.md)
// translateAndSaveDocument(
//   "./src/data/test.md",
//   "./src/data/test-translated.md",
//   textTranslate
// )
//   .then(() => console.log("✅ Markdown translation complete!"))
//   .catch((error) => console.log(`Failed to translate MD:`, error));

// Example 3: HTML file (.html)
// translateAndSaveDocument(
//   "./src/data/test.html",
//   "./src/data/test-translated.html",
//   textTranslate
// )
//   .then(() => console.log("✅ HTML translation complete!"))
//   .catch((error) => console.log(`Failed to translate HTML:`, error));

// Example 4: CSV file (.csv)
// translateAndSaveDocument(
//   "./src/data/test.csv",
//   "./src/data/test-translated.csv",
//   textTranslate
// )
//   .then(() => console.log("✅ CSV translation complete!"))
//   .catch((error) => console.log(`Failed to translate CSV:`, error));

// Example 5: RTF file (.rtf)
// translateAndSaveDocument(
//   "./src/data/test.rtf",
//   "./src/data/test-translated.rtf",
//   textTranslate
// )
//   .then(() => console.log("✅ RTF translation complete!"))
//   .catch((error) => console.log(`Failed to translate RTF:`, error));

// Example 6: Word document (.docx) - Preserves formatting!
// translateAndSaveDocument(
//   "./src/data/test.docx",
//   "./src/data/test-translated.docx",
//   textTranslate
// )
//   .then(() => console.log("✅ DOCX translation complete!"))
//   .catch((error) => console.log(`Failed to translate DOCX:`, error));

// Example 7: PowerPoint (.pptx) - Preserves formatting!
translateAndSaveDocument(
  "./src/data/GoDis.pptx",
  "./src/data/GoDis-translated.pptx",
  textTranslate
)
  .then(() => console.log("✅ PPTX translation complete!"))
  .catch((error) => console.log(`Failed to translate PPTX:`, error));

// Example 8: PDF file (.pdf) - Requires ConvertAPI key
// translateAndSaveDocument(
//   "./src/data/test.pdf",
//   "./src/data/test-translated.pdf",
//   textTranslate
// )
//   .then(() => console.log("✅ PDF translation complete!"))
//   .catch((error) => console.log(`Failed to translate PDF:`, error));