import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";

const STORAGE_KEY = "pims_knowledge";

function loadDocs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveDocs(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function uid() {
  return crypto.randomUUID();
}

const CATEGORIES = ["Dosage", "Protocol", "General", "Storage", "Safety"];

const TEMPLATE_SECTIONS = [
  { key: "overview", label: "Overview", placeholder: "What is this peptide? How does it work? Key facts…" },
  { key: "dosing", label: "Dosing Protocol", placeholder: "Dose ranges, frequency, timing, injection site…" },
  { key: "reconstitution", label: "Reconstitution", placeholder: "BAC water amount, concentration, storage after reconstitution…" },
  { key: "timeline", label: "Timeline", placeholder: "What to expect at week 1, 4, 8, 12, etc…" },
  { key: "sideEffects", label: "Side Effects", placeholder: "List side effects with frequency, timing, and mitigation tips…" },
  { key: "cycling", label: "Cycling", placeholder: "On/off cycles, protocol length, receptor sensitivity…" },
  { key: "stacking", label: "Stacking", placeholder: "What pairs well, what to avoid, interactions…" },
];

const SEED_CJC_SECTIONS = [
  {
    heading: "Overview",
    body: `CJC-1295 (no DAC) is a GHRH analog that amplifies GH release pulses. Ipamorelin is a selective GH secretagogue that triggers a clean GH pulse without spiking cortisol or prolactin. Together they amplify the body's natural pulsatile GH release.

Half-life: ~30 min (both peptides)  |  GH pulse amplification: 2-4×  |  Minimum protocol: 90 days  |  Administration: Subcutaneous (abdomen)`
  },
  {
    heading: "Dosing Protocol",
    body: `┌─────────────────────┬─────────────────┬──────────────────┐
│                     │ Month 1         │ Month 2+         │
├─────────────────────┼─────────────────┼──────────────────┤
│ Dose per peptide    │ 100 mcg         │ 200 mcg          │
├─────────────────────┼─────────────────┼──────────────────┤
│ Syringe draw        │ 10 units (0.1mL)│ 20 units (0.2mL) │
├─────────────────────┼─────────────────┼──────────────────┤
│ Frequency           │ 5 nights / week │ 5 nights / week  │
├─────────────────────┼─────────────────┼──────────────────┤
│ Timing              │ ~30 min before bed                │
├─────────────────────┼─────────────────┼──────────────────┤
│ Injection site      │ Subcutaneous (abdomen)            │
└─────────────────────┴─────────────────┴──────────────────┘

Both peptides mixed in same syringe. One injection nightly.`
  },
  {
    heading: "Reconstitution",
    body: `- Use bacteriostatic water (BAC water)
- Inject BAC water slowly down vial wall, not directly onto powder
- Swirl gently — do not shake
- Let sit 5-10 min until fully dissolved
- Store reconstituted in fridge (2-8°C)
- Use within 30 days once reconstituted

Concentration: 2 mg/mL (1 mL BAC per 2 mg vial per peptide)`
  },
  {
    heading: "Timeline",
    body: `Week 1 — Improved sleep quality (most commonly reported early effect)
Week 4 — Increased energy, better workout recovery
Week 8 — Skin elasticity improvements, early body composition shifts
Week 12 — Measurable body composition change (reduced visceral fat, improved lean mass)
Month 6 — Full protocol benefits`
  },
  {
    heading: "Side Effects",
    body: `Water retention / facial puffiness — Common (15-25%), weeks 1-4
→ Self-resolving. Reduce sodium. Notify provider if persistent beyond week 4.

Increased hunger (Ipamorelin ghrelin effect) — Common (20-35%), ongoing
→ Expected mechanism effect. Meal-plan accordingly. Not a sign to discontinue.

Flushing / warmth post-injection — Uncommon (5-10%), 30-60 min post
→ Brief, self-resolving. Inject into abdomen (not thigh) to reduce flush.

Tingling in hands/wrists — Uncommon (5-10%), weeks 2-6
→ Carpal tunnel-like effect from GH elevation. Reduce dose if persistent.

Fatigue / initial lethargy — Uncommon (<10%), first 1-2 weeks
→ Adaptation phase. Typically resolves within 2 weeks.`
  },
  {
    heading: "Cycling",
    body: `Common practice: 90 days on protocol, then evaluate with physician. Annual cycling (3 months on, 1 month off) is a common physician preference. No strong evidence for mandatory cycling with no-DAC formulation.`
  },
  {
    heading: "Stacking",
    body: `Pairs well with: BPC-157, TB-500, MOTS-c, NAD+ therapy
Use caution: MK-677 (insulin resistance risk), GHRP-6 (more sides), exogenous HGH`
  }
];

const SEED_BPC157_SECTIONS = [
  { heading: "Overview", body: `BPC-157 (Body Protection Compound-157) is a synthetic pentadecapeptide (15 amino acids) derived from a protective protein found in human gastric juice. It is unusually stable in gastric acid, allowing both oral and injectable administration. It operates upstream in the tissue repair cascade by upregulating VEGF, EGF, and FGF — signalling cells to activate their own repair pathways.

Route: Injectable (SubQ) or Oral  |  Half-life: ~4 hours (injectable)  |  Mechanism: Angiogenesis promotion, growth factor upregulation  |  Category: Tissue repair peptide` },
  { heading: "Dosing Protocol", body: `┌───────────────────────────┬──────────────────────┬──────────────────────┐
│                           │ Injectable (SubQ)     │ Oral                 │
├───────────────────────────┼──────────────────────┼──────────────────────┤
│ Standard dose             │ 250-500 mcg daily    │ 500 mcg - 1 mg ×2/day│
├───────────────────────────┼──────────────────────┼──────────────────────┤
│ Frequency                 │ 1× daily, 5 days/wk  │ 2× daily             │
├───────────────────────────┼──────────────────────┼──────────────────────┤
│ Injection site            │ Abdomen or near injury│ N/A                  │
├───────────────────────────┼──────────────────────┼──────────────────────┤
│ Protocol length           │ 4-12 weeks           │ 4-12 weeks           │
├───────────────────────────┼──────────────────────┼──────────────────────┤
│ Syringe draw (standard)   │ 10-20 units (0.1-0.2mL) │ N/A               │
└───────────────────────────┴──────────────────────┴──────────────────────┘

Injection: Subcutaneous into abdominal fat or near the injury site. Rotate sites. Use 29-31G, 0.5 inch insulin syringe.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- Inject BAC water slowly down vial wall — do not aim directly at powder
- Swirl gently — do not shake
- Let sit 5-10 min until fully dissolved
- Store reconstituted in fridge (2-8°C)
- Use within 30 days once reconstituted

Common concentration: 1 mg/mL (2 mL BAC per 5 mg vial)` },
  { heading: "Timeline", body: `Days 1-5 — Early anti-inflammatory window. Some patients report reduced pain.
Weeks 1-2 — Initial anecdotal signal: improved mobility, reduced pain scores.
Weeks 4-6 — Animal-documented tissue remodelling window. Tendon-to-bone integration begins.
Weeks 8-12 — Chronic injury protocol duration. Gut protocols often show response by week 6.
After protocol — Effects diminish over 3-6 months after stopping. Gut healing may persist longer.` },
  { heading: "Side Effects", body: `Injection site redness/swelling — Common (5-15%), weeks 1-2
→ Rotate injection sites. Use abdomen rather than thigh.

Nausea (oral only) — Uncommon (5-10%), first week
→ Take 30 min before food on empty stomach. Not applicable for injectable.

Mild transient headache — Rare (<5%), days 1-3
→ Usually resolves within 24-48 hours without intervention.

⚠️ Contraindicated in active cancer or cancer history — angiogenesis mechanism precludes use.` },
  { heading: "Cycling", body: `Common community protocol: 4-8 weeks on, 2-4 weeks off.
For chronic injuries: 8-12 weeks may be warranted.
After protocol: take a break of at least equal duration before reassessment.
No strong evidence for mandatory cycling — the 4-on/4-off convention is entirely community-based.` },
  { heading: "Stacking", body: `Pairs well with: TB-500 (Thymosin Beta-4) — the 'Wolverine stack', complementary tissue repair mechanisms
Pairs well with: GHK-Cu (copper peptide) — collagen synthesis, topical
Pairs well with: Collagen peptides (oral) — provides raw material for BPC-157 signalling
Use caution: PRP (Platelet-Rich Plasma) — no head-to-head evidence` }
];

const SEED_RETATRUTIDE_SECTIONS = [
  { heading: "Overview", body: `Retatrutide (LY-3437943) is an experimental triple hormone receptor agonist developed by Eli Lilly. It simultaneously targets GLP-1, GIP, and glucagon receptors — making it the first triple-agonist in its class for obesity and metabolic disease.

Mechanism: GLP-1 improves insulin sensitivity + satiety. GIP enhances energy expenditure. Glucagon agonism promotes fat loss and metabolic activity. Together: reduced caloric intake + increased energy expenditure.

Status: Investigational — Phase 3 trials completed 2026  |  Half-life: ~6 days (once-weekly dosing)  |  Route: Subcutaneous injection` },
  { heading: "Dosing Protocol", body: `┌──────────────────────┬────────────────────┬─────────────────────┐
│                      │ Titration (Wk 1-4)  │ Maintenance         │
├──────────────────────┼────────────────────┼─────────────────────┤
│ Starting dose        │ 2 mg once weekly   │ 4-12 mg once weekly │
├──────────────────────┼────────────────────┼─────────────────────┤
│ Escalation           │ Increase by 2 mg   │ Based on tolerance  │
│                      │ every 4 weeks      │ and response        │
├──────────────────────┼────────────────────┼─────────────────────┤
│ Max dose studied     │ —                  │ 12 mg once weekly   │
├──────────────────────┼────────────────────┼─────────────────────┤
│ Injection site       │ Subcutaneous       │ Subcutaneous        │
│                      │ (abdomen/thigh)    │ (abdomen/thigh)     │
└──────────────────────┴────────────────────┴─────────────────────┘

Administer once weekly, same day each week. Rotate injection sites.` },
  { heading: "Reconstitution", body: `Retatrutide is supplied as a solution for injection — no reconstitution required.
- Store in fridge (2-8°C)
- Do not freeze
- Protect from light
- Use by expiration date on vial` },
  { heading: "Timeline", body: `Weeks 1-4 — Appetite suppression begins. Reduced caloric intake. Mild GI side effects possible.
Weeks 4-8 — Visible weight loss typically begins. Dose may be increased at week 4.
Week 24 (Phase 2 data) — Up to 17.5% mean weight reduction at 24 weeks.
Week 48-72 (Phase 3 data) — 15-24% mean weight loss depending on dose.
Ongoing — HbA1c improvement in T2D patients. Cardiometabolic benefits.` },
  { heading: "Side Effects", body: `Nausea — Very common (40-60%), especially during titration
→ Dose-dependent. Eat smaller meals. Usually improves over time.

Diarrhoea — Common (20-35%)
→ Stay hydrated. Usually transient.

Vomiting — Common (10-20%), higher at max doses
→ Slow titration reduces risk.

Constipation — Common (10-20%)
→ Increase fibre and water intake.

Abdominal discomfort — Common (10-20%)
→ Typically mild-moderate.

⚠️ Potential risks: Pancreatitis, gallbladder disease, increased heart rate (mild, dose-dependent).` },
  { heading: "Cycling", body: `Designed for continuous once-weekly use — not cycled like research peptides.
Dose follows a structured titration escalation schedule.
If discontinuing: taper down gradually under physician guidance.` },
  { heading: "Stacking", body: `May be combined with: Metformin (for T2D) — under physician supervision.
Caution with: Other GLP-1 agonists (semaglutide, tirzepatide) — redundant mechanism, increased side effect risk.
No research peptide stacking data available.` }
];

const SEED_GHKCU_SECTIONS = [
  { heading: "Overview", body: `GHK-Cu is a naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine, first isolated in 1973 by Dr. Loren Pickart. It is naturally present in human plasma and declines ~50% after age 60. It stimulates collagen production, modulates MMPs for tissue remodelling, and has anti-inflammatory effects via TNF-alpha and IL-1 beta suppression.

Route: Topical or Subcutaneous injection  |  Half-life: ~30 min (injectable)  |  Mechanism: Fibroblast activation, collagen synthesis, angiogenesis  |  Category: Copper peptide, tissue repair` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │ Topical              │ Injectable (SubQ)    │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Standard dose         │ 0.1-0.5% cream       │ 1-2 mg per day       │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Frequency             │ 2× daily             │ 1× daily or 5-on/2-off│
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Duration              │ 12 weeks             │ 4-12 weeks           │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Timing                │ Morning + evening    │ Evening, 1-2h pre-bed│
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Notes                 │ Apply to clean skin  │ SubQ into abdomen    │
└───────────────────────┴──────────────────────┴──────────────────────┘

Start topical at 0.1% for first 2 weeks to reduce "copper uglies" transition phase.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- Inject BAC water slowly down vial wall
- Swirl gently — do not shake
- Store reconstituted in fridge (2-8°C)
- Use within 30 days once reconstituted

Concentration: 5-10 mg/mL (5 mL BAC per 50 mg vial for 10 mg/mL)` },
  { heading: "Timeline", body: `Weeks 1-2 — "Copper uglies" phase: congestion, small bumps, dullness from accelerated turnover. Do not stop — reduce to every other day if pronounced.
Weeks 4-6 — Improved hydration, skin softness, better texture.
Weeks 8-10 — Fine lines improve, redness reduces. Hair follicle response may appear.
Week 12+ — Peak measurable outcomes: increased skin density, reduced wrinkle depth (~32.8%).
After stopping — Effects gradually diminish over 3-6 months.` },
  { heading: "Side Effects", body: `"Copper uglies" (topical) — Very common, weeks 1-2
→ Accelerated cellular turnover. Reduce to every other day. Hydrate. Do not stop.

Metallic/copper taste (injectable) — Uncommon (<10%), minutes post-injection
→ Harmless. Self-resolving within 30 min. Reflects copper biodistribution.

Injection site redness — Common (10-20%), weeks 1-3
→ Rotate sites. Use 28-31G needle. Allow vial to warm to room temp.

Mild nausea — Rare (<5%), first week
→ Hydrate well. Reduce frequency if persistent.` },
  { heading: "Cycling", body: `Topical: 12 weeks on, 4 weeks off for cosmetic protocols.
Injectable: 4-8 weeks on, 2-4 weeks off typical for systemic use.
The "copper uglies" transition phase is temporary — push through it.` },
  { heading: "Stacking", body: `Pairs well with: BPC-157 — complementary tissue repair pathways
Pairs well with: GH peptides (sermorelin, CJC) — GH increases collagen baseline
Pairs well with: Hyaluronic acid serum — compounds hydration benefit
Pairs well with: Topical retinoid (alternate days) — collagen via different mechanisms
Use caution: High-dose vitamin C — can destabilise copper complex` }
];

const SEED_GLOW_SECTIONS = [
  { heading: "Overview", body: `The "Glow" stack combines GHK-Cu, BPC-157, and TB-500 (Thymosin Beta-4) for comprehensive tissue repair, skin health, and recovery. GHK-Cu drives collagen synthesis, BPC-157 upregulates growth factors for healing, and TB-500 promotes cell migration and actin polymerisation.

Together this stack targets skin, connective tissue, joints, and systemic recovery from multiple angles.

Route: Subcutaneous injection  |  Category: Tissue repair stack (copper peptide + growth factor + cytoskeletal)` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│ Component             │ Dose                 │ Frequency            │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ GHK-Cu                │ 1-2 mg               │ Daily                │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ BPC-157               │ 250-500 mcg          │ Daily                │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ TB-500                │ 2.5-5 mg             │ 2× per week          │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Protocol length       │ 4-8 weeks            │ —                    │
└───────────────────────┴──────────────────────┴──────────────────────┘

All three can be drawn into the same syringe. Inject SubQ into abdomen. Rotate sites.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water) for each peptide separately
- Inject BAC water slowly down vial wall
- Swirl gently — do not shake
- Store each reconstituted peptide in fridge (2-8°C)
- Use within 30 days once reconstituted

TB-500 may require slightly more BAC water due to its larger molecular weight (5 kDa).` },
  { heading: "Timeline", body: `Weeks 1-2 — Early anti-inflammatory effects. Skin may show "copper uglies" from GHK-Cu.
Weeks 3-4 — Improved skin texture and hydration. Reduced joint pain and better recovery.
Weeks 4-6 — Noticeable tissue repair. Better wound healing. Skin firmness improves.
Weeks 8+ — Peak effects: collagen density, reduced fine lines, improved tendon/ligament health.
After stopping — Effects taper over 2-4 months.` },
  { heading: "Side Effects", body: `Injection site reactions — Common (10-20%)
→ Rotate sites. Use proper technique.

Copper uglies (from GHK-Cu) — Common, first 2 weeks
→ Temporary. Reduce GHK-Cu to every other day.

Metallic taste (from GHK-Cu) — Uncommon (<10%)
→ Harmless. Self-resolving within 30 min.

Mild fatigue — Uncommon, first week
→ Adaptation phase. Typically resolves.

⚠️ BPC-157 contraindicated in active cancer. TB-500 may increase angiogenesis — caution with cancer history.` },
  { heading: "Cycling", body: `Standard protocol: 4-8 weeks on, 2-4 weeks off.
For chronic conditions: up to 12 weeks may be warranted.
Allow equal rest period between cycles.` },
  { heading: "Stacking", body: `The Glow stack IS the combination — all three peptides work synergistically.
Can add: Collagen peptides (oral) — provides raw materials for collagen synthesis
Can add: NAD+ — cellular energy to support the repair processes
Avoid adding: Other angiogenesis-promoting peptides without medical supervision` }
];

const SEED_MT2_SECTIONS = [
  { heading: "Overview", body: `Melanotan II (MT-2) is a synthetic analogue of alpha-melanocyte-stimulating hormone (α-MSH). It stimulates melanogenesis (skin pigmentation/tanning) through the MC1 receptor. It also has secondary effects on libido via MC3/MC4 receptor activation, and some appetite-suppressant effects.

Route: Subcutaneous injection  |  Half-life: ~36 hours  |  Mechanism: MC1 receptor agonist (melanogenesis)  |  Category: Tanning peptide, melanocortin agonist` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │ Loading Phase        │ Maintenance          │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Dose                  │ 250-500 mcg (0.25-0.5mg) │ 250-500 mcg 1-2×/wk │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Frequency             │ Every other day      │ 1-2 times per week   │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Duration              │ 2-4 weeks            │ Ongoing as needed    │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Syringe draw (2mg/mL) │ 12.5-25 units        │ 12.5-25 units        │
└───────────────────────┴──────────────────────┴──────────────────────┘

Start low (250 mcg) to assess nausea response. Titrate up slowly. Always use sunscreen — MT-2 increases melanin but does NOT replace sun protection.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- 2 mL BAC per 10 mg vial = 5 mg/mL concentration
- 250 mcg dose = 0.05 mL = 5 units on U-100 syringe
- 500 mcg dose = 0.1 mL = 10 units
- Store in fridge (2-8°C)
- Use within 30 days once reconstituted
- Protect from light (photosensitive)` },
  { heading: "Timeline", body: `Days 1-3 — Possible nausea and facial flushing shortly after injection.
Week 1 — Skin darkening may begin. Nausea typically subsides.
Week 2-3 — Visible tan developing. Existing freckles/moles may darken.
Week 4 — Full tan effect at end of loading phase.
Maintenance — 1-2 doses per week to maintain colour.
After stopping — Tan fades over 4-8 weeks as melanin naturally clears.` },
  { heading: "Side Effects", body: `Nausea — Very common (40-60%), especially first doses
→ Dose-dependent. Inject before bed to sleep through it. Resolves within 1-2 weeks.

Facial flushing — Common (30-50%), 15-60 min post-injection
→ Benign. Self-resolving.

Increased libido — Common (20-40%)
→ MC3/MC4 receptor effect. Can be significant.

Spontaneous erections (males) — Common (15-30%)
→ Temporary. Typically subsides after loading phase.

Darkening of existing moles/freckles — Common
→ Monitor moles for any changes. Sunscreen essential.

Nausea/vomiting (severe) — Uncommon (<5%)
→ Reduce dose. If persistent, discontinue.` },
  { heading: "Cycling", body: `Loading phase: 2-4 weeks of every-other-day dosing.
Maintenance: 1-2 doses per week, or as needed to maintain desired colour.
Cycle off: Allow 4-8 weeks break periodically.
Melanin production is cumulative — less frequent dosing maintains tan once established.` },
  { heading: "Stacking", body: `Avoid stacking with: Other melanocortin agonists — redundant.
Can use with: BPC-157 for tissue repair (no known interaction).
Can use with: GHK-Cu for skin health (complementary).
⚠️ Do NOT use with: Tanning beds or excessive UV exposure — increased skin cancer risk.
⚠️ Monitor moles — MT-2 can darken existing naevi, making changes harder to detect.` }
];

const SEED_NAD_SECTIONS = [
  { heading: "Overview", body: `NAD+ (Nicotinamide Adenine Dinucleotide) is a crucial coenzyme found in every cell. It is essential for cellular energy (ATP production via mitochondrial respiration), DNA repair (PARP activation), and sirtuin-mediated longevity pathways. NAD+ levels naturally decline with age — dropping ~50% by age 60.

Route: Subcutaneous injection, IV infusion, or Oral  |  Half-life: 2-4 hours (injectable)  |  Category: Metabolic coenzyme, longevity, cellular health` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │ Injectable (SubQ/IM) │ Oral (NR/NMN)        │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Standard dose         │ 50-100 mg per day    │ 250-500 mg per day   │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Loading / IV          │ 250-500 mg IV 1-3×/wk│ —                    │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Frequency             │ Daily or 5-on/2-off  │ Daily                │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Protocol length       │ 4-12 weeks           │ Ongoing              │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Injection site        │ SubQ (abdomen)       │ N/A                  │
└───────────────────────┴──────────────────────┴──────────────────────┘

Injectable NAD+ is acidic — inject slowly. May cause mild stinging at injection site.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- Inject BAC water slowly down vial wall
- Swirl gently — do not shake
- Store reconstituted in fridge (2-8°C)
- Use within 30 days once reconstituted
- NAD+ is sensitive to light and heat — protect vial from light

Concentration: 50 mg/mL (2 mL BAC per 100 mg vial)` },
  { heading: "Timeline", body: `Days 1-3 — Some users report mild flushing or warmth post-injection. Energy increase may begin.
Week 1-2 — Noticeable increase in mental clarity and physical energy. Better exercise recovery.
Week 3-4 — Improved sleep quality. Reduced brain fog. Better stress resilience.
Week 6-8 — Systemic anti-aging effects reported: better skin, cognition, energy levels.
Ongoing — Cumulative benefits with consistent use. Effects subside within 2-4 weeks of stopping.` },
  { heading: "Side Effects", body: `Injection site pain/stinging — Common (20-30%)
→ NAD+ is acidic. Inject slowly. Dilute with more BAC water if needed.

Flushing/warmth — Common (15-25%), 10-30 min post-injection
→ Niacin-like effect. Benign. Self-resolving.

Mild nausea — Uncommon (5-10%)
→ Take with food. Reduce dose.

Headache — Uncommon (5-10%)
→ Stay hydrated. Usually transient.

⚠️ Caution with: Pre-existing bipolar disorder or mania — NAD+ may exacerbate mood elevation.` },
  { heading: "Cycling", body: `Injectable: 4-12 weeks on, 2-4 weeks off is common practice.
Oral (NR/NMN): Can be taken continuously, but periodic breaks are recommended.
IV loading: 3-6 sessions over 2-3 weeks, then monthly maintenance.
NAD+ levels drop after stopping — effects are not permanent.` },
  { heading: "Stacking", body: `Pairs well with: GHK-Cu — both target cellular health and repair via different pathways
Pairs well with: BPC-157 — tissue repair + cellular energy support
Pairs well with: CJC/Ipa — GH pulse + metabolic support
Avoid with: High-dose niacin — may compound flushing side effects.
Complementary oral: NMN, NR, or nicotinamide riboside for maintenance between injectable cycles.` }
];

const SEED_SELANK_SECTIONS = [
  { heading: "Overview", body: `Selank is a synthetic heptapeptide (TP-7) developed by the Russian Institute of Molecular Genetics. It is a synthetic analogue of tuftsin, an immunomodulatory peptide. Selank modulates the GABAergic system gently (without sedation or dependency), elevates BDNF, and regulates serotonin metabolism — producing anxiolytic effects without cognitive impairment.

Route: Intranasal (spray) or Subcutaneous injection  |  Half-life: 1-2 min (plasma), 4-6h (CNS effect)  |  Category: Anxiolytic, nootropic, neuropeptide` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │ Intranasal (standard) │ Subcutaneous         │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Beginner dose         │ 250 mcg 1× daily     │ 250 mcg 1× daily     │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Standard dose         │ 250-500 mcg 1-2×/day │ 250-500 mcg daily    │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Higher dose           │ 500-750 mcg daily    │ 500-750 mcg daily    │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Onset                 │ 20-40 min            │ 15-30 min            │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Duration              │ 4-6 hours            │ 4-6 hours            │
└───────────────────────┴──────────────────────┴──────────────────────┘

Morning dosing is common. Can add afternoon dose if needed. Cycle: 2-4 weeks on, 1-2 weeks off.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- For nasal spray: mix with 0.9% saline solution for better absorption
- Inject BAC water slowly down vial wall
- Swirl gently — do not shake
- Store in fridge (2-8°C)
- Use within 30 days once reconstituted

Nasal spray: 10 mg/mL concentration (1 mL per 10 mg vial) — ~250 mcg per 0.025 mL spray` },
  { heading: "Timeline", body: `Day 1 — Acute anxiolytic effect within 20-40 minutes of first dose. Calm without sedation.
Week 1 — Background anxiety noticeably reduced. Mental clarity improves.
Week 2 — Cumulative effects build. Better stress resilience. Improved focus.
Week 3-4 — Full anxiolytic and cognitive benefits. Baseline anxiety shifts downward.
After cycling off — Effects gradually taper over 1-2 weeks. No withdrawal reported.` },
  { heading: "Side Effects", body: `Mild drowsiness — Uncommon (5-10%), especially at higher doses
→ Usually resolves within first week. Reduce dose if persistent.

Nasal irritation (intranasal) — Mild, formulation-dependent
→ Related to carrier solution, not Selank itself.

Mild headache — Rare (<5%)
→ Stay hydrated. Usually transient.

Initial fatigue (first few days) — Rare (<5%)
→ Adaptation phase. Resolves quickly.

No dependency, no withdrawal, no tolerance at standard cycle lengths.` },
  { heading: "Cycling", body: `Standard cycle: 2-4 weeks on, 1-2 weeks off.
Daily use within a cycle is well-tolerated.
Some users run longer cycles without issues. Cycling is conservative best practice.
No tolerance buildup observed at standard doses.` },
  { heading: "Stacking", body: `Pairs exceptionally with: Semax — "Calm & Clarity" stack. Selank for anxiety, Semax for cognitive drive.
Pairs well with: Magnesium Glycinate — supports GABA function, extends calming effect into evening.
Pairs well with: BPC-157 — mental stress + physical recovery.
⚠️ Avoid with: Benzodiazepines, alcohol, or other GABAergic depressants without medical supervision.` }
];

const SEED_SEMAX_SECTIONS = [
  { heading: "Overview", body: `Semax is a synthetic heptapeptide and analogue of ACTH(4-10), developed by the Russian Institute of Molecular Genetics. It is a nootropic, neuroprotective, and neurorestorative agent used clinically in Russia for stroke recovery, cognitive impairment, and optic nerve disease. It elevates BDNF levels, activates dopaminergic and serotonergic systems, and inhibits enkephalin-degrading enzymes.

Route: Intranasal (spray) or Subcutaneous injection  |  Half-life: ~5-15 min (plasma), 4-6h (CNS)  |  Category: Nootropic, neuroprotective, ACTH analogue` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │ Intranasal            │ Subcutaneous         │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Standard dose         │ 400-800 mcg (0.4-0.8mg)│ 200-500 mcg daily   │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Frequency             │ 1-2× daily           │ 1× daily             │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Cycle length          │ 2-4 weeks            │ 2-4 weeks            │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Onset                 │ 15-30 min            │ 10-20 min            │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Duration              │ 4-6 hours            │ 4-6 hours            │
└───────────────────────┴──────────────────────┴──────────────────────┘

Morning dosing preferred — Semax has an energising effect. Avoid evening doses.
Nasal spray: ~400 mcg per spray (0.05 mL at 8 mg/mL).` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- For nasal spray: mix with 0.9% saline for better mucosal absorption
- Inject BAC water slowly down vial wall
- Swirl gently — do not shake
- Store in fridge (2-8°C)
- Use within 30 days once reconstituted

Nasal concentration: 8 mg/mL (1.25 mL per 10 mg vial)` },
  { heading: "Timeline", body: `Day 1 — Increased alertness, focus, and mental energy within 30 min of first dose.
Week 1 — Sustained cognitive enhancement. Better memory recall. Reduced mental fatigue.
Week 2 — Improved stress resilience. Better learning retention. Neuroprotective effects accumulate.
Week 3-4 — Peak cognitive benefits. Enhanced BDNF levels support neuroplasticity.
After stopping — Benefits gradually taper. Neuroprotective effects may persist longer.` },
  { heading: "Side Effects", body: `Mild overstimulation/jitteriness — Common (10-20%), especially at higher doses
→ Reduce dose. Take earlier in the day. Avoid afternoon/evening.

Mild headache — Uncommon (5-10%)
→ Stay hydrated. Usually transient.

Nasal irritation (intranasal) — Mild, formulation-dependent
→ Related to carrier solution.

Insomnia (if taken late) — Common
→ Avoid dosing after 2 PM.

No known toxicity or dependency at standard doses. Excellent safety profile in clinical use.` },
  { heading: "Cycling", body: `Standard: 2-4 weeks on, 1-2 weeks off.
Semax is energising — tolerance to the cognitive effects may develop with extended use.
Cycling preserves sensitivity and effectiveness.
Used clinically in Russia for up to 14 days per course.` },
  { heading: "Stacking", body: `Pairs exceptionally with: Selank — "Calm & Clarity" stack. Semax for focus, Selank for anxiety.
Pairs well with: Noopept — complementary nootropic pathways.
Pairs well with: Choline sources (Alpha-GPC, Citicoline) — supports acetylcholine synthesis.
⚠️ Avoid with: Strong stimulants — may compound overstimulation.
⚠️ Avoid evening dosing — will disrupt sleep.` }
];

const SEED_TB500_SECTIONS = [
  { heading: "Overview", body: `TB-500 (Thymosin Beta-4 fragment) is a synthetic version of a naturally occurring peptide that promotes tissue repair, cell migration, and actin polymerisation. It is fundamental for cytoskeletal organisation, angiogenesis, and wound healing. Combined with BPC-157 it forms the popular "Wolverine stack" for accelerated recovery.

Route: Subcutaneous injection  |  Half-life: ~2-4 days (long-acting)  |  Mechanism: Actin binding, cell migration, angiogenesis  |  Category: Tissue repair, cytoskeletal peptide` },
  { heading: "Dosing Protocol", body: `┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │ Loading Phase        │ Maintenance          │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Dose                  │ 2.5-5 mg per dose    │ 2.5 mg per dose      │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Frequency             │ 2-3× per week        │ 1× per week          │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Duration              │ 2-4 weeks            │ Ongoing as needed    │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Syringe draw (10mg/mL)│ 25-50 units          │ 25 units             │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Site                  │ SubQ (abdomen)       │ SubQ (abdomen)       │
└───────────────────────┴──────────────────────┴──────────────────────┘

Due to longer half-life, twice-weekly dosing is effective. Can be combined with BPC-157 in same syringe.` },
  { heading: "Reconstitution", body: `- Use bacteriostatic water (BAC water)
- TB-500 requires more BAC water than smaller peptides (larger molecule at ~5 kDa)
- 2 mL BAC per 10 mg vial = 5 mg/mL concentration → 2.5 mg dose = 0.5 mL (50 units)
- Inject BAC water slowly down vial wall
- Swirl gently — do not shake
- Let sit 5-10 min to fully dissolve (may take longer than smaller peptides)
- Store in fridge (2-8°C)
- Use within 30 days once reconstituted` },
  { heading: "Timeline", body: `Week 1 — Early anti-inflammatory effects. Some reduction in joint/tendon pain.
Week 2-3 — Improved mobility and recovery from workouts or injuries.
Week 3-4 — Noticeable tissue repair. Better wound healing. Reduced scar tissue formation.
Week 4-6 — Peak effects on tendon/ligament healing and tissue remodelling.
After stopping — Effects persist for several weeks due to long half-life. Gradually taper over 4-6 weeks.` },
  { heading: "Side Effects", body: `Injection site reactions — Common (10-15%)
→ Rotate sites. Use proper injection technique.

Mild fatigue post-injection — Uncommon (5-10%)
→ Transient. Usually resolves within 24 hours.

⚠️ TB-500 promotes angiogenesis — caution with active cancer or cancer history.
⚠️ WADA prohibited in competitive sport.

Generally well-tolerated with minimal side effects at standard doses.` },
  { heading: "Cycling", body: `Standard: 4-6 weeks on, 2-4 weeks off.
Due to long half-life, effects persist after stopping — no need for frequent dosing.
Loading phase followed by weekly maintenance is most efficient.
Cycling is recommended to prevent potential desensitisation.` },
  { heading: "Stacking", body: `The "Wolverine stack": TB-500 + BPC-157 — complementary tissue repair mechanisms. Most popular combination.
Pairs well with: GHK-Cu — collagen synthesis + tissue repair via different pathways.
Pairs well with: BPC-157 + GHK-Cu → the "Glow" stack for full spectrum repair.
Pairs well with: CJC/Ipa or other GH peptides — GH supports protein synthesis and tissue repair.
Avoid with: Other strong angiogenic compounds without medical supervision.` }
];

const ALL_SEEDS = [
  { id: "seed-cjc-ipa", title: "CJC-1295 (No DAC) + Ipamorelin Protocol", category: "Protocol", sections: SEED_CJC_SECTIONS },
  { id: "seed-bpc157", title: "BPC-157 Protocol", category: "Protocol", sections: SEED_BPC157_SECTIONS },
  { id: "seed-retatrutide", title: "Retatrutide Protocol", category: "Protocol", sections: SEED_RETATRUTIDE_SECTIONS },
  { id: "seed-ghkcu", title: "GHK-Cu Protocol", category: "Protocol", sections: SEED_GHKCU_SECTIONS },
  { id: "seed-glow", title: "Glow Stack Protocol (GHK-Cu + BPC-157 + TB-500)", category: "Protocol", sections: SEED_GLOW_SECTIONS },
  { id: "seed-mt2", title: "Melanotan II (MT-2) Protocol", category: "Protocol", sections: SEED_MT2_SECTIONS },
  { id: "seed-nad", title: "NAD+ Protocol", category: "Protocol", sections: SEED_NAD_SECTIONS },
  { id: "seed-selank", title: "Selank Protocol", category: "Protocol", sections: SEED_SELANK_SECTIONS },
  { id: "seed-semax", title: "Semax Protocol", category: "Protocol", sections: SEED_SEMAX_SECTIONS },
  { id: "seed-tb500", title: "TB-500 (Thymosin Beta-4) Protocol", category: "Protocol", sections: SEED_TB500_SECTIONS },
];

// ── Content renderer ─────────────────────────────────────────

function isRuler(line) {
  return /^[═▔▁─━]+$/.test(line.trim()) && line.trim().length > 5;
}
function isTableBorder(line) {
  return /^[┌├└┐┤┘┴┬┼─╌]+/.test(line.trim());
}
function isTableRow(line) {
  return line.trimStart().startsWith("│");
}
function isBullet(line) {
  return /^[•\-]\s/.test(line.trim());
}
function isNote(line) {
  return line.trimStart().startsWith("→");
}
function hasPipes(line) {
  return line.includes("|") && !line.trimStart().startsWith("→") && !line.trimStart().startsWith("│");
}

function parseContent(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (isRuler(line)) {
      const headerLine = lines[i + 1]?.trim();
      const closingRuler = lines[i + 2] && isRuler(lines[i + 2]);
      if (headerLine && closingRuler) {
        blocks.push({ type: "section", text: headerLine.replace(/^#\s*/, "") });
        i += 3;
        continue;
      }
    }

    if (isTableBorder(line)) {
      const tableRows = [];
      while (i < lines.length && (isTableBorder(lines[i]) || isTableRow(lines[i]))) {
        if (isTableRow(lines[i])) {
          const cells = lines[i].split("│").slice(1, -1).map(c => c.trim());
          if (cells.length > 0) tableRows.push({ cells });
        }
        i++;
      }
      if (tableRows.length > 0) {
        const header = tableRows[0]?.cells?.length > 1 ? tableRows[0] : null;
        const body = header ? tableRows.slice(1) : tableRows;
        blocks.push({ type: "table", header, body });
        continue;
      }
    }

    if (isBullet(trimmed)) {
      const items = [];
      while (i < lines.length && isBullet(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[•\-]\s*/, ""));
        i++;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    if (isNote(trimmed)) {
      const notes = [];
      while (i < lines.length && isNote(lines[i].trim())) {
        notes.push(lines[i].trim().replace(/^→\s*/, ""));
        i++;
      }
      blocks.push({ type: "notes", items: notes });
      continue;
    }

    if (hasPipes(trimmed)) {
      const parts = trimmed.split("|").map(s => s.trim()).filter(Boolean);
      blocks.push({ type: "stats", items: parts });
      i++;
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || isBullet(l) || isNote(l) || isTableBorder(l) || isTableRow(l) || isRuler(l) || hasPipes(l)) break;
      paraLines.push(l);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }
  return blocks;
}

function StatChips({ items, theme }) {
  const colors = [theme.accent, theme.success, theme.warning, theme.danger];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {items.map((item, idx) => {
        const [label, ...rest] = item.split(":");
        const value = rest.join(":").trim();
        return (
          <div key={idx} style={{
            flex: "1 1 160px", background: theme.bgTertiary, border: `1px solid ${theme.border}`,
            borderRadius: 8, padding: "12px 14px"
          }}>
            <div style={{ fontSize: 9, color: colors[idx % colors.length], letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{label.trim()}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{value}</div>
          </div>
        );
      })}
    </div>
  );
}

function RichContent({ text, theme }) {
  const blocks = parseContent(text);
  const g = (k) => `1px solid ${theme.border}`;

  return (
    <div>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "section":
            return (
              <div key={idx} style={{ marginBottom: 16, marginTop: idx > 0 ? 24 : 0, borderBottom: `1px solid ${theme.border}`, paddingBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>{block.text}</div>
              </div>
            );
          case "paragraph":
            return <p key={idx} style={{ fontSize: 13, color: theme.text, lineHeight: 1.7, margin: "0 0 12px 0" }}>{block.text}</p>;
          case "table":
            return (
              <div key={idx} style={{ marginBottom: 16, borderRadius: 8, overflow: "hidden", border: g('border') }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  {block.header && (
                    <thead>
                      <tr style={{ background: theme.accentGlass }}>
                        {block.header.cells.map((cell, ci) => (
                          <th key={ci} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: theme.accent, letterSpacing: 1, fontWeight: 600, borderBottom: g('border') }}>{cell}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {block.body.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : theme.bgTertiary }}>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} style={{ padding: "10px 14px", fontSize: 12, color: ci === 0 ? theme.textSecondary : theme.text, fontWeight: ci === 0 ? 600 : 400, fontFamily: ci > 0 ? "'JetBrains Mono', monospace" : "inherit", borderBottom: ri < block.body.length - 1 ? g('border') : "none" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "bullets":
            return (
              <div key={idx} style={{ marginBottom: 12 }}>
                {block.items.map((item, bi) => (
                  <div key={bi} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: theme.text, lineHeight: 1.6 }}>
                    <span style={{ color: theme.accent, flexShrink: 0 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            );
          case "notes":
            return (
              <div key={idx} style={{ marginBottom: 12, marginLeft: 8, borderLeft: `2px solid ${theme.accent}30`, paddingLeft: 12 }}>
                {block.items.map((item, ni) => (
                  <div key={ni} style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 4 }}>{item}</div>
                ))}
              </div>
            );
          case "stats":
            return <StatChips key={idx} items={block.items} theme={theme} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

function emptyForm() {
  const obj = {};
  TEMPLATE_SECTIONS.forEach(s => obj[s.key] = "");
  return obj;
}

export default function KnowledgeBase() {
  const { theme } = useTheme();
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCat, setFormCat] = useState("General");
  const [formSections, setFormSections] = useState(emptyForm());

  useEffect(() => {
    let existing = loadDocs();
    const existingIds = new Set(existing.map(d => d.id));
    const missing = ALL_SEEDS.filter(s => !existingIds.has(s.id))
      .map(s => ({ ...s, created_at: Date.now(), updated_at: Date.now() }));
    if (existing.length === 0 || missing.length > 0) {
      existing = [...missing, ...existing];
      saveDocs(existing);
    }
    setDocs(existing);
  }, []);

  const g = (k) => `1px solid ${theme.border}`;
  const inputStyle = {
    padding: "8px 10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
    color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%",
    boxSizing: "border-box", borderRadius: 6
  };
  const textareaStyle = {
    ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.5
  };
  const btnPrimary = {
    padding: "8px 16px", background: theme.accent, border: "none", color: "#fff",
    fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 6
  };
  const btnSecondary = {
    padding: "8px 16px", background: "none", border: g('border'), color: theme.textSecondary,
    fontSize: 12, cursor: "pointer", borderRadius: 6
  };

  const persist = (updated) => { setDocs(updated); saveDocs(updated); };

  const openNew = () => {
    setFormTitle("");
    setFormCat("General");
    setFormSections(emptyForm());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setFormTitle(doc.title);
    setFormCat(doc.category);
    const vals = emptyForm();
    if (doc.sections) {
      doc.sections.forEach(s => {
        const match = TEMPLATE_SECTIONS.find(t => t.label === s.heading);
        if (match) vals[match.key] = s.body;
      });
    }
    setFormSections(vals);
    setEditId(doc.id);
    setShowForm(true);
  };

  const save = () => {
    if (!formTitle.trim()) return;
    const sections = TEMPLATE_SECTIONS
      .filter(t => formSections[t.key]?.trim())
      .map(t => ({ heading: t.label, body: formSections[t.key].trim() }));

    if (!sections.length) { alert("Fill in at least one section."); return; }

    const now = Date.now();
    if (editId) {
      persist(docs.map(d => d.id === editId ? { ...d, title: formTitle, category: formCat, sections, updated_at: now } : d));
    } else {
      persist([...docs, { id: uid(), title: formTitle, category: formCat, sections, created_at: now, updated_at: now }]);
    }
    setShowForm(false);
  };

  const del = (id) => {
    if (!confirm("Delete this document?")) return;
    persist(docs.filter(d => d.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const filtered = docs.filter(d => {
    if (filterCat !== "all" && d.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (d.title.toLowerCase().includes(q)) return true;
      const body = (d.sections || []).map(s => s.body).join(" ").toLowerCase();
      if (body.includes(q)) return true;
      return false;
    }
    return true;
  }).reverse();

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, color: theme.textSecondary, letterSpacing: 1, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>KNOWLEDGE BASE</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Knowledge Base</h1>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ New Document</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, fontSize: 13, outline: "none", width: 260, borderRadius: 6 }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, fontSize: 13, outline: "none", borderRadius: 6 }}>
          <option value="all" style={{ background: theme.bgSecondary, color: theme.text }}>All Categories</option>
          {CATEGORIES.map(c => <option key={c} style={{ background: theme.bgSecondary, color: theme.text }}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: theme.textMuted }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Empty state */}
      {docs.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: theme.textSecondary }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📚</div>
          <div style={{ fontSize: 15, marginBottom: 8, color: theme.text }}>No documents yet</div>
          <div style={{ fontSize: 13 }}>Create internal knowledge documents — dosages, protocols, safety info, and more.</div>
        </div>
      )}

      {/* Document list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(doc => {
          const isExpanded = expanded === doc.id;
          const sections = doc.sections || [];
          const preview = sections[0]?.body ? sections[0].body.slice(0, 100) + "…" : "";

          return (
            <div key={doc.id} style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpanded(isExpanded ? null : doc.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{doc.title}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: theme.accentGlass, color: theme.accent, letterSpacing: 0.5 }}>{doc.category}</span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    {sections.length} section{sections.length !== 1 ? "s" : ""} · {new Date(doc.updated_at).toLocaleDateString()}
                  </div>
                  {!isExpanded && preview && (
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6, lineHeight: 1.4 }}>{preview}</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginLeft: 12 }}>{isExpanded ? "▲" : "▼"}</div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ borderTop: g('border') }}>
                  <div style={{ padding: "20px" }}>
                    {sections.map((sec, si) => (
                      <div key={si} style={{ marginBottom: si < sections.length - 1 ? 28 : 0 }}>
                        <div style={{ marginBottom: 12, borderBottom: `1px solid ${theme.border}`, paddingBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>{sec.heading}</div>
                        </div>
                        <RichContent text={sec.body} theme={theme} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 20px", borderTop: g('border'), display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(doc)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 11 }}>Edit</button>
                    <button onClick={() => del(doc.id)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 11, color: theme.danger, borderColor: theme.dangerBorder }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, width: "100%", maxWidth: 720, maxHeight: "95vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{editId ? "Edit Document" : "New Document"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            <Field label="Title">
              <input style={inputStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. BPC-157 Protocol" autoFocus />
            </Field>

            <Field label="Category">
              <select style={inputStyle} value={formCat} onChange={e => setFormCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} style={{ background: theme.bgSecondary, color: theme.text }}>{c}</option>)}
              </select>
            </Field>

            <div style={{ marginTop: 20, marginBottom: 12, fontSize: 12, color: theme.textSecondary, borderBottom: g('border'), paddingBottom: 8 }}>
              SECTIONS — fill in what you need, leave blank what you don't
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATE_SECTIONS.map(t => (
                <div key={t.key} style={{ border: `1px solid ${theme.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    padding: "8px 12px", fontSize: 12, fontWeight: 600, color: theme.text,
                    background: theme.bgTertiary, display: "flex", alignItems: "center", gap: 8
                  }}>
                    <span style={{ color: formSections[t.key]?.trim() ? theme.accent : theme.textMuted }}>
                      {formSections[t.key]?.trim() ? "●" : "○"}
                    </span>
                    {t.label}
                  </div>
                  <div style={{ padding: "8px 12px" }}>
                    <textarea style={textareaStyle} rows={4} value={formSections[t.key] || ""}
                      onChange={e => setFormSections(f => ({ ...f, [t.key]: e.target.value }))}
                      placeholder={t.placeholder} />
                    <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                      Supports: • bullets · → notes · ┌──┐ tables · label: value | chips
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={btnPrimary} onClick={save}>{editId ? "Save Changes" : "Create Document"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
