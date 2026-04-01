import { ai } from '../src/lib/genaiClient';
import { Modality, HarmCategory, HarmBlockThreshold } from '@google/genai';

async function main() {
    try {
        console.log("Testing without safety settings first...");
        await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: ["A simple red apple"],
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });
        console.log("Success without safety settings.");
        
        console.log("Testing WITH safety settings...");
        await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: ["A simple red apple"],
            config: {
                responseModalities: [Modality.IMAGE],
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                ]
            }
        });
        console.log("Success WITH safety settings.");
    } catch (e: any) {
        console.error("Test Error:");
        console.error("Message:", e.message);
        console.error("Status:", e.status);
    }
}
main();
