import { translateAndSaveDocx, loadDocx, replaceTextInDocx, saveDocx } from "./docx-xml-handler";
import { textTranslate } from "./text-translate";
import { logger } from "../config/logger";

/**
 * Example 1: Simple translation workflow
 * Translate a DOCX file and save it to a new location
 */
export const simpleTranslateDocx = async (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  // Use the built-in workflow function
  await translateAndSaveDocx(inputPath, outputPath, textTranslate);
  logger.info("Translation completed successfully");
};

/**
 * Example 2: Manual control over translation process
 * Extract → Translate → Replace → Save
 */
export const manualTranslateDocx = async (
  inputPath: string,
  outputPath: string,
  customTranslateFn: (text: string) => Promise<string>
): Promise<void> => {
  // Step 1: Load DOCX and extract text nodes
  const docxContent = await loadDocx(inputPath);
  logger.info(`Loaded ${docxContent.textNodes.length} text nodes`);

  // Step 2: Translate each text node
  const translations = new Map<string, string>();
  for (const node of docxContent.textNodes) {
    const translatedText = await customTranslateFn(node.text);
    translations.set(node.id, translatedText);
    logger.info(`Translated: "${node.text}" → "${translatedText}"`);
  }

  // Step 3: Replace text in XML structure
  const updatedContent = replaceTextInDocx(docxContent, translations);

  // Step 4: Save the new DOCX
  await saveDocx(updatedContent, outputPath);
  logger.info(`Saved translated DOCX to ${outputPath}`);
};

/**
 * Example 3: Batch translation with progress tracking
 */
export const batchTranslateWithProgress = async (
  inputPath: string,
  outputPath: string,
  translateFn: (text: string) => Promise<string>,
  onProgress?: (current: number, total: number, text: string) => void
): Promise<void> => {
  const docxContent = await loadDocx(inputPath);
  const total = docxContent.textNodes.length;

  const translations = new Map<string, string>();
  
  for (let i = 0; i < docxContent.textNodes.length; i++) {
    const node = docxContent.textNodes[i];
    const translatedText = await translateFn(node.text);
    translations.set(node.id, translatedText);
    
    if (onProgress) {
      onProgress(i + 1, total, node.text);
    }
  }

  const updatedContent = replaceTextInDocx(docxContent, translations);
  await saveDocx(updatedContent, outputPath);
};

/**
 * Example 4: Selective translation (skip certain patterns)
 */
export const selectiveTranslateDocx = async (
  inputPath: string,
  outputPath: string,
  translateFn: (text: string) => Promise<string>,
  shouldTranslate: (text: string) => boolean = (text) => text.trim().length > 0
): Promise<void> => {
  const docxContent = await loadDocx(inputPath);
  const translations = new Map<string, string>();

  for (const node of docxContent.textNodes) {
    if (shouldTranslate(node.text)) {
      const translatedText = await translateFn(node.text);
      translations.set(node.id, translatedText);
    } else {
      // Keep original text
      translations.set(node.id, node.text);
    }
  }

  const updatedContent = replaceTextInDocx(docxContent, translations);
  await saveDocx(updatedContent, outputPath);
};

/**
 * Example 5: API integration for translation
 * This example shows how you might integrate with a real translation API
 */
export const translateDocxWithAPI = async (
  inputPath: string,
  outputPath: string,
  apiTranslate: (texts: string[]) => Promise<string[]>
): Promise<void> => {
  const docxContent = await loadDocx(inputPath);

  // Batch API call for efficiency
  const textsToTranslate = docxContent.textNodes.map((node) => node.text);
  const translatedTexts = await apiTranslate(textsToTranslate);

  // Build translation map
  const translations = new Map<string, string>();
  docxContent.textNodes.forEach((node, index) => {
    translations.set(node.id, translatedTexts[index]);
  });

  const updatedContent = replaceTextInDocx(docxContent, translations);
  await saveDocx(updatedContent, outputPath);
};

/**
 * Usage Examples:
 * 
 * // Example 1: Simple usage
 * await simpleTranslateDocx("input.docx", "output.docx");
 * 
 * // Example 2: Custom translation function
 * await manualTranslateDocx(
 *   "input.docx",
 *   "output.docx",
 *   async (text) => {
 *     // Your custom translation logic
 *     return await callTranslationAPI(text);
 *   }
 * );
 * 
 * // Example 3: With progress tracking
 * await batchTranslateWithProgress(
 *   "input.docx",
 *   "output.docx",
 *   translateFn,
 *   (current, total, text) => {
 *     console.log(`Progress: ${current}/${total} - Translating: ${text}`);
 *   }
 * );
 * 
 * // Example 4: Skip certain patterns (e.g., URLs, emails)
 * await selectiveTranslateDocx(
 *   "input.docx",
 *   "output.docx",
 *   translateFn,
 *   (text) => {
 *     // Skip URLs and emails
 *     const urlPattern = /^https?:\/\//;
 *     const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
 *     return !urlPattern.test(text) && !emailPattern.test(text);
 *   }
 * );
 * 
 * // Example 5: Batch API translation
 * await translateDocxWithAPI(
 *   "input.docx",
 *   "output.docx",
 *   async (texts) => {
 *     // Call translation API with batch of texts
 *     const response = await fetch("https://api.translation.com/translate", {
 *       method: "POST",
 *       body: JSON.stringify({ texts, targetLang: "hi" }),
 *     });
 *     return await response.json();
 *   }
 * );
 */
