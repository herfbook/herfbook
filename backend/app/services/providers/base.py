from typing import Protocol, runtime_checkable


@runtime_checkable
class CommunityDataProvider(Protocol):
    """Pluggable interface for the community data source.

    M1 implementation reads YAML files from disk. M2 will swap in a
    remote/GitHub provider against the hosted community API. Backend code
    receives a provider instance via dependency injection / config; it
    never imports concrete providers directly.
    """

    async def load_table(self, table_name: str) -> list[dict]:
        """Return the raw list of dicts for a given lookup table.

        Returns an empty list if the table source is unavailable
        (missing file, empty file). Implementations may raise on
        truly unexpected failures (e.g., malformed YAML).
        """
        ...
