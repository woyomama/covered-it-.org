"""Generate 4 Instagram profile photo variants for Covered IT! using Gemini Nano Banana."""
import asyncio
import os
import base64
import uuid
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

API_KEY = os.environ["EMERGENT_LLM_KEY"]
OUT_DIR = "/app/frontend/public/ig-pfp"
os.makedirs(OUT_DIR, exist_ok=True)

PROMPTS = {
    "pink-chrome-lock": (
        "A square 1:1 Instagram profile photo, 1080x1080, ultra high resolution. "
        "Bold liquid chrome 'C' monogram with a tiny padlock motif in the negative space. "
        "Material: glossy melted chrome with strong pink iridescence — baby pink, hot pink, bubblegum, "
        "with mirror-like highlights and white sheen. Y2K 2003 chrome aesthetic. "
        "Background: smooth radial gradient from soft cream-pink to hot magenta with subtle satin ribbon swirls. "
        "Tiny floating white lily petals and 4-point sparkle stars scattered. "
        "No text, no watermarks, no logos other than the central 'C' monogram. "
        "Centered composition, generous padding so it works inside an Instagram circular crop. "
        "Premium, expensive, hypebeast-meets-coquette feel."
    ),
    "midnight-navy-emerald": (
        "A square 1:1 Instagram profile photo, 1080x1080, ultra high resolution. "
        "A bold chrome 'C' monogram with a small padlock element inside, rendered in liquid metal. "
        "Material: brushed midnight navy chrome with steel highlights, accented by emerald green liquid metal swirls (#15A678). "
        "Background: rich midnight navy (#0A1A2F to #0F2C45) with cracked stone texture and subtle emerald glow from below-left. "
        "No text, no watermarks. Centered composition with safe padding for circular Instagram crop. "
        "Mood: stealth, premium, dangerous, quiet luxury — for the boys who pull up never post."
    ),
    "split-soul-pink-navy": (
        "A square 1:1 Instagram profile photo, 1080x1080. "
        "A bold chrome 'C' monogram with a padlock motif inside, vertically split down the middle: "
        "the LEFT half is pink Y2K liquid chrome (hot pink, bubblegum, pearl white highlights, white lily petals); "
        "the RIGHT half is midnight navy liquid metal with emerald green accents and cracked stone texture. "
        "The split is a clean diagonal melt where the two materials drip into each other. "
        "Background: a soft gradient that mirrors the split — pink to navy diagonal. "
        "No text, no watermarks. Centered composition. Use a unisex, two-souls-in-one aesthetic. "
        "Hyper detailed, glossy, expensive, Instagram-worthy."
    ),
    "y2k-flip-phone-charm": (
        "A square 1:1 Instagram profile photo, 1080x1080. "
        "A miniature Y2K hot-pink chrome flip phone, half-open, viewed from a 3/4 angle, dangling a tiny crystal heart charm and a satin pink ribbon bow. "
        "The phone has mirror chrome casing in baby pink and hot pink with white sheen highlights. "
        "Background: soft cream-pink to hot magenta radial gradient with subtle satin texture, tiny floating sparkle stars and a single white lily. "
        "Centered composition with generous padding for Instagram's circular crop. "
        "No text, no watermarks. Coquette-meets-cyber, hyper-feminine, expensive feel."
    ),
}

async def gen_one(key: str, prompt: str) -> str:
    chat = LlmChat(
        api_key=API_KEY,
        session_id=f"pfp-{key}-{uuid.uuid4().hex[:6]}",
        system_message="You are a creative brand designer.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    msg = UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"⚠ {key}: no image returned — text was: {text[:120]}")
        return ""
    path = os.path.join(OUT_DIR, f"{key}.png")
    with open(path, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    return path


async def main():
    tasks = [gen_one(k, p) for k, p in PROMPTS.items()]
    paths = await asyncio.gather(*tasks)
    for p in paths:
        if p:
            print(f"✓ saved {p}")


if __name__ == "__main__":
    asyncio.run(main())
