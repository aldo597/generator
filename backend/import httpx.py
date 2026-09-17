import httpx

url = "https://data.europarl.europa.eu/distribution/doc/PV-10-2026-06-16-RCV_en.xml"

async with httpx.AsyncClient(timeout=60) as client:
    response = await client.get(url)
    response.raise_for_status()

xml = response.text

print("992831 gefunden:", "992831" in xml)

pos = xml.find("992831")

if pos != -1:
    print(xml[pos - 3000:pos + 5000])