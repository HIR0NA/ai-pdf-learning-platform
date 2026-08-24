# Document Privacy and Retention Policy

Last updated: 2026-08-23

- Uploaded PDFs and extracted text are private to the owning account and are stored outside the public web directory using generated UUID filenames.
- The application sends document text to the AI provider selected by the user only when chat or a learning tool is requested. Provider API keys remain on the server.
- Do not upload secrets, regulated personal data, or documents you do not have permission to process.
- Deleting a document removes its database record, chat history, generated learning tools, PDF, extracted text, and legacy index file.
- Uploaded files are excluded from Git. Backups and infrastructure snapshots must use an independently documented expiry policy.
- Operational logs may contain account identifiers, endpoint paths, result codes, and trusted network identifiers. Passwords, session tokens, provider API keys, and document contents must never be logged.
- Recommended default retention: keep documents until the user deletes them; remove inactive-account documents after 90 days following prior notice.
- For a privacy request, users should provide their account email and document title to the system administrator. Identity must be verified before export or deletion.

