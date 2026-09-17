# jeroengroeneweg.nl

The public portfolio site for Jeroen Groeneweg.

It is a static site designed for GitHub Pages. Changes merged into `main` deploy through the included GitHub Actions workflow.

“My Work” contains the BridgeFund story organised by year, introduced by a short explanation of its practical lessons and purpose. Years one through four contain six, nine, seven and six chapters respectively, each with a recap. Year four is explicitly in progress and closes with a reflection across the whole story. Native HTML details and summary elements support mouse, touch and keyboard. Shared name attributes allow only one year and one chapter (including recaps) to be open at a time; opening a chapter keeps its parent year open. A toggle listener resets nested chapters when their year closes. All years and chapters are collapsed on initial load.

Opening a chapter positions its heading 16 pixels below the fixed navigation after the accordion layout settles. Scrolling is immediate, avoiding motion and a competing smooth-scroll animation as sibling content closes.

Run the accordion regression check with `node tests/story-accordion.cjs` in an environment with Playwright and Chromium installed. It covers desktop and mobile, keyboard interaction, exclusive year/chapter/recap opening, resetting chapters when a year closes, heading alignment in both switching directions and the white reading background.

Each chapter groups related sentences into readable paragraphs. Its closing notes include a concise lesson, a practical question and a linked reading or listening resource. The original fifteen resources in years one and two are retained; years three and four add thirteen more. Resources are suggestions for further exploration, not claims that the author used them at BridgeFund. Links point to authors, publishers or the original programme. The year one recap retains the four key ingredients. Keep text in index.html and accordion styling in styles.css. Verify both default open states and keyboard toggling when changing the chapter layout.

Year summaries use decorative outline icons for foundations, connected systems, customer outcomes and scaling. Lesson, question and resource headings also use decorative inline SVGs, hidden from assistive technology. Expanded reading panels use white (#ffffff), distinct from the beige page (#f6eee3) and pale teal summaries. A closing acknowledgement outside the accordions credits the team and identifies the narrative as the CPTO’s perspective. Preserve the lesson and question text when adjusting these visual elements. Check keyboard toggling, icon alignment and overflow at 320, 390, 760 and 1440 pixels.

Year three covers security ownership, customer understanding, shared data, customer journeys, outcome-based OKRs and KPIs, the My BridgeFund web application, and portfolio monitoring. Bank connections illustrate the goal-setting approach without disclosing a percentage. No legal compliance level is claimed. Validate at desktop, tablet and mobile widths, including keyboard expansion and horizontal overflow.

Year four covers growing customer-focused teams, adopting agentic engineering, shared AI context, engineering accountability, operational gaps and revisiting build versus buy. The 2025 profit of approximately €1m is distinguished from the 2026 target of approximately €20m, including in the results card. No unverified AI containment, privacy guarantee or completed reconciliation migration is claimed. Preserve concise lessons, first-person narrative and existing reading resources.
