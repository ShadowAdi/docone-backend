import { textTranslate } from "./utils/text-translate";
import { TextExtraction } from "./utils/textExtraction";
import { translateAndSaveDocx } from "./utils/docx-xml-handler";

// Option 1: Extract text only (old approach - loses formatting)
// TextExtraction("./src/data/test.docx").then((result) => {
//     console.log("Extracted text nodes:", result.length);
//     result.forEach((r) => {
//         console.log(`[${r.id}] ${r.text} → ${textTranslate(r.text)}`);
//     });
// }).catch((error) => {
//     console.log(`Failed to extract text from the file:`, error);
// });

// Option 2: Translate and save DOCX (new approach - preserves formatting)
translateAndSaveDocx(
    "./src/data/test.docx",
    "./src/data/test-translated.docx",
    textTranslate
).then(() => {
    console.log("✅ Translation complete! Check ./src/data/test-translated.docx");
}).catch((error) => {
    console.log(`Failed to translate DOCX:`, error);
});