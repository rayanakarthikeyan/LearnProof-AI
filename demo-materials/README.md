# Original raw multimodal demo material

These MIT-licensed fixtures were authored for LearnProof. The PDF, image-based PPTX and 45-second narrated MP4 contain the same linked-list lesson in different forms. Narration is synthetic English speech generated using the installed Windows system voice. No real student's voice or data is used.

Upload all three through the library with Gemini configured. Do not feed extracted text, the gold reference file, or a transcript to ingestion. Some values appear only inside figures, making text-only extraction insufficient. The slide deck deliberately stores its teaching content as images.

Generate independently with `python -m learnproof.materials --output tmp/demo-material`. On Windows, produce narration with `scripts/narrate-demo.ps1` using the generated `narration.txt`, then rerun with `--audio` pointing to the WAV. On other hosts the generator produces a clearly documented silent, captioned video unless an audio file is supplied.

Expected figure facts: before insertion, 7 → 11 → 19 → null; after insertion, 7 → 11 → 27 → 19 → null. Searching for an insertion position is O(n) worst case; two rewiring updates at a known position are O(1).

This is a source fixture, **not** the required 3–10 minute YouTube demonstration of the working application. The generator, expected references and source manifest are separate from the ingestion pipeline.
