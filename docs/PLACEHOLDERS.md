# ShelfPath — Placeholder Inventory (`docs/PLACEHOLDERS.md`)

To uphold our strict honesty and zero-fabrication standard, **ShelfPath never invents team member names, institutional affiliations, contact emails, legal entity names, user statistics, testimonials, or partnerships**.

Every factual field that requires real project owner information before public launch is marked with an explicit `[FILL IN: ...]` token so none can ship unnoticed.

> **Legal Review Notice**: The **Privacy Policy** (`/privacy`, `/en/privacy`, `/vi/privacy`) and **Terms & Disclaimer** (`/terms`, `/en/terms`, `/vi/terms`) pages are technical transparency drafts. They **must be reviewed and approved by a qualified legal professional** in your operating jurisdiction before public or commercial launch.

---

## Complete List of `[FILL IN]` Placeholders

| ID | Placeholder Token | Page / Route | Source File(s) | What You Need to Fill In |
| :--- | :--- | :--- | :--- | :--- |
| **PH-01** | `[FILL IN: Project Lead / Team Member Names & Roles]` | `/about`, `/en/about`, `/vi/about` | `/src/data/publicPagesContent.ts` | Full name(s) and role(s) of the creator(s) or student team behind ShelfPath. |
| **PH-02** | `[FILL IN: University, Department, or Independent Lab Name]` | `/about`, `/en/about`, `/vi/about` | `/src/data/publicPagesContent.ts` | Academic institution, department, course, or independent research group where ShelfPath was developed. |
| **PH-03** | `[FILL IN: Project Origin Story & Founding Date]` | `/about`, `/en/about`, `/vi/about` | `/src/data/publicPagesContent.ts` | Brief background on when the project started and the specific learning challenge that inspired it. |
| **PH-04** | `[FILL IN: Source Repository URL]` | `/about`, `/en/about`, `/vi/about` | `/src/data/publicPagesContent.ts` | Public GitHub or GitLab repository URL if the source code is published. |
| **PH-05** | `[FILL IN: contact@yourdomain.edu]` | All public pages & Site Footer (`mailto:`) | `/src/data/publicPagesContent.ts`, `/src/components/SiteFooter.tsx`, `/app/layout.tsx` | Primary contact email address used in the `mailto:` link on the About page, FAQ page, No-JS banner, and Site Footer. |
| **PH-06** | `[FILL IN: Data Controller / Operator Full Legal Name]` | `/privacy`, `/terms` (`/en/...`, `/vi/...`) | `/src/data/publicPagesContent.ts` | Full legal name of the individual or organization operating the ShelfPath deployment. |
| **PH-07** | `[FILL IN: privacy@yourdomain.edu]` | `/privacy`, `/en/privacy`, `/vi/privacy` | `/src/data/publicPagesContent.ts` | Contact email address for privacy questions or data inquiries. |
| **PH-08** | `[FILL IN: Postal Address or Country of Operation]` | `/privacy`, `/en/privacy`, `/vi/privacy` | `/src/data/publicPagesContent.ts` | Physical or registered jurisdiction address required by applicable privacy laws. |
| **PH-09** | `[FILL IN: Governing Law Country / State & Competent Court]` | `/terms`, `/en/terms`, `/vi/terms` | `/src/data/publicPagesContent.ts` | Applicable governing law and court jurisdiction for the Terms of Use. |
| **PH-10** | `[FILL IN: legal@yourdomain.edu]` | `/terms`, `/en/terms`, `/vi/terms` | `/src/data/publicPagesContent.ts` | Contact email address for legal notices and terms inquiries. |
| **PH-11** | `[FILL IN: accessibility@yourdomain.edu]` | `/accessibility`, `/en/accessibility`, `/vi/accessibility` | `/src/data/publicPagesContent.ts` | Contact email address for reporting accessibility barriers or requesting accommodations. |
| **PH-12** | `mailto:security@example.com` (`REPLACE_BEFORE_PRODUCTION`) | `/.well-known/security.txt` | `/public/.well-known/security.txt`, `/app/.well-known/security.txt/route.ts` | Security vulnerability disclosure contact email and canonical deployment URL per RFC 9116. |

---

## Pre-Launch Verification Command

Before deploying to production, run:

```bash
grep -rn "\[FILL IN" src app public
```

Ensure every `[FILL IN: ...]` placeholder has been replaced with verified real-world details and that your legal counsel has reviewed `/privacy` and `/terms`.
