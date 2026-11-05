# Site photography

1. Put real, properly licensed photos in this folder.
2. Register each one in `client/src/data/site.js` → `photos`, for example:

```js
export const photos = {
  hero: '/images/hero-worship.jpg',
  welcome: '/images/welcome.jpg',
  'ministry-youth': '/images/ministry-youth.jpg',
};
```

Any key that is not registered shows a designed placeholder, so the site never shows a broken image.

| Key                 | Where it appears                           | Suggested size |
| ------------------- | ------------------------------------------ | -------------- |
| `hero`              | Home page hero (worship / fellowship)      | 2400 × 1400    |
| `welcome`           | Home page "Welcome" section                | 1200 × 1500    |
| `about-history`     | About page – our story                     | 1400 × 1000    |
| `give-hero`         | Give page header                           | 2400 × 1200    |
| `ministry-<id>`     | Ministries (ids are in `site.js`)          | 1200 × 900     |
| `leader-<n>`        | Leadership cards (1–4)                     | 800 × 1000     |
| `outreach-<n>`      | Home page outreach highlights (1–3)        | 1200 × 900     |

Product and event photos are uploaded from the admin dashboard instead.
