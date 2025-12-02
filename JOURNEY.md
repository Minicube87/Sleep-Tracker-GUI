# Sleep Tracker - The Development Journey

## From Zero to Production: A Junior Developer's Adventure

*A documentation of building a full-stack sleep tracking application from scratch, including all the roadblocks, facepalms, and "aha!" moments along the way.*

---

## The Initial Request

It all started with a simple idea:

> "I want a simple mobile website where I can quickly input my 6-7 Apple Watch sleep values on my phone and send them to ChatGPT for analysis."

Sounds easy, right? Famous last words.

---

## Chapter 1: The Beginning

### What I Wanted

- A mobile-friendly form to input sleep data
- Send data to OpenAI API for analysis
- Get back a nice biohacking-style sleep score

### What I Built (First Iteration)

- HTML form with input fields for:
  - Date
  - Total Sleep (hours + minutes)
  - Awake time
  - REM, Light, Deep sleep phases
  - Sleep time span (from - to)
- Basic CSS styling (mobile-first, dark gradient theme)
- Vanilla JavaScript (no frameworks, keeping it simple)

**First Lesson Learned:** Sometimes "simple" is the right approach. No React, no Vue, just plain HTML/CSS/JS.

---

## Chapter 2: The Backend Saga

### Challenge: How to Call OpenAI API?

**Problem:** You can't call OpenAI directly from the frontend (API key would be exposed).

**Solution:** Build a Node.js backend!

I created:

- `api/server.js` - Express server
- `api/analyze.js` - OpenAI integration

### The .env Drama

**What happened:** API key wasn't loading.

**Why:** We were running from `/api` folder, but `.env` was in root.

**The Fix:**

```javascript
require('dotenv').config({ 
    path: require('path').join(__dirname, '..', '.env') 
});
```

**Lesson:** Always check your paths. Relative paths can be tricky.

---

## Chapter 3: The Model Hunt

### What Models Did We Try?

1. `gpt-5-nano` - Doesn't exist (yet?)
2. `gpt-5-turbo` - Also not a thing
3. `gpt-4-turbo` - Winner!

**Cost Analysis:**

- ~$0.0007 per request
- Daily use: ~$0.002/month
- Not gonna break the bank!

---

## Chapter 4: Response Formatting Wars

### The Problem

OpenAI was returning JSON, but we wanted a nice formatted text analysis.

### The Solution

Custom system prompt with exact format specification:

```
You are a Sleep-Biohacking-Expert...
Always ANSWER in this FORMAT (no JSON!)
```

**Key Elements:**

- Raw data display
- Biohacker sleep score (0-50 points)
- Detailed analysis with emojis
- Improvement tips
- 9-day trend (if available)
- Bottom line summary

---

## Chapter 5: "Can I Run This 24/7?"

### The Question

> "Can I run this permanently without keeping my PC on?"

### The Answer

Raspberry Pi to the rescue!

### The Setup Journey

1. **pm2 for Process Management**

   ```bash
   npm install -g pm2
   pm2 start api/server.js --name sleep-tracker
   pm2 save
   pm2 startup
   ```

2. **GitHub Pages for Frontend**
   - Put frontend files in `/docs` folder
   - Enable GitHub Pages in repository settings
   - Free hosting, automatic HTTPS

3. **Architecture:**

   ```
   GitHub Pages (Frontend) → Raspberry Pi (Backend) → OpenAI API
   ```

---

## Chapter 6: The HTTPS Nightmare

### The Problem

This was the BIG one.

**Scenario:**

- Frontend on GitHub Pages = HTTPS (forced by GitHub)
- Backend on Raspberry Pi = HTTP

**Result:**

```
Mixed Content Error: The page was loaded over HTTPS, 
but requested an insecure resource 'http://...'
```

Browser says: "Nope. Not happening."

### Failed Attempts

1. **Just use HTTP?** - GitHub Pages forces HTTPS. No way around it.
2. **Let's Encrypt?** - Doesn't work with `.local` domains.

### The Solution: nginx Reverse Proxy

```
Browser (HTTPS) 
    → nginx (HTTPS, port 443) 
    → Node.js (HTTP, port 3000)
```

nginx handles the SSL termination with a self-signed certificate.

---

## Chapter 7: The IPv6 Trap

### What Happened

After setting up nginx, it still didn't work!

**Error Log:**

```
connect() failed (111: Connection refused) 
upstream: "http://[::1]:3000/"
```

### The Problem

`localhost` was resolving to `[::1]` (IPv6), but Node.js was only listening on IPv4.

### The Fix

Change nginx config from:
```nginx
proxy_pass http://localhost:3000;
```
to:
```nginx
proxy_pass http://127.0.0.1:3000;
```

**Lesson:** IPv4 vs IPv6 can bite you when you least expect it.

---

## Chapter 8: Firewall Facepalm

### Symptom

Everything works on Raspberry Pi:
```bash
curl -k https://127.0.0.1/  # Works!
```

But from PC:
```bash
curl -k https://192.168.178.34/  # Times out...
```

### The Cause
```bash
$ sudo ufw status
22/tcp    ALLOW
3000/tcp  ALLOW
# Where's 443?!
```

### The Fix
```bash
sudo ufw allow 443/tcp
```

**Lesson:** Always check the firewall. Always.

---

## Chapter 9: The Final Boss - Certificate Trust

### The Last Error

```
ERR_CERT_AUTHORITY_INVALID
```

Browser doesn't trust our self-signed certificate.

### The Solutions

1. Visit `https://192.168.178.34/` directly
2. Click "Advanced" → "Proceed anyway"
3. Now browser trusts the certificate for this session

### Why This Happens

Self-signed certificates aren't issued by a trusted Certificate Authority. Browser rightfully warns about this. For a local network application, this is acceptable.

---

## Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Phone                          │
│                    (or any Browser)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Pages (Frontend)                         │
│         https://minicube87.github.io/Sleep-Tracker-GUI      │
│                                                              │
│   • HTML Form (index.html)                                   │
│   • Styling (style.css)                                      │
│   • JavaScript Logic (app.js)                                │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS POST /api/analyze
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Raspberry Pi (Backend)                          │
│                  192.168.178.34                              │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  nginx (Port 443)                                    │   │
│   │  • SSL Termination (self-signed cert)               │   │
│   │  • Reverse Proxy                                    │   │
│   └─────────────────────┬───────────────────────────────┘   │
│                         │ HTTP localhost:3000               │
│                         ▼                                    │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Node.js + Express (Port 3000)                      │   │
│   │  • Rate Limiting (30 req/15 min)                    │   │
│   │  • CORS Headers                                     │   │
│   │  • Request Validation                               │   │
│   │  Managed by: pm2                                    │   │
│   └─────────────────────┬───────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS API Call
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenAI API                                │
│           (gpt-4-turbo model)                                │
│                                                              │
│   • Receives formatted sleep data                            │
│   • Returns biohacking-style analysis                        │
│   • Cost: ~$0.0007 per request                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Lessons Learned (TL;DR)

1. **Start simple** - Vanilla JS is often enough
2. **Paths matter** - Especially for `.env` files
3. **IPv4 vs IPv6** - Can cause mysterious "connection refused" errors
4. **HTTPS everywhere** - Mixed content is blocked by browsers
5. **Self-signed certs** - Work for local networks, need manual trust
6. **Check the firewall** - Before debugging for hours
7. **Cache is evil** - Hard refresh is your friend
8. **Rate limiting** - Protect your API (and wallet)
9. **pm2 is awesome** - For keeping Node.js alive
10. **nginx is powerful** - SSL termination, reverse proxy, all in one

---

## Technologies Used

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js 18+, Express.js |
| AI | OpenAI API (gpt-4-turbo) |
| Process Manager | pm2 |
| Reverse Proxy | nginx |
| SSL | Self-signed certificate (OpenSSL) |
| Hosting (Frontend) | GitHub Pages |
| Hosting (Backend) | Raspberry Pi |
| Version Control | Git, GitHub |

---

## Total Development Time

- Initial setup: ~2 hours
- Backend development: ~3 hours
- Raspberry Pi deployment: ~2 hours
- HTTPS/nginx debugging: ~4 hours (the real boss fight)
- Documentation: ~1 hour

**Total: ~12 hours** from "I have an idea" to "It works!"

---

*"The best code is the code that works. The second best is the code you understand."*

Happy tracking! 
