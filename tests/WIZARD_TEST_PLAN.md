# Wizard Choice Combinations and Test Plan

## Template Structure (Key IDs for Testing)

### Title and Type
- `tmp-title`: "Fiduciary License Agreement 2.0" (FLA) or header text (CLA)
- `tmp-preamble`: Entire FSFE preamble section (FLA only, should be hidden/removed for CLA)
- `tmp-how-to`: "FLA" or "Contributor Agreement"
- `tmp-subtitle-based`: "based on the" text (shown for FLA, hidden for CLA)

### Individual vs Entity
- `tmp-contributor-type`: "Individual" or "Entity"
- `tmp-entity-definitions`: Entity-specific definitions section (shown for Entity, hidden for Individual in FLA)

### Exclusivity
- `tmp-contributor-exclusivity-1` and `tmp-contributor-exclusivity-2`: "Exclusive" or "Non-exclusive"

### Outbound License Options (Section 4)
- `tmp-outbound-section-all`: Parent section (shown/hidden based on agreement type)
- `tmp-outbound-option-1-fsfe`: FSFE general option paragraph (visible when selected)
- `tmp-outbound-option-2-fsfe`: Listed licenses for FSFE (visible when selected)
- `tmp-outbound-option-2-non-fsfe`: Listed licenses for non-FSFE (visible when selected)
- `tmp-outbound-option-3-fsfe`: License policy for FSFE (visible when selected)
- `tmp-outbound-option-4-non-fsfe`: Same as submission date (visible when selected)
- `tmp-licenses-fsfe` / `tmp-licenses-non-fsfe`: Actual license list content
- `tmp-license-policy-location`: License policy URL
- `tmp-outbound-media-license`: Media licenses paragraph
- `tmp-media-licenses`: Media license list

### Patent Options
- `tmp-patent-option`: "Traditional Patent License" or "PATENT PLEDGE OPTION" text
- `tmp-patent-option-traditional`: Traditional patent section (shown/hidden)
- `tmp-patent-option-pledge`: Patent pledge section (shown/hidden)
- `tmp-patent-more`: Patent list for pledge option
- `tmp-subtitle-patent`: Patent option subtitle

### Project Information
- `tmp-beneficiary-name`: Beneficiary/Entity name
- `tmp-project-name`: Project name
- `tmp-project-email`: Project email
- `tmp-project-jurisdiction`: Jurisdiction
- `tmp-submission-instructions`: Submission instructions URL

### Termination Clause
- `tmp-term-special`: Special termination clause (shown for agreements with Section 4, hidden for no-commitment)

## Complete Combination Matrix

### FLA (FSFE Compliance) - 6 combinations
1. Individual FLA + Outbound Option 1 (FSFE general)
2. Individual FLA + Outbound Option 2 (Listed licenses)
3. Individual FLA + Outbound Option 3 (License policy)
4. Entity FLA + Outbound Option 1
5. Entity FLA + Outbound Option 2
6. Entity FLA + Outbound Option 3

**FLA Characteristics:**
- Always exclusive
- Only Traditional Patent License
- No media licenses
- Has preamble section
- Has "tmp-subtitle-based" text
- Section 4 (outbound) always present

### CLA (Non-FSFE Compliance) - 32 combinations
Format: [Individual/Entity] + [Exclusive/Non-Exclusive] + [Outbound Option] + [Patent Option]

**Exclusivity (2 options):**
- Exclusive
- Non-Exclusive

**Outbound Options (4 options):**
- Option 2: Listed licenses
- Option 3: License policy
- Option 4: Same as on submission date
- Option 5: No commitment (Section 4 removed)

**Patent Options (2 options):**
- Traditional Patent License
- Patent Pledge

**Total CLA Individual combinations:** 2 × 4 × 2 = 16
**Total CLA Entity combinations:** 2 × 4 × 2 = 16

**CLA Characteristics:**
- No preamble section
- No "tmp-subtitle-based" text
- Media licenses option available
- Section 4 present (except for no-commitment option)
- Entity definitions shown for Entity version

## Test Strategy

### 1. Structural Tests (Section Presence/Absence)
Test that specific sections are present or absent based on choices:
- Preamble section present in FLA, absent in CLA
- Patent pledge section present only when selected
- Traditional patent section present only when selected
- Entity definitions present for Entity, absent for Individual (FLA)
- Section 4 present except for no-commitment option
- Special termination clause present except for no-commitment

### 2. Content Replacement Tests
Test that template placeholders are properly replaced:
- Title contains correct agreement type
- Beneficiary name replaced
- Project name replaced
- Jurisdiction replaced
- License lists replaced
- Patent option text replaced

### 3. Outbound License Option Tests
For each outbound option, verify:
- Correct paragraph visible
- Other paragraphs hidden
- License list populated (if applicable)
- License policy URL present (if applicable)

### 4. Patent Option Tests
- Traditional: Traditional section visible, pledge section hidden
- Pledge: Pledge section visible, traditional section hidden
- Patent subtitle shows correct text

### 5. Exclusivity Tests
- "Exclusive" or "Non-exclusive" appears in correct locations
- Both instances (tmp-contributor-exclusivity-1 and -2) match

### 6. Media License Tests (CLA only)
- Media license paragraph present
- Media license list populated

## Validation Methods

Instead of checking for simple string inclusion, tests should:

1. **Check element existence:** `$('#tmp-preamble').isExisting()`
2. **Check element visibility:** `$('#tmp-preamble').isDisplayed()`
3. **Check element content:** `$('#tmp-title').getText()` then verify exact text
4. **Check computed styles:** Verify `display: none` vs `display: block`
5. **Use CSS selectors:** Check if section has class `.nuke` (marked for removal)
6. **Parse HTML with cheerio:** Extract and verify specific elements
7. **Check element count:** Verify only one option paragraph is visible
8. **Validate structure:** Check parent-child relationships

## Priority Test Categories

### High Priority (Core functionality):
1. FLA vs CLA distinction (preamble, title, structure)
2. Outbound option selection and visibility
3. Patent option selection and visibility
4. Individual vs Entity differences

### Medium Priority (Data accuracy):
5. Custom field replacement (names, emails, jurisdiction)
6. License list population
7. Exclusivity reflection

### Lower Priority (Edge cases):
8. All 38 combinations (can be parameterized)
9. Media license options
10. Special termination clause presence
