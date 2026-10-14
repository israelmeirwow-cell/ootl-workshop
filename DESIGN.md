# Design: workshop landing (light edition of the יציאה מהלופ system)

Extends the main site's system (`../out_of_the_loop_vallora/src/index.css`). Light because the brief asks for it; one dark passage (section 2, "inside the loop").

## Tokens (`src/index.css`)
| Token | Value | Use |
| --- | --- | --- |
| cream | #f4efe6 | page ground |
| paper | #fbf8f3 | raised surfaces: cards, ticket, form, schedule band |
| ink | #0e0d0c | text, dark section, selected chips, icons |
| stone | #d6d2c8 | taken seats, idle rings |
| claret | #e0442f | buttons, the dot, prices, seats left. Never body text |
| claret-deep | #a8321f | small accent text (hook line, labels, errors): passes 4.5:1 on cream |

Type: Heebo Variable for everything (headings 800, tight -0.02em); Frank Ruhl Libre only for the brand wordmark, initials and Raz's quote. Body 17px on phones, 18–20px desktop. Prices and counts use tabular figures.

Radius rule: buttons 18px (sticky bar 16px), cards and ticket 28px, small panels 22px, inputs 14px, chips and pills full.

## Signature
The loop line (`lib/loop.ts`): tangles on the right, leaves straight to the left (the reading direction), ends in the red dot.
- Hero: writes itself on load; the CTA appears after the dot lands.
- Section 2: scroll-tied, writes in, holds tangled under "זה הלופ.", then pulls straight.
- Fit cards: three states of the same line. Final CTA and thank-you: the straight line and the dot.
Supporting motion: the method ring (counter-clockwise, dot runs once; pinned on desktop), red strike on "before" rows, the 4-hour clock dial, seats as squares that pop in.
No idle loops anywhere; `MotionConfig reducedMotion="user"` plus static fallbacks.

## Buttons
`PixelButton`: claret fill, the main site's pixel dissolve on mouse hover (ink pixels enter from the right), press scale 0.98. Labels never wrap.
