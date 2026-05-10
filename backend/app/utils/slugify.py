import re
import unicodedata


def slugify(text: str) -> str:
    """Generate a stable URL-safe slug for community_key matching.

    "Connecticut Shade" -> "connecticut-shade"
    "Padrón" -> "padron"
    "Romeo y Julieta (Cuba)" -> "romeo-y-julieta-cuba"
    """
    normalized = unicodedata.normalize("NFKD", text)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    lower = ascii_only.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", lower)
    return slug.strip("-")
