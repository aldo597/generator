import asyncio
import httpx
from rdflib import Graph

BASE_URL = "https://data.europarl.europa.eu/api/v2"
MEETING_ID = "MTG-PL-2025-11-26"


async def fetch_rdf(meeting_id: str):
    url = f"{BASE_URL}/meetings/{meeting_id}"

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)

        print("STATUS:", r.status_code)
        print("CONTENT-TYPE:", r.headers.get("content-type"))

        r.raise_for_status()

        return r.text


def parse_rdf(xml_data: str):
    g = Graph()
    g.parse(data=xml_data, format="xml")
    return g


def extract_sittings(graph: Graph):
    """
    Extrahiert alle Sittings / Event-Items aus dem RDF Graphen.
    """

    sittings = []

    for s, p, o in graph:

        p_str = str(p)
        o_str = str(o)

        # nur "consists_of" Beziehungen
        if "consists_of" not in p_str:
            continue

        # typische Event-Typen im Europarl RDF
        if any(x in o_str for x in ["PVCRE", "VOT", "ITM"]):

            sittings.append({
                "id": o_str.split("/")[-1],
                "uri": o_str,
                "parent": str(s)
            })

    return sittings


def extract_people(graph: Graph):
    """
    optional: Teilnehmer extrahieren
    """

    people = set()

    for s, p, o in graph:
        if "had_participant_person" in str(p):
            people.add(str(o))

    return list(people)


async def get_meeting_data(meeting_id: str):

    xml = await fetch_rdf(meeting_id)
    graph = parse_rdf(xml)

    sittings = extract_sittings(graph)
    people = extract_people(graph)

    return {
        "sittings": sittings,
        "people_count": len(people),
        "people_sample": people[:10],
        "triples_total": len(graph)
    }




async def main():
    data = await get_meeting_data(MEETING_ID)

    print("\n📊 RESULT:")
    print("Total triples:", data["triples_total"])
    print("Sittings found:", len(data["sittings"]))
    print("People sample:", data["people_sample"])

    print("\n🧾 SITTINGS:")
    for s in data["sittings"]:
        print("-", s["id"])


if __name__ == "__main__":
    asyncio.run(main())

