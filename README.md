# YouTube View Simulation Lab

A static, transparent analytics sandbox for video `vv6Cn16scjU`. Simulated values exist only in the browser and are never sent to YouTube. The official YouTube Data API is used read-only for genuine public view counts when the visitor supplies an API key.

## Local use

Open `index.html` or serve this directory with any static web server. No build step or dependencies are required.

## Genuine public count

Create a YouTube Data API v3 key in Google Cloud and enable the YouTube Data API v3 for its project. Paste the key into the page to retrieve `statistics.viewCount` for this video. The key is held in this browser's session storage and sent to Google only for the YouTube Data API request; this site has no server-side key storage. Restrict the key to the YouTube Data API and, where practical, to your website referrer. Without a key, the genuine view count is shown as unavailable. YouTube may apply API quotas or omit counts.

## Safety and interpretation

- The embedded video is the official YouTube player; this app does not automate playback.
- Simulated views are local demonstration values. No bots, proxy rotation, fake accounts, or artificial engagement are used.
- Genuine and simulated values are shown separately. Any later change in the real public count does not establish that this simulator caused it.
- Before/after counts can be recorded by refreshing the genuine count before and after a demonstration; comparison is observational only.

## Deployment

GitHub Actions workflow `.github/workflows/pages.yml` deploys this static site to GitHub Pages on pushes to `main`. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source if it is not selected automatically.
