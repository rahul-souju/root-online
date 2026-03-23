import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'site_access'

export function middleware(request: NextRequest) {
  // Always allow the auth endpoint and static assets through
  const { pathname } = request.nextUrl
  if (pathname === '/api/site-auth') return NextResponse.next()

  const cookie = request.cookies.get(COOKIE_NAME)
  const sitePassword = process.env.SITE_PASSWORD
  if (sitePassword && cookie?.value === sitePassword) return NextResponse.next()

  // Block — return inline password gate (no redirect, so the URL stays clean)
  return new NextResponse(passwordGateHtml(request.url), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

function passwordGateHtml(returnTo: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Root Online</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #1a3a2a;
      font-family: Georgia, serif;
      color: #e8d5b0;
    }
    .card {
      background: #0f2318;
      border: 1px solid #2D6A4F;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 360px;
      text-align: center;
    }
    h1 { font-size: 2rem; color: #D4A848; margin-bottom: 0.25rem; }
    p  { font-size: 0.875rem; color: #9ab; margin-bottom: 1.75rem; font-style: italic; }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #2D6A4F;
      background: #132b1e;
      color: #e8d5b0;
      font-size: 1rem;
      text-align: center;
      letter-spacing: 0.1em;
      outline: none;
      margin-bottom: 1rem;
    }
    input::placeholder { color: #4a7a5a; letter-spacing: normal; }
    input:focus { border-color: #D4A848; }
    button {
      width: 100%;
      padding: 0.75rem;
      border-radius: 8px;
      border: none;
      background: #D4A848;
      color: #0f2318;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
    }
    button:hover { background: #e8bc55; }
    .error { color: #B5451B; font-size: 0.85rem; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Root Online</h1>
    <p>Private game — enter the access password</p>
    <form method="POST" action="/api/site-auth">
      <input type="hidden" name="returnTo" value="${returnTo}" />
      <input type="password" name="password" placeholder="Password" autofocus autocomplete="current-password" />
      <button type="submit">Enter</button>
      <div class="error" id="err"></div>
    </form>
  </div>
</body>
</html>`
}
