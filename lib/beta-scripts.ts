// Beta test scripts rendered at /beta (gated). Plain markdown — edit here and
// push to update the live page. No backtick inline-code (keeps the template
// literal clean); use **bold** / "quotes" for emphasis instead.
export const BETA_SCRIPTS = `
# Beta Test Scripts

Step-by-step tasks to test shabanga. No technical knowledge needed — follow the
steps and note anything that doesn't match the **Expected result**.

## Before you start

**This is a test environment. No real money moves.**

- Payments run in test mode. Use test card **4242 4242 4242 4242**, any future
  expiry (e.g. 12/30), any CVC (e.g. 123), any ZIP (e.g. 90001). You will never
  be charged.
- For Apple Pay / Google Pay tests, your wallet card also won't be charged.

**You'll play two roles:**

- **Organizer** — creates and manages an event.
- **Attendee** — buys a ticket and shows up at the door (no account needed).

**How to report:** for each step, mark **PASS** or **FAIL** for yourself. For any
FAIL or idea, tap **Report a bug** (top of this page) and fill out the short
form — note what you did, what you expected, what happened, your device, and a
screenshot if you can. One report per issue.

---

## Part 1 — Organizer

### ORG-01 — Sign in
1. Open the app, tap **Account** (or **My Events**).
2. Tap **Organizer sign in**, enter your organizer email + password.
3. **Expected:** You land on My Events with the bottom tabs Events, Tickets, My Events, Account.

### ORG-02 — Create an event (manual)
1. My Events, tap **+** (top right).
2. Fill in name, venue, address, date, **start time**, **end time**, capacity, description.
3. Save.
4. **Expected:** The event appears in My Events as a **Draft**.

### ORG-03 — Create an event from text (AI import)
1. Start a new event, choose the **paste text / AI** option.
2. Paste a few lines, e.g. "Basement Tapes at The Lash, Sat June 27 9:30pm, 117 Winston St Los Angeles, tickets from $15."
3. Submit.
4. **Expected:** The form is pre-filled with what it detected. You can correct anything before saving.

### ORG-04 — Flyer + logo
1. On the event, upload a **flyer** image.
2. Account, **Promoter Profile**, upload a **logo**.
3. **Expected:** Flyer shows on the event; logo shows on your account and promoter page.

### ORG-05 — Fixed-price ticket tiers
1. Event, **Tickets**. Add "General Admission" $20, qty 100.
2. Add "Early Bird" $15, qty 50.
3. **Expected:** Both tiers listed with price and quantity.

### ORG-06 — Choose Your Adventure (pick-your-price)
1. Tickets, add a type, pick **Choose Your Adventure** (top of the dropdown).
2. **Expected:** Three labeled rows pre-fill (Community / Standard / Supporter). Enter prices (e.g. 5 / 10 / 20). You can add more (up to 6).
3. Save.
4. **Expected:** Saves. On the buyer screen it sits **above** the other tiers and lets the buyer pick one price.

### ORG-07 — Drinks + merch
1. Tickets, add a **drink** (e.g. "Beer" $8) and a **merch** item (e.g. "T-Shirt" $25).
2. **Expected:** They save. (Drinks unlock for buyers only after door check-in; merch sells any time.)

### ORG-08 — Publish + share
1. Publish the event. Use **Share** to copy the link.
2. **Expected:** Status becomes **Published** (green pill). Link looks like shabanga.com/e/...

### ORG-09 — My Events card stats
1. After a ticket has sold (do BUY-02 first), return to My Events.
2. **Expected:** The card shows a sold/remaining bar (sold in the dark part, remaining in the light, % on the right), a "X/Y checked in" line, a TICKETS list with each tier's sold/quantity, plus Guests and Drinks/Merch (only if any sold).

---

## Part 2 — Discount codes (Organizer)

### DISC-01 — Shared % code
1. Event, **Discounts** (Manage grid). Keep **Shared code**.
2. Choose **% off**, value **20**, code **LOCALS20**, max uses **50**, per person **1**. Create.
3. **Expected:** LOCALS20 appears under Shared codes, "0/50 used."

### DISC-02 — Shared $ code
1. Discounts, Shared code, **$ off**, value **5**, code **FIVEOFF**, max uses blank. Create.
2. **Expected:** FIVEOFF appears, "$5.00 off."

### DISC-03 — Unique batch
1. Discounts, switch to **Unique batch**. **% off** **15**, count **10**, label **VIP**. Generate.
2. **Expected:** Pop-up "Created 10 codes" with **Share**. List shows a VIP batch "0/10 used."
3. Tap **Share** and confirm you can send/copy the codes.

### DISC-04 — Delete
1. Delete a shared code (confirm). Delete the VIP batch (confirm "Delete all").
2. **Expected:** They disappear and can't be used at checkout.

### DISC-05 — Expiry
1. Create a code with **Expires in N days** = 1.
2. **Expected:** It lists with an expiry date.

---

## Part 3 — Attendee / Buyer (app)

### BUY-01 — Find an event
1. **Events** tab. Browse, then search by name or city.
2. Toggle the **Flyers / Promoters** switch (top right).
3. **Expected:** Results update — Flyers shows posters, Promoters shows organizer logos/initials.

### BUY-02 — Buy a ticket (card)
1. Open a published paid event. Add **1 General Admission**. Note the subtotal, the **+$N fee** on the tier, and the total.
2. **Checkout**, enter name + email.
3. **Expected:** Order shows Subtotal, Fee, Total. Fee = per-ticket fee × number of tickets.
4. **Get tickets**, pay with test card **4242 4242 4242 4242**.
5. **Expected:** Confirmation screen with a **QR code**, and a ticket **email**.

### BUY-03 — Free / $0 ticket
1. Find a $0 tier (or apply a code that zeroes the ticket). Check out.
2. **Expected:** No payment screen — ticket issued instantly with a QR.

### BUY-04 — Choose Your Adventure
1. Open an event with that tier. **Expected:** It's listed **above** the others. Tap a price chip (e.g. $10) — only 1 allowed.
2. Try to add a second. **Expected:** Capped at **1 per order**. Complete checkout; the chosen price is what you pay (plus fee).

### BUY-05 — One-per-person limit
1. After BUY-04, try to buy another Choose Your Adventure for the same event with the **same email**.
2. **Expected:** Blocked with "limit 1 per person."

### BUY-06 — Percentage code
1. Add a $20 General Admission, Checkout. Enter **LOCALS20**, Apply.
2. **Expected:** Green **Discount (LOCALS20) −$4.00** line, total drops $4. **Fee does NOT change.**

### BUY-07 — Discount skips Choose Your Adventure
1. Cart = one fixed tier (GA $22) **and** one Choose Your Adventure ($5). Subtotal $27.
2. Apply a **20%** code.
3. **Expected:** Discount = 20% of **$22 only** = **−$4.40** (the $5 is excluded). Fee unchanged.

### BUY-08 — Remove a code
1. With a code applied, tap **Remove**.
2. **Expected:** Discount line disappears; total returns to full price.

### BUY-09 — Invalid code
1. Enter a made-up code (e.g. NOTREAL), Apply.
2. **Expected:** Clear error ("That code isn't valid for this event"). A used-up code shows "fully redeemed" / "already used."

### BUY-10 — Apple Pay (iPhone)
1. On a paid checkout, tap **Get tickets**.
2. **Expected:** Apple Pay shows in the sheet (needs a card in Apple Wallet). Complete with Apple Pay.

### BUY-11 — Google Pay (Android)
1. On a paid checkout, tap **Get tickets**.
2. **Expected:** Google Pay shows in the sheet (needs Google Wallet set up). *Known issue on some devices — note whether it appears and your phone model.*

### BUY-12 — Merch
1. On an event that sells merch, find the **Merch** section, add an item, check out.
2. **Expected:** Merch buys any time (no check-in needed) and appears in your order.

---

## Part 4 — Tickets & delivery

### TIX-01 — Tickets tab
1. Open the **Tickets** tab.
2. **Expected:** Your tickets are listed with QR codes you can open.

### TIX-02 — Email
1. Check the email used at checkout.
2. **Expected:** You received your ticket(s) / QR.

### TIX-03 — Confirmation exit (Android)
1. After a purchase, tap **✕** (top right) on the confirmation screen.
2. **Expected:** You return to the main screen cleanly.

---

## Part 5 — Website checkout (shabanga.com)

> Do these in a web browser, not the app.

### WEB-01 — Event page
1. Open a share link shabanga.com/e/...
2. **Expected:** Loads with flyer, details, and a ticket box.

### WEB-02 — Buy on the web
1. Add a ticket. Note subtotal, **+$N fee** on each tier, and total.
2. **Expected:** Booking fee = per-ticket fee × number of tickets (matches the app for the same cart).
3. Enter name + email, pay with the test card.
4. **Expected:** "You're in" with a QR, and a ticket email.

### WEB-03 — Discount on the web
1. Add a ticket, enter a valid code, Apply.
2. **Expected:** Green Discount line, total drops, **fee unchanged**. The total shown equals what you're charged.

### WEB-04 — Choose Your Adventure on the web
1. Pick a price chip on an event that has it.
2. **Expected:** Works like the app (1 per person). A code does **not** reduce the Choose Your Adventure amount.

### WEB-05 — Promoter page
1. Open shabanga.com/p/HANDLE (ask the organizer for theirs).
2. **Expected:** The promoter's branding and their upcoming events.

---

## Part 6 — At the door (Organizer / staff)

### DOOR-01 — Scan a ticket
1. Event, **Scanner Mode, Door**. Scan an attendee's QR.
2. **Expected:** Valid check-in (green / "checked in"). The card's checked-in count rises.

### DOOR-02 — Double scan
1. Scan the same QR again.
2. **Expected:** Flagged as already used (no second entry).

### DOOR-03 — Find by name (no QR)
1. In the door scanner, tap **Search by name**, type part of a name, check them in.
2. **Expected:** Checked in without scanning; the row shows "In."

### DOOR-04 — Drinks button appears after check-in
1. Be a **checked-in attendee** (your ticket was scanned in DOOR-01), on the **same phone that holds the ticket**.
2. **Bring the app back to the foreground** (or relaunch it) so it picks up your check-in.
3. Look at the bottom bar from any tab.
4. **Expected:** A **teal Drinks button** (wine-glass icon) appears in the **middle of the bar**, between Tickets and My Events, and stays there on every tab. (Before check-in it isn't there.)

### DOOR-05 — Order a drink / credit
1. Tap the teal **Drinks** button.
2. **Expected:** It opens your event scrolled to **"At the venue,"** with **Drinks and Credits now unlocked** (they were locked before check-in).
3. Add a drink, check out with the test card \`4242 4242 4242 4242\`.
4. **Expected:** You get a **drink pass with its own QR**, kept in the app (not emailed). Redeem it in DOOR-06.

### DOOR-06 — Bar / Merch modes
1. Scanner Mode, **Beverages** (and **Merch**). Scan a buyer's drink/merch pass.
2. **Expected:** Redeems the right item and shows the allotment.

---

## Part 7 — Guests & post-event (Organizer)

### GST-01 — Guest pass
1. Event, **Guests**, add a guest (name, optional plus-ones).
2. **Expected:** Added; the card's Guests count rises.

### PAY-01 — Production costs
1. Event, **Production**, add a cost (e.g. DJ $200, payee handle).
2. **Expected:** Listed and counted toward totals.

### PAY-02 — Payouts / net
1. Event, **Payouts**.
2. **Expected:** Gross revenue, platform fee, production costs, and a **net payout** figure.

### PAY-03 — Past-event net take
1. My Events, **Past events**.
2. **Expected:** Each past card shows net — **green** if you made money, **red** if underwater.

### PAY-04 — Revenue projection
1. Event, **Revenue**.
2. **Expected:** A projection/breakdown loads with sensible numbers.

---

## Part 8 — Account & promoter (Organizer)

### ACCT-01 — Handle
1. Account, **Promoter Profile**, set a **handle** (e.g. loomiere).
2. **Expected:** Saves. shabanga.com/p/loomiere loads your promoter page.

### ACCT-02 — Account settings
1. Account, **Account Settings**.
2. **Expected:** Email shown, "Get Paid" available, and a build-info line with "Check for update."

### ACCT-03 — Edit an event
1. Event, **Edit**, change a detail (e.g. description or end time), save.
2. **Expected:** The change shows on the event and the public page.

---

## Part 9 — Things to watch (everyone)

- **Totals match:** the price before paying equals what's charged (especially with discounts and multiple tickets).
- **Fee is never discounted:** a code lowers ticket price only.
- **Drinks button:** shows in the bottom bar after door check-in (re-open the app to see it), gone before.
- **Layout:** nothing cut off by the notch, home bar, or system nav (note your device).
- **Speed:** flag anything slow or frozen (especially the door scanner and checkout).
- **Email:** tickets actually arrive.
- **Back / exit:** you can always leave a screen without getting stuck.

---

*Thanks for testing. Every FAIL you log makes the launch smoother.*
`;
