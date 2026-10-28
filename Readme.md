<div align="center">

# 🖼️ Wallpaper — Free Wallpaper Gallery + Image Library

**Browse, preview and download wallpapers instantly. The gallery and the images live together in one repo.**

[![Live](https://img.shields.io/badge/Live-wallpaper.wondermayank.in-573AFC?style=for-the-badge)](https://wallpaper.wondermayank.in/)
[![Mirror](https://img.shields.io/badge/Mirror-GitHub%20Pages-181717?style=for-the-badge&logo=github)](https://wondermayank.github.io/wallpaper/)
![Vanilla JS](https://img.shields.io/badge/Built%20with-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![Stars](https://img.shields.io/github/stars/wondermayank/wallpaper?style=for-the-badge)

[🌐 Open Gallery](https://wallpaper.wondermayank.in/) · [🐛 Report Issue](https://github.com/wondermayank/wallpaper/issues) · [🧑‍💻 About the creator](#-about-the-creator)

</div>

---

## 📖 About

**Wallpaper** is the full, self-contained version of the gallery: a fast **vanilla JavaScript** site **plus the wallpaper image folders themselves**. Everything is in one repo, so there is no external image host to set up — clone it, run it, deploy it.

It is the sibling of [**Aero**](https://github.com/wondermayank/aero), which contains only the gallery code. Use **Aero** if you want just the site and your own image hosting; use **Wallpaper** if you want the site *and* the images together.

🔗 **Live:** https://wallpaper.wondermayank.in/ · Mirror: https://wondermayank.github.io/wallpaper/

---

## ✨ Features

| | Feature | Details |
|---|---|---|
| ⚡ | **Fast and light** | No framework, no build step |
| 🗃️ | **Client-side database** | Wallpapers are listed in `database.js` — no server needed to browse |
| 🛠️ | **Database generator** | `generate_db.js` rebuilds the list from your image folders |
| 📦 | **Images included** | Anime and general wallpaper collections live inside the repo |
| 📱 | **Responsive grid** | Works on phones, tablets and desktops |
| ⬇️ | **Instant downloads** | One click to save a wallpaper |
| 🔍 | **SEO / AEO / GEO ready** | `sitemap.xml`, `robots.txt`, `humans.txt` and `llm.txt` included |
| 🆓 | **Free** | No account, no ads |

---

## 🗂️ Project Structure

```
wallpaper/
├── Anime-Wallpapers-main/      anime wallpaper collection
├── AnimeBackgrounds-master/    anime background collection
├── Wallpapers-main/            general wallpaper collection
├── index.html                  page structure and meta tags
├── style.css                   styling and responsive grid
├── app.js                      gallery logic: rendering, interactions, downloads
├── database.js                 client-side wallpaper database
├── generate_db.js              script that (re)builds database.js from the image folders
├── server.js                   simple local server for development
├── sitemap.xml                 search engine sitemap
├── robots.txt                  crawler rules
├── humans.txt                  credits for the humans behind the site
└── llm.txt                     site summary for AI assistants
```

---

## ▶️ Run Locally

```bash
git clone https://github.com/wondermayank/wallpaper.git
cd wallpaper
```

**Option A — open directly:** open `index.html` in your browser, or use **Live Server** in VS Code.

**Option B — local server** (needs [Node.js](https://nodejs.org)):

```bash
node server.js
```

Then open the address it prints in the terminal.

> 💡 The repo contains many images, so the first clone can take a while. For a faster download use `git clone --depth 1`.

---

## ➕ Adding Wallpapers

1. Drop your images into one of the wallpaper folders (or make a new folder)
2. Rebuild the database:

```bash
node generate_db.js
```

3. Refresh the site, check that your images appear, then commit and push

Tips:
- Use high-resolution images (1920×1080 or larger)
- Keep file names clean (no strange characters)
- Optimise big files — smaller images load faster and keep the repo light

---

## 🚀 Deploy (Free)

The whole site is static, so any free host works:

| Host | Steps |
|---|---|
| **GitHub Pages** | Settings → Pages → Deploy from `main` branch |
| **Cloudflare Pages** | Connect repo → no build command → output directory `/` |
| **Vercel** | Import repo → framework preset **Other** |
| **Netlify** | Import repo → no build command → publish directory `/` |

### Custom domain
1. Add `wallpaper.wondermayank.in` in your host's **Domains** settings
2. Create the `CNAME` record it shows at your DNS provider
3. Wait for HTTPS to turn on

---

## 🔍 SEO, AEO & GEO

This repo ships with the files that help people *and* AI find the site:

- `sitemap.xml` — lists pages for search engines
- `robots.txt` — tells crawlers what to index
- `llm.txt` — a plain-language summary for AI assistants
- `humans.txt` — who built the site

After adding new pages, remember to update `sitemap.xml`.

---

## 🧑‍💻 About the Creator

Hi, I'm **Thunder** (online as **Wondermayank**) — a student developer from India.

I build free educational web platforms, tools and Telegram bots for students under the **ThunderStudy** and **Wondermayank** brands, and I love clean, modern UI design.

- 🌐 Portfolio: [wondermayank.github.io](https://wondermayank.github.io)
- 📚 ThunderStudy: [commercesehoga.github.io](https://commercesehoga.github.io)
- 🛠️ Free web-dev guide: [make.wondermayank.in](https://make.wondermayank.in)
- 🖼️ Gallery code only: [Aero](https://github.com/wondermayank/aero)
- 🐙 GitHub: [@wondermayank](https://github.com/wondermayank)

---

## ❓ FAQ

**Is it free?** Yes. No signup, no payment.

**What is the difference between Wallpaper and Aero?** Aero is the gallery code only. Wallpaper is the same gallery *with* the images included.

**Do I need to install anything?** No. Open `index.html`. Node.js is only needed for `server.js` and `generate_db.js`.

**How do I add my own wallpapers?** Add images to a folder, run `node generate_db.js`, then push.

---

## ⚖️ Credits & Image Licensing

The wallpaper collections come from various artists and sources. They are shared here for personal use as wallpapers. All rights remain with the original creators.

If you are a creator and want an image credited or removed, please [open an issue](https://github.com/wondermayank/wallpaper/issues) and it will be handled quickly. Only add images you own or that are licensed for free use.

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b add-wallpapers`
3. Add wallpapers or improve the code
4. Run `node generate_db.js` if you added images
5. Open a Pull Request

---

<div align="center">

Made with ⚡ by **Thunder** ([@wondermayank](https://github.com/wondermayank))

If you like this gallery, drop a ⭐

</div>
