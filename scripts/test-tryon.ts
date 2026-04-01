import { generateTryOnImage } from '../src/lib/aiImageService';

async function main() {
    console.log("Starting Imagen 3 try-on generation test...");
    const result = await generateTryOnImage(
        { name: "파랑원피스", fabric: "면", gender: "female", category: "드레스/원피스" },
        "https://res.cloudinary.com/dpaqhv0ay/image/upload/v1775023322/products/giyimbkilzj5rmisnseh.webp"
    );
    console.log("Result success:", result.success);
    if (!result.success) {
        console.error("Error Details:", result.error);
    } else {
        console.log("Successfully generated image of size:", Math.round(result.imageBuffer!.length / 1024), "KB");
    }
}

main().catch(console.error);
