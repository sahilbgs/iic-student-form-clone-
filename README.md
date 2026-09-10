# GTU-ITR Student Registration Form — Zero-Downtime Same-URL Standby Clone

Yeh project **GTU-ITR R&D & IIC Portal** ke registration form ka **Zero-Downtime Standby Clone** hai.
Iska maqsad yeh hai ki:
> **Jab aapka main Linux server band/offline ho, tab bhi student jab EXACT SAME registration link (jaise `https://iic-gtu-itr.aceglory.in/posts/5/register`) par click kare, toh bina link badle yeh form open ho aur data Google Firebase Cloud mein store ho sake!**

---

## 🚀 Ye Kaise Kaam Karta Hai? (3-Layer Architecture)

```
[Student Browser]
       │
       ▼  (visits: https://iic-gtu-itr.aceglory.in/posts/5/register)
[Cloudflare Edge]
       │
  Server ON? ──────► YES ──► Local Linux Server (Normal Registration)
       │
       NO (Server Band / Error 521 / Tunnel Down)
       │
       └───────────► Cloudflare Worker intercepts error
                     Fetches Netlify Standby Form
                     Serves on EXACT SAME LINK! (URL does NOT change)
                     Data saves to Google Firebase Cloud!
```

---

## 🛠️ Step-by-Step Setup Guide

### STEP 1: Firebase Keys Daalein
1. [Firebase Console](https://console.firebase.google.com/) par jayein.
2. Naya project banayein ya existing choose karein.
3. **Firestore Database** enable karein (Start in Test mode ya Production mode).
4. **Web App** banakar credentials lein.
5. [`firebase-config.js`](firebase-config.js) file mein paste karein (ya chat mein bhej dein).

### STEP 2: Netlify Pe Deploy Karein
1. [app.netlify.com/drop](https://app.netlify.com/drop) open karein.
2. Is pooray `student-registration-clone` folder ko drag-and-drop karein.
3. Netlify aapko ek URL dega (e.g., `https://gtu-itr-registration.netlify.app`).

### STEP 3: Same Link Failover Activate Karein (Cloudflare Worker)
Aapka domain `aceglory.in` pehle se Cloudflare Tunnel se connected hai. Ab jab server band ho tab same link pe chalane ke liye:

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) open karein.
2. Left menu se **Workers & Pages** par click karein -> **Create Application** -> **Create Worker**.
3. Worker ka naam rakhein (e.g. `gtu-reg-failover`).
4. **Edit Code** par click karein aur [`cloudflare-worker.js`](cloudflare-worker.js) ka code wahan paste kar dein.
5. Code mein line 13 par apna Netlify URL daal dein:
   ```javascript
   const NETLIFY_SITE_URL = "https://your-site.netlify.app";
   ```
6. **Deploy** par click karein.
7. Worker ke **Settings > Triggers > Routes** par jayein:
   - **Add route** click karein.
   - Route: `*iic-gtu-itr.aceglory.in/posts/*/register*`
   - Zone: `aceglory.in`
   - Save karein!

---

## 🎯 Result
- **Jab Server Chalu Hai:** Student ko main server ka registration form dikhega.
- **Jab Server Band Hai:** Student jab bhi `https://iic-gtu-itr.aceglory.in/posts/.../register` kholega:
  - Koi Cloudflare error nahi aayega!
  - Wahi link khulega aur ye standby form dikhega!
  - Activity ID automatically URL se detect ho jayegi!
  - Data seedha Firebase Cloud mein store ho jayega!
