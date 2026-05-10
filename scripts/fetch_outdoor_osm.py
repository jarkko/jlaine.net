#!/usr/bin/env python3
"""
Fetch beach volleyball outdoor court data from OpenStreetMap Overpass API
for Nordic/Baltic countries and output rows matching the CSV schema used
by nordic_outdoor_beach_volleyball_courts.csv.

Usage:
  python3 scripts/fetch_outdoor_osm.py [COUNTRY_CODE ...]
  # e.g. python3 scripts/fetch_outdoor_osm.py SE NO DK EE LV LT IS

Output goes to stdout so you can redirect/append to a file.
Courts without names in OSM get a generated fallback name.
Courts count defaults to 2 when the OSM tags omit a count.
"""

import json
import sys
import time
import urllib.request
import urllib.parse

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

COUNTRIES = {
    "SE": ("SWEDEN",    "SE"),
    "NO": ("NORWAY",    "NO"),
    "DK": ("DENMARK",   "DK"),
    "EE": ("ESTONIA",   "EE"),
    "LV": ("LATVIA",    "LV"),
    "LT": ("LITHUANIA", "LT"),
    "IS": ("ICELAND",   "IS"),
}


AREA_ID_QUERY = """\
[out:json][timeout:30];
relation["ISO3166-1"="{iso}"]["boundary"="administrative"]["admin_level"="2"];
out ids;
"""


def get_area_id(iso2: str) -> int:
    q = AREA_ID_QUERY.format(iso=iso2)
    data = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("User-Agent", "jlaine.net beach-volleyball data collector (+https://jlaine.net)")
    with urllib.request.urlopen(req, timeout=40) as resp:
        result = json.load(resp)
    ids = [el["id"] for el in result.get("elements", [])]
    if not ids:
        raise RuntimeError(f"No admin relation found for ISO3166-1={iso2}")
    return 3600000000 + ids[0]


def fetch_courts(area_id: int) -> list:
    query = f"[out:json][timeout:120];\n(\n  node[\"leisure\"=\"pitch\"][\"sport\"=\"beach_volleyball\"][\"access\"!=\"private\"](area:{area_id});\n  way[\"leisure\"=\"pitch\"][\"sport\"=\"beach_volleyball\"][\"access\"!=\"private\"](area:{area_id});\n  node[\"sport\"=\"volleyball\"][\"surface\"=\"sand\"][\"access\"!=\"private\"](area:{area_id});\n  way[\"sport\"=\"volleyball\"][\"surface\"=\"sand\"][\"access\"!=\"private\"](area:{area_id});\n);\nout center tags;\n"
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("User-Agent", "jlaine.net beach-volleyball data collector (+https://jlaine.net)")
    with urllib.request.urlopen(req, timeout=140) as resp:
        result = json.load(resp)
    return result.get("elements", [])


def osm_to_row(el: dict, country_name: str, iso2: str) -> dict | None:
    tags = el.get("tags", {})
    if el["type"] == "way":
        center = el.get("center", {})
        lat = center.get("lat")
        lon = center.get("lon")
    else:
        lat = el.get("lat")
        lon = el.get("lon")
    if lat is None or lon is None:
        return None

    # Skip obviously wrong points
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None

    osm_id = f"osm-{el['type'][0]}{el['id']}"

    name_raw = tags.get("name") or tags.get("name:en") or tags.get("ref") or ""
    # For unnamed courts, build a fallback from place context or operator.
    if not name_raw:
        place = (
            tags.get("addr:city")
            or tags.get("addr:suburb")
            or tags.get("addr:municipality")
            or tags.get("addr:place")
        )
        op = tags.get("operator")
        if place and op:
            name_raw = f"{op} beach volleyball"
        elif place:
            name_raw = f"Beach volleyball, {place}"
        elif op:
            name_raw = f"{op} beach volleyball"
        else:
            name_raw = f"Beach volleyball court (OSM {el['type'][0]}{el['id']})"
    name = name_raw

    # Address
    street = tags.get("addr:street", "")
    housenumber = tags.get("addr:housenumber", "")
    postcode = tags.get("addr:postcode", "")
    city = tags.get("addr:city") or tags.get("addr:suburb") or tags.get("addr:municipality") or ""
    if street and housenumber:
        address = f"{street} {housenumber}"
        if postcode:
            address += f", {postcode}"
    elif street:
        address = street
    else:
        address = ""

    town = city

    # Courts count
    courts_tag = tags.get("beach_volleyball:courts") or tags.get("volleyball:courts") or tags.get("courts") or ""
    try:
        courts = int(courts_tag)
    except (ValueError, TypeError):
        courts = 2  # default assumption for a volleyball pitch

    # Surface
    surface = tags.get("surface", "")
    if surface in ("sand", "artificial_sand"):
        surface = "sand"
    elif not surface:
        surface = "sand"  # implied by beach_volleyball tag

    # Lighting
    lit = tags.get("lit", "")
    lighting = "yes" if lit in ("yes", "24/7", "automatic") else ("no" if lit == "no" else "")

    # Access
    access_tag = tags.get("access", "")
    free_use = "yes" if access_tag in ("yes", "public", "") else "no"
    access = access_tag or "public"

    # Operator/owner
    operator = tags.get("operator") or tags.get("owner") or ""

    # URL
    url = tags.get("website") or tags.get("url") or tags.get("contact:website") or ""

    return {
        "country": country_name,
        "facility_name": name,
        "town": town,
        "address": address,
        "latitude": f"{lat:.6f}",
        "longitude": f"{lon:.6f}",
        "coord_precision": "address" if (street and housenumber) else "approximate",
        "outdoor_courts": str(courts),
        "surface": surface,
        "lighting": lighting,
        "free_use": free_use,
        "access": access,
        "owner": operator,
        "lipas_id": "",
        "source_url": url,
        "data_cutoff": "2026-05-10",
        "fact_check_notes": f"OSM {el['type']} id={el['id']}",
    }


CSV_COLUMNS = [
    "country", "facility_name", "town", "address", "latitude", "longitude",
    "coord_precision", "outdoor_courts", "surface", "lighting", "free_use",
    "access", "owner", "lipas_id", "source_url", "data_cutoff", "fact_check_notes",
]


def csv_escape(value: str) -> str:
    v = str(value)
    if any(c in v for c in (',', '"', '\n', '\r')):
        v = '"' + v.replace('"', '""') + '"'
    return v


def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(COUNTRIES.keys())
    invalid = [t for t in targets if t.upper() not in COUNTRIES]
    if invalid:
        print(f"Unknown country code(s): {', '.join(invalid)}", file=sys.stderr)
        sys.exit(1)

    print(",".join(CSV_COLUMNS))

    for code in targets:
        iso2 = code.upper()
        country_name, _ = COUNTRIES[iso2]
        print(f"[{iso2}] Resolving area ID…", file=sys.stderr)
        try:
            area_id = get_area_id(iso2)
        except Exception as exc:
            print(f"[{iso2}] ERROR resolving area: {exc}", file=sys.stderr)
            continue

        print(f"[{iso2}] area_id={area_id}, fetching courts…", file=sys.stderr)
        time.sleep(2)  # polite pause between requests

        try:
            elements = fetch_courts(area_id)
        except Exception as exc:
            print(f"[{iso2}] ERROR fetching courts: {exc}", file=sys.stderr)
            continue

        print(f"[{iso2}] got {len(elements)} elements", file=sys.stderr)

        seen_ids = set()
        count = 0
        for el in elements:
            dedup_key = f"{el['type']}-{el['id']}"
            if dedup_key in seen_ids:
                continue
            seen_ids.add(dedup_key)
            row = osm_to_row(el, country_name, iso2)
            if row is None:
                continue
            print(",".join(csv_escape(row[col]) for col in CSV_COLUMNS))
            count += 1

        print(f"[{iso2}] wrote {count} rows", file=sys.stderr)
        time.sleep(3)  # polite pause between countries


if __name__ == "__main__":
    main()
