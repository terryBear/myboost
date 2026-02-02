"""
Signed tokens for shareable report links.
Payload: customer_id, expires (ISO datetime). Valid for max_age_seconds from creation.
"""

import json
from datetime import datetime, timezone
from django.conf import settings
from django.core.signing import Signer, BadSignature
from django.utils.encoding import force_str


def _default_expires_in_days():
    return 7


def create_share_token(customer_id: str, expires_in_days: int | None = None) -> str:
    """
    Create a signed token encoding customer_id and expiry.
    Returns a URL-safe string suitable for use in /s/<token>/.
    """
    if expires_in_days is None:
        expires_in_days = _default_expires_in_days()
    expires = datetime.now(timezone.utc).replace(microsecond=0)
    from datetime import timedelta

    expires = expires + timedelta(days=expires_in_days)
    payload = {
        "customer_id": str(customer_id),
        "expires": expires.isoformat(),
    }
    data = json.dumps(payload, sort_keys=True)
    signer = Signer()
    return signer.sign(data)


def verify_share_token(token: str) -> dict | None:
    """
    Verify and decode a share token. Returns payload dict with customer_id and expires,
    or None if invalid or expired.
    """
    if not token or not token.strip():
        return None
    try:
        signer = Signer()
        data = signer.unsign(token)
        payload = json.loads(data)
        customer_id = payload.get("customer_id")
        expires_str = payload.get("expires")
        if not customer_id or not expires_str:
            return None
        expires = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) >= expires:
            return None
        return {"customer_id": customer_id, "expires": expires_str}
    except (BadSignature, json.JSONDecodeError, ValueError, TypeError):
        return None


def get_share_customer_id_from_request(request) -> str | None:
    """
    If request has a valid share token (X-Share-Token or share_token query), return its customer_id.
    Otherwise return None. Use in report list views to scope data for share-link viewers.
    """
    token = (
        (request.META.get("HTTP_X_SHARE_TOKEN") or "")
        or (
            getattr(request, "query_params", None)
            and request.query_params.get("share_token")
            or ""
        )
        or ""
    ).strip()
    if not token:
        return None
    payload = verify_share_token(token)
    return payload.get("customer_id") if payload else None
