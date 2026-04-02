# TradeNest Frontend

## IMPORTANT — Start backend FIRST, then frontend

### Step 1 — Spring Boot backend (port 9000)
```
cd tradenest-api
mvn spring-boot:run
```

Make sure your `src/main/resources/application.properties` has:
```
server.port=9000
app.upload.dir=uploads
app.jwt.secret=tradenest-secret-key-minimum-32-chars-long-1234
app.jwt.expiration-ms=86400000
```

### Step 2 — React frontend
```
cd tradenest
npm install
npm run dev
```

Open: http://localhost:5173

---

## Demo accounts (seeded by backend DataInitializer)

| Email            | Password    |
|------------------|-------------|
| seller1@tn.com   | password123 |
| seller2@tn.com   | password123 |
| seller3@tn.com   | password123 |

---

## What was fixed (from screenshots)

1. **Empty categories & listings** — API calls now use Vite proxy (/api → localhost:9000).
   HomePage shows a red error banner + Retry button if backend is unreachable.

2. **City dropdown empty on Register** — Cities load from /api/cities. If the backend is
   down, 8 fallback cities (Mumbai, Delhi, etc.) are shown so registration still works.

3. **No images** — Images use http://localhost:9000/uploads/{filename} directly.
   Every <img> has an onError handler that falls back to a category-matched Unsplash photo.

4. **Wishlist not working** — Toggle now waits for API success before updating UI.
   Per-product loading state prevents duplicate requests.

5. **Offers not working** — Accept/Reject properly calls PUT /api/offers/{id}/accept|reject.

---

## Architecture

```
src/
  api/index.js          All API calls via /api proxy + image helpers
  context/
    AuthContext.jsx     JWT auth, token verify on mount, auto-logout on 401
    WishlistContext.jsx API-confirmed toggle, live badge count in navbar
  components/
    ProductCard.jsx     Real images + onError fallback + wishlist heart
    layout/Navbar.jsx   Pre/post login, categories dropdown, wishlist badge
  pages/
    HomePage.jsx        Hero + categories + featured + latest + error banner
    ProductDetailPage   Gallery + chat/offer buttons + reviews
    RegisterPage        City dropdown from API with hardcoded fallback
    SellPage            4-step form: category → details → photos → price
    ChatPage            Conversations + 5s message polling
    OffersPage          Received/sent tabs + accept/reject
    WishlistPage        Saved items with remove
    DashboardPage       Stats from /api/dashboard
    MyListingsPage      Edit/delete own listings
