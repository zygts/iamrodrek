import type { Context, Config } from "@netlify/edge-functions";

export const config: Config = {
  path: "/",
};

function getPrimaryLang(header: string | null) {
  if (!header) return null;
  return header.split(",")[0].toLowerCase();
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // Si el usuario ya eligió idioma manualmente, respetarlo
  const pref = context.cookies.get("lang_pref");
  if (pref === "en") return Response.redirect(new URL("/en/", url), 302);
  if (pref === "es") return;

  const lang = getPrimaryLang(request.headers.get("accept-language"));

  if (lang && lang.startsWith("en")) {
    return Response.redirect(new URL("/en/", url), 302);
  }

  // default: español
  return;
};
