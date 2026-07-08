import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

async def run_blast_search(client: httpx.AsyncClient, sequence: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity BLAST hits
        return {
            "status": "READY",
            "hits": [
                {
                    "accession": "NP_004324.2",
                    "title": "serine/threonine-protein kinase B-raf [Homo sapiens]",
                    "identity": "100%",
                    "evalue": "0.0",
                    "score": 1420
                },
                {
                    "accession": "XP_016868491.1",
                    "title": "serine/threonine-protein kinase B-raf [Pan troglodytes]",
                    "identity": "99.1%",
                    "evalue": "0.0",
                    "score": 1405
                }
            ]
        }

    try:
        # Submit to NCBI BLAST
        put_url = "https://blast.ncbi.nlm.nih.gov/Blast.cgi"
        params = {
            "CMD": "Put",
            "PROGRAM": "blastp",
            "DATABASE": "nr",
            "QUERY": sequence,
            "FORMAT_TYPE": "JSON"
        }
        res = await client.get(put_url, params=params, timeout=15.0)
        res.raise_for_status()
        text = res.text
        # Parse RID (Request ID) from the HTML/text response
        import re
        rid_match = re.search(r'RID = (\w+)', text)
        if not rid_match:
            raise ValueError("Could not extract RID from BLAST response")
        rid = rid_match.group(1)
        
        # Poll up to 5 times (waiting 6 seconds)
        get_params = {
            "CMD": "Get",
            "RID": rid,
            "FORMAT_TYPE": "JSON"
        }
        for _ in range(5):
            await asyncio.sleep(6)
            poll_res = await client.get(put_url, params=get_params, timeout=15.0)
            poll_res.raise_for_status()
            poll_text = poll_res.text
            if "status = READY" in poll_text or "READY" in poll_text:
                # Typically returns BLAST results JSON if fully finished
                try:
                    data = poll_res.json()
                    return {"status": "READY", "hits": data.get("BlastOutput2", [])[:5]}
                except Exception:
                    pass
        return {"status": "RUNNING", "rid": rid, "hits": []}
    except Exception as e:
        logger.error(f"Error running BLAST search: {str(e)}")

    return {"status": "FAILED", "hits": []}
