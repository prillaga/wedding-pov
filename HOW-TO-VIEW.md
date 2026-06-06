# How to View Wedding POV

## If you see "Marshmallow" or a blank page

**Marshmallow = Cursor's preview.** It is NOT Wedding POV.

Do **not** use Cursor's built-in browser. Use **Safari** or **Chrome**.

---

## Easiest way to run the full app (Mac)

1. Open Finder → `wedding-pov` folder  
2. **Double-click `Start Wedding POV.command`**  
3. Safari opens automatically at the guest page and admin dashboard  

> **Note:** Port 3000 may be used by another app on your Mac. The launcher picks **3001** (or next free port).

---

## Offline demo (no Node.js)

1. Double-click **`WeddingPOV.html`** in Finder  
2. Opens in Safari — John & Jane hero + Join Event  

---

## Manual start (Terminal)

```bash
cd wedding-pov
npm install
npm run dev -- --port 3001
```

Open in **Safari** (not Cursor):

- Guest: http://localhost:3001/wedding/prillaga-wedding-2026  
- Admin: http://localhost:3001/dashboard  

---

## Live site (Vercel)

https://wedding-pov-two.vercel.app/wedding/prillaga-wedding-2026

*(May be behind local changes until latest code is pushed to GitHub.)*
