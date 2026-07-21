# SPA routing (nginx)

This CRA app uses client-side routes (`/services`, `/pricing`, `/work`, etc.).
The production nginx config must fall back to `index.html` for unknown paths, for example:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Without this, refreshing a deep link will return 404 from the server.
