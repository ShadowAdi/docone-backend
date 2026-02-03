import { TextExtraction } from "./utils/textExtraction";

TextExtraction("./src/data/test2.pdf").then((result) => {
    console.log("result ", result)
}).catch((error) => {
    console.log(`Failed to extract text from the file: `, error)
})