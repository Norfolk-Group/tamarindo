import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";

/** Recall output-media page. Hosted on the Nico Worker, not OpenNext. */
export function meetingAvatarHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nico — meeting</title>
    <style>
      html, body { margin: 0; height: 100%; background: #1E2D45; color: #f5f7fa; font-family: Geist, system-ui, sans-serif; }
      main { min-height: 100%; display: grid; place-items: center; text-align: center; padding: 2rem; }
      .orb { width: 96px; height: 96px; margin: 0 auto 1.25rem; border-radius: 999px; background: radial-gradient(circle at 30% 30%, #00BCD4, #0097A7 60%, #1E2D45); }
      p { max-width: 28rem; margin: 0.35rem auto; line-height: 1.45; }
    </style>
  </head>
  <body>
    <main>
      <div class="orb" aria-hidden="true"></div>
      <p><strong>Nico</strong></p>
      <p>${NICO_AI_DISCLOSURE}</p>
    </main>
  </body>
</html>`;
}
