# StudentBazaar — Responsive Design Verification Matrix

This document tracks tested viewports, layout behaviors, discovered issues, and their resolutions.

---

## 1. Viewport Testing Matrix

| Viewport Width | Target Device Class | Expected Layout | Tested Status | Observations / Fixes |
| :--- | :--- | :--- | :--- | :--- |
| **320px** | Ultra-compact mobile | Single column / tight 2-col, compact header | Verified | Header logo scales down, horizontal scroll hidden, no text collision. |
| **360px** | Standard compact Android | 2-column compact grid, touch friendly | Verified | Cards display neatly with stacked pricing badges. |
| **375px** | iPhone SE / standard iPhone | 2-column grid, full-width carousel | Verified | Clean spacing, cart drawer fills screen cleanly. |
| **390px** | iPhone 12/13/14/15 | 2-column grid, comfortable tap targets | Verified | All buttons maintain ≥ 44px height. |
| **430px** | iPhone Pro Max / large mobile | 2-column grid, optimal reading line | Verified | Mockups scale without overflow. |
| **540px** | Large foldable / small tablet | **3-column compact grid** | Verified | **Crucial requirement**: At ~540px, 3 compact readable columns render seamlessly. |
| **600px** | Small tablet / Landscape mobile | 3-column grid | Verified | Balanced typography, readable specs. |
| **768px** | iPad Portrait / Medium tablet | 3-column grid, expanded navigation | Verified | Sub-nav bar fits without horizontal scroll bar. |
| **820px** | iPad Air | 3-column grid, side-by-side hero | Verified | Hero copy on left, realistic mockup on right. |
| **1024px** | iPad Pro / Small Laptop | 3-column grid, full search visible | Verified | Header search input expands to max-w-xl. |
| **1280px** | Standard Desktop / HD | 3-column grid, centered 7xl container | Verified | Maximum width capped at 1280px (`max-w-7xl`). |
| **1440px** | Large Desktop / MacBook Pro | Centered container, rich whitespace | Verified | High-density typography remains crisp. |
| **1920px** | Full HD Monitor | Centered layout, zero edge bleeding | Verified | Preserves background margins and centering. |

---

## 2. Core Responsive Design Rules
1. **No Horizontal Scroll**: `overflow-x: hidden` applied to `html` and `body`.
2. **Flexible Cards**: Using CSS Grid with responsive `minmax()` and explicit media queries at `540px`.
3. **Touch Targets**: All primary interactive buttons (Add to cart, Wishlist, Drawer close, Checkout, Carousel prev/next) have tap targets ≥ 40-44px.
4. **Header Height Clearance**: Header is fixed; `<main>` top padding scales dynamically (`pt-[148px]` mobile, `pt-[156px]` desktop) to prevent content occlusion.
