import asyncio
import logging
import httpx
import urllib.parse
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

async def align_sequences(client: httpx.AsyncClient, sequences_fasta: str, mock_mode: bool = True) -> dict:
    """
    Submits sequences to EBI Clustal Omega and returns the alignment.
    """
    if mock_mode:
        # Generate mock alignment by inserting gaps or returning aligned mock sequences
        lines = sequences_fasta.strip().split("\n")
        aligned_fasta = []
        for line in lines:
            if line.startswith(">"):
                aligned_fasta.append(line)
            else:
                # insert mock gap
                aligned_fasta.append(line[:5] + "-" + line[5:])
        return {
            "status": "FINISHED",
            "alignment": "\n".join(aligned_fasta)
        }

    try:
        url = "https://www.ebi.ac.uk/Tools/services/rest/clustalo/run"
        email = "biomed_explorer@example.com"
        params = {
            "email": email,
            "title": "BiomedExplorerAlignment",
            "sequence": sequences_fasta
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
        data = urllib.parse.urlencode(params).encode("utf-8")
        
        res = await client.post(url, data=data, headers=headers, timeout=20.0)
        res.raise_for_status()
        job_id = res.text.strip()
        
        # Poll up to 6 times
        status_url = f"https://www.ebi.ac.uk/Tools/services/rest/clustalo/status/{job_id}"
        for _ in range(6):
            await asyncio.sleep(3)
            status_res = await client.get(status_url, headers={"Accept": "text/plain"}, timeout=10.0)
            status_res.raise_for_status()
            status = status_res.text.strip()
            if status == "FINISHED":
                result_url = f"https://www.ebi.ac.uk/Tools/services/rest/clustalo/result/{job_id}/fa"
                alignment_res = await client.get(result_url, timeout=30.0)
                alignment_res.raise_for_status()
                return {"status": "FINISHED", "alignment": alignment_res.text}
            elif status in ["ERROR", "FAILURE"]:
                raise ValueError("Clustal Omega job failed on EBI server")
                
        return {"status": "RUNNING", "job_id": job_id, "alignment": ""}
        
    except Exception as e:
        logger.error(f"Error running Clustal Omega alignment: {str(e)}")
        
    return {"status": "FAILED", "alignment": ""}
