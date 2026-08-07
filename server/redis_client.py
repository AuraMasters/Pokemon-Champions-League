import redis
import json
from typing import Optional, Any
from config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

def set_cache(key: str, value: Any, ttl_seconds: int = 300) -> None:
    serialized = json.dumps(value)
    redis_client.setex(key, ttl_seconds, serialized)

def get_cache(key: str) -> Optional[Any]:
    data = redis_client.get(key)
    if not data:
        return None
    return json.loads(data)

def delete_cache(key: str) -> None:
    redis_client.delete(key)