"""种子包的结构、身份锚点与相互冲突校验。"""
from __future__ import annotations

import hashlib
import json
from typing import Annotated, Any, Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationError

from .entities import normalize_entity_name
from .minnano_av import PROFILE_COLUMNS
from .social_links import canonical_url

Text = Annotated[str, StringConstraints(min_length=1)]
KINDS = Literal["performer", "studio", "agency"]
FIELDS = Literal["alias", "ref", "link", "profile", "agency", "maker"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class Ref(StrictModel):
    provider: Text
    kind: Text
    id: Text


class Alias(StrictModel):
    alias: Text
    source: Text
    confidence: Annotated[float, Field(ge=0, le=1)] = 1.0


class Link(StrictModel):
    kind: Literal["official", "social"]
    label: str
    url: Text


class Identity(StrictModel):
    kind: KINDS
    name: Text
    refs: list[Ref] = Field(default_factory=list)


class Profile(StrictModel):
    fields: dict[str, Any]
    source: Text
    source_url: str
    fetched_at: str


class Pointer(StrictModel):
    name: Text
    source: Text


class Item(StrictModel):
    kind: KINDS
    name: Text
    aliases: list[Alias]
    refs: list[Ref]
    links: list[Link]
    profile: Profile | None = None
    agency: Pointer | None = None
    maker: Pointer | None = None
    identity: Identity | None = None


class Withdrawal(StrictModel):
    id: Text
    identity: Identity
    field: FIELDS
    value: Any
    reason: Text
    evidence: Text


class Pack(StrictModel):
    format: Literal[1, 2]
    version: Text
    source: Literal["auto:seed"]
    counts: dict[str, Annotated[int, Field(ge=0)]]
    entities: list[Item]
    revision: Annotated[int, Field(ge=1)] | None = None
    content_sha256: str | None = None
    withdrawals: list[Withdrawal] = Field(default_factory=list)


def canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(pack: dict) -> str:
    """摘要覆盖版本、修订号、事实与累计撤销，不包含摘要字段自身。"""
    return hashlib.sha256(canonical({k: v for k, v in pack.items() if k != "content_sha256"}).encode()).hexdigest()


def url_key(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Los enlaces de la semilla deben ser direcciones HTTP(S) sin credenciales")
    return canonical_url(value)


def ref_key(value: dict) -> tuple[str, str, str]:
    return value["provider"], value["kind"], value["id"]


def identity_keys(identity: dict) -> set[tuple]:
    return {("name", identity["kind"], normalize_entity_name(identity["name"])),
            *(("ref", *ref_key(ref)) for ref in identity.get("refs", []))}


def fact_key(field: str, value: Any) -> str:
    if field == "alias":
        return normalize_entity_name(value)
    if field == "link":
        return canonical({"kind": value["kind"], "url": url_key(value["url"])})
    if field == "profile":
        return canonical({"fields": value["fields"], "source_url": value["source_url"],
                          "fetched_at": value["fetched_at"]})
    if field in {"agency", "maker"}:
        return normalize_entity_name(value["name"])
    return canonical(value)


def _profile(value: dict) -> None:
    numeric = {"height_cm", "bust_cm", "waist_cm", "hip_cm", "debut_year", "active_until"}
    for key, item in value["fields"].items():
        if key == "tags":
            if not isinstance(item, list) or any(type(tag) is not str for tag in item):
                raise ValueError("Los tags de los datos de la semilla deben ser una lista de textos")
        elif key not in PROFILE_COLUMNS or (item is not None and type(item) is not (int if key in numeric else str)):
            raise ValueError(f"Columna de datos de la semilla no válida: {key}")
    if value["source_url"]:
        url_key(value["source_url"])


def _validate_withdrawal(value: dict) -> None:
    field, old = value["field"], value["value"]
    if field == "alias":
        if type(old) is not str or not normalize_entity_name(old):
            raise ValueError("Anular un alias necesita su escritura exacta")
        if normalize_entity_name(old) == normalize_entity_name(value["identity"]["name"]):
            raise ValueError("Un alias anulado no puede ser a la vez ancla de identidad")
    elif field == "ref":
        Ref.model_validate(old)
        if ref_key(old) in {ref_key(ref) for ref in value["identity"].get("refs", [])}:
            raise ValueError("Un número anulado no puede ser a la vez ancla de identidad")
    elif field == "link":
        if not isinstance(old, dict) or set(old) != {"kind", "url"} or old["kind"] not in {"official", "social"}:
            raise ValueError("Anular un enlace necesita su uso y su dirección exacta")
        if type(old["url"]) is not str:
            raise ValueError("La dirección del enlace anulado debe ser texto")
        url_key(old["url"])
    elif field == "profile":
        Profile.model_validate(old)
        _profile(old)
    else:
        Pointer.model_validate(old)
    kind = value["identity"]["kind"]
    if not normalize_entity_name(value["identity"]["name"]) or any(ref["provider"] == "stash" for ref in value["identity"].get("refs", [])):
        raise ValueError("La anulación necesita un ancla de identidad independiente válida")
    if field in {"profile", "agency"} and kind != "performer" or field == "maker" and kind != "studio":
        raise ValueError("El campo de la anulación no coincide con el tipo de entidad")


def _validate_header(pack: dict, *, verify_hash: bool) -> None:
    """校验原始对象与版本头，保证后续检查可按已声明格式读取字段。"""
    if type(pack) is not dict or type(pack.get("format")) is not int:
        raise ValueError("El paquete de semilla debe ser un objeto con un format entero")
    parsed = Pack.model_validate(pack)
    if pack["format"] == 1 and {"revision", "content_sha256", "withdrawals"} & pack.keys():
        raise ValueError("El formato 1 no acepta campos del formato 2")
    if pack["format"] == 2:
        if parsed.revision is None or type(parsed.content_sha256) is not str or "withdrawals" not in pack:
            raise ValueError("El formato 2 necesita revision, content_sha256 y withdrawals acumuladas")
        if verify_hash and pack["content_sha256"] != digest(pack):
            raise ValueError("El resumen del contenido de la semilla no coincide")


def _validate_counts(pack: dict) -> None:
    """对结构已通过校验的格式 2 包，核对各类声明计数。"""
    if pack["format"] != 2:
        return
    counts = {"entities": len(pack["entities"]), "aliases": 0, "refs": 0, "links": 0,
              "profiles": 0, "memberships": 0, "makers": 0}
    for item in pack["entities"]:
        for field in ("aliases", "refs", "links"):
            counts[field] += len(item[field])
        for field, counter in (("profile", "profiles"), ("agency", "memberships"), ("maker", "makers")):
            counts[counter] += bool(item.get(field))
    if counts != pack["counts"]:
        raise ValueError("El recuento de la semilla no coincide con el contenido del paquete")


def _validate_item(item: dict, *, index: int, format_number: int, names: dict, refs: dict) -> None:
    """校验单项身份和事实，并把名称、编号登记到共享占用表。"""
    kind, identity = item["kind"], item.get("identity")
    if format_number == 2 and identity is None:
        raise ValueError("En el formato 2 las entidades deben declarar un ancla de identidad independiente")
    if identity and (identity["kind"] != kind or normalize_entity_name(identity["name"]) != normalize_entity_name(item["name"])):
        raise ValueError("La entidad no coincide con el ancla de identidad")
    for name in [item["name"], *(alias["alias"] for alias in item["aliases"])]:
        key = kind, normalize_entity_name(name)
        if not key[1] or names.setdefault(key, index) != index:
            raise ValueError(f"Conflicto de nombres de identidad dentro de la semilla: {name}")
    for ref in [*item["refs"], *((identity or {}).get("refs", []))]:
        if ref["provider"] == "stash" or refs.setdefault(ref_key(ref), index) != index:
            raise ValueError("Conflicto de identidad por número de fuente dentro de la semilla, o se usa un número local")
    for link in item["links"]:
        url_key(link["url"])
    if item.get("profile"):
        _profile(item["profile"])
    if (item.get("profile") or item.get("agency")) and kind != "performer":
        raise ValueError("Los datos y la pertenencia a agencia solo se aplican a actrices")
    if item.get("maker") and kind != "studio":
        raise ValueError("La pertenencia a productora solo se aplica a estudios")


def _validate_items(pack: dict) -> None:
    """全包共享占用表，拒绝跨实体的名称或编号冲突。"""
    names, refs = {}, {}
    for index, item in enumerate(pack["entities"]):
        _validate_item(item, index=index, format_number=pack["format"], names=names, refs=refs)


def _item_identity(item: dict) -> dict:
    return item.get("identity") or {"kind": item["kind"], "name": item["name"], "refs": item["refs"]}


def _asserted_values(item: dict, field: str) -> list:
    """取得已通过结构校验的单项在指定字段上的正向断言。"""
    if field == "alias":
        return [item["name"], *(alias["alias"] for alias in item["aliases"])]
    if field in {"ref", "link"}:
        return item[{"ref": "refs", "link": "links"}[field]]
    return [item[field]] if item.get(field) else []


def _validate_withdrawal_conflicts(pack: dict) -> None:
    """校验撤销值、唯一 id 和身份锚点，拒绝与同包正向断言矛盾。"""
    identifiers = set()
    anchors = [identity_keys(_item_identity(item)) for item in pack["entities"]]
    for withdrawal in pack.get("withdrawals", []):
        _validate_withdrawal(withdrawal)
        if withdrawal["id"] in identifiers:
            raise ValueError("id de anulación repetido")
        identifiers.add(withdrawal["id"])
        keys = identity_keys(withdrawal["identity"])
        if sum(bool(keys & anchor) for anchor in anchors) > 1:
            raise ValueError("El ancla de identidad de la anulación apunta a varias entidades dentro del paquete")
        field = withdrawal["field"]
        old = fact_key(field, withdrawal["value"])
        for item, anchor in zip(pack["entities"], anchors):
            if not keys & anchor:
                continue
            if any(fact_key(field, value) == old for value in _asserted_values(item, field)):
                raise ValueError("El mismo paquete afirma y anula el mismo hecho")


def _validate_maker_graph(pack: dict) -> None:
    """按规范名遍历已校验的片商归属图，拒绝循环指向。"""
    studios = {normalize_entity_name(item["name"]): item for item in pack["entities"] if item["kind"] == "studio"}
    for start in studios:
        current, visited = start, set()
        while current in studios and studios[current].get("maker"):
            if current in visited:
                raise ValueError("La pertenencia a productoras de la semilla forma un ciclo")
            visited.add(current)
            current = normalize_entity_name(studios[current]["maker"]["name"])


def validate(pack: dict, *, verify_hash: bool = True) -> dict:
    """只校验，不修补、丢弃或自动批准输入。"""
    try:
        _validate_header(pack, verify_hash=verify_hash)
        _validate_counts(pack)
        _validate_items(pack)
        _validate_withdrawal_conflicts(pack)
        _validate_maker_graph(pack)
        canonical(pack)
    except (ValidationError, TypeError, KeyError, OverflowError) as exc:
        raise ValueError(f"La estructura del paquete de semilla no es válida: {exc}") from exc
    return pack
