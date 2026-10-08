# E-sign provider replacement — Slice 2

The EsignProvider interface lives in src/lib/esign/provider.ts.
The contract service calls getEsignProvider().sign(request), so future
DocuSign or Dropbox Sign implementations do not need route/service changes
for synchronous verified signature evidence.

Built-in standard provider: typed full legal name and consent UI, authenticated
organization/user ID, server timestamp, SHA-256 document fingerprint, and
secret-peppered SHA-256 network address. The immutable ContractSignature
audit table enforces unique (contractId, party) and records per-party evidence.

To swap providers:
1. Implement EsignProvider and return your provider from getEsignProvider().
2. Verify vendor callback signatures and signer identity before issuing evidence.
3. For asynchronous vendor ceremonies, adapt provider orchestration to deliver
   verified evidence only after completion; never mark a signature complete early.
4. Keep raw PHI out of vendor metadata and verify contracts/security requirements.

Set ESIGN_IP_HASH_SECRET to a random 32+ character deployment secret.
Signing fails closed without it. The reverse proxy must overwrite
x-forwarded-for; do not rely on client-provided network-address headers.
Compliance note: standard click-to-sign is an audit-evidence mechanism,
not independent proof of legal enforceability. Review consent, authority,
delivery, retention, HIPAA/vendor agreements, and applicable signature law.