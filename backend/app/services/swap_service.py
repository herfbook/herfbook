from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guest import Swap
from app.models.inventory import Inventory


async def complete_swap(db: AsyncSession, swap: Swap, user_id: UUID) -> Swap:
    """Atomically process swap completion.

    Decrements outgoing inventory quantities, creates incoming inventory entries
    with provenance notes, and marks the swap completed.
    Rolls back via exception if any outgoing item has insufficient quantity.
    """
    for item in swap.items:
        if item.direction == "outgoing" and item.inventory_id is not None:
            inv_result = await db.execute(
                select(Inventory).where(Inventory.id == item.inventory_id)
            )
            inv = inv_result.scalar_one_or_none()
            if inv is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Inventory item {item.inventory_id} not found",
                )
            if inv.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient inventory for outgoing item: "
                        f"available {inv.quantity}, needed {item.quantity}"
                    ),
                )
            inv.quantity -= item.quantity

        elif item.direction == "incoming":
            swap_id_short = str(swap.id)[:8]
            new_inv = Inventory(
                user_id=user_id,
                cigar_id=item.cigar_id,
                quantity=item.quantity,
                humidor_id=None,
                is_gift=False,
                notes=f"Received from {swap.partner_name} via swap #{swap_id_short}",
                purchase_date=date.today(),
                purchase_price=None,
            )
            db.add(new_inv)

    swap.status = "completed"
    swap.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return swap
