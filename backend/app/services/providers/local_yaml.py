from pathlib import Path

import yaml


class LocalYAMLProvider:
    """Reads community lookup tables from on-disk YAML files.

    The files live in `community/` at the repo root. In Docker dev, this
    is bind-mounted into the API container; in prod, it is COPY'd into
    the image at build time. Tests can point this at a fixture directory.
    """

    def __init__(self, community_dir: Path) -> None:
        self.community_dir = community_dir

    async def load_table(self, table_name: str) -> list[dict]:
        path = self.community_dir / f"{table_name}.yml"
        if not path.exists():
            return []

        with path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        if not data or table_name not in data:
            return []

        return data[table_name] or []
