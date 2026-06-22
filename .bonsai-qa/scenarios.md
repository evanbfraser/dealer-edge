# Dealer Edge Website — Test Scenarios

Curated scenarios for the Dealer Edge marketing site. Uses `run` mode (the
proven SDK specialist path).

NOTE: Section area codes must be 2–5 uppercase letters (parser constraint).
Use HOME, PRICE, FEAT — not PRICING/FEATURES.

## HOME: Homepage

### HOME-1: Landing page health and meta

- Navigate to the homepage (/)
- Check the browser console for errors and failed network requests
- Verify the page has a title tag and a meta description
- Verify Open Graph tags are present and the OG image resolves
- Check that the hero heading and primary CTA are visible
- Verify there is no horizontal overflow at mobile width

## PRICE: Pricing page

### PRICE-1: Pricing page health and meta

- Navigate to the pricing page (/pricing.html)
- Check the browser console for errors and failed network requests
- Verify the page has a unique title tag and meta description
- Check that pricing tiers render with no placeholder or "$0" values
- Verify headings follow a sensible hierarchy (single h1)

## FEAT: Features page

### FEAT-1: Features page health and accessibility

- Navigate to the features page (/features.html)
- Check the browser console for errors and failed network requests
- Verify images have meaningful alt text
- Check that interactive elements are reachable and have visible focus states
- Verify the page has a meta description
