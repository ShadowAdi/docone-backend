import { textTranslate } from "./utils/text-translate";
import { TextExtraction } from "./utils/textExtraction";

TextExtraction("./src/data/test.docx").then((result) => {
    console.log("result ", result)
    result.map((r) => {
        console.log(textTranslate(r.text))
    })
}).catch((error) => {
    console.log(`Failed to extract text from the file: `, error)
})