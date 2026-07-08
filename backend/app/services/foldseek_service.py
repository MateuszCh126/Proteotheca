import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

async def run_foldseek_search(client: httpx.AsyncClient, file_content: bytes, filename: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity structure matches matching typical Foldseek output
        return {
            "status": "COMPLETE",
            "matches": [
                {
                    "target": "pdb100/1UWH_A",
                    "q_cov": "98.5%",
                    "prob": 1.000,
                    "evalue": 1.2e-25,
                    "seq_id": 0.95,
                    "aln_len": 280
                },
                {
                    "target": "afdb50/AF-P15056-F1",
                    "q_cov": "95.2%",
                    "prob": 0.999,
                    "evalue": 4.5e-23,
                    "seq_id": 0.88,
                    "aln_len": 275
                }
            ]
        }

    try:
        # Submit the coordinate file to search.foldseek.com
        # 1. Submit ticket
        url = "https://search.foldseek.com/api/ticket"
        files = {"q": (filename, file_content, "application/octet-stream")}
        data = {"mode": "3diaa", "database[]": ["pdb100", "afdb50"]}
        
        # httpx post with multipart form
        res = await client.post(url, data=data, files=files, timeout=30.0)
        res.raise_for_status()
        ticket_id = res.json().get("id")
        
        if not ticket_id:
            raise ValueError("No ticket ID returned by Foldseek")
            
        # 2. Poll for completion (up to 6 times, waiting 5 seconds)
        for _ in range(6):
            await asyncio.sleep(5)
            status_res = await client.get(f"{url}/{ticket_id}", timeout=10.0)
            status_res.raise_for_status()
            status = status_res.json().get("status")
            if status == "COMPLETE":
                # Fetch results
                res_url = f"https://search.foldseek.com/api/result/{ticket_id}/0"
                res_data = await client.get(res_url, timeout=30.0)
                res_data.raise_for_status()
                return {"status": "COMPLETE", "matches": res_data.json().get("alignments", [])[:5]}
            elif status == "ERROR":
                raise ValueError("Foldseek job failed on server")
                
        return {"status": "RUNNING", "ticket_id": ticket_id, "matches": []}
        
    except Exception as e:
        logger.error(f"Error in Foldseek search: {str(e)}")
        
    return {"status": "FAILED", "matches": []}
