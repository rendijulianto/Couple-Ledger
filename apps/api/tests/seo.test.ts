import { describe, it, expect } from "bun:test";
import { app } from "../src/index";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("Technical SEO, Indexability & Security Tests", () => {
  it("GET /health sets X-Robots-Tag: noindex, nofollow to shield internal APIs", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("GET /workspaces endpoint sets X-Robots-Tag to prevent search indexing", async () => {
    const res = await app.handle(new Request("http://localhost/workspaces"));
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("GET /transactions endpoint sets X-Robots-Tag to prevent search indexing", async () => {
    const res = await app.handle(new Request("http://localhost/transactions"));
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("robots.txt exists in public directory and contains valid crawl rules", () => {
    const robotsPath = resolve(__dirname, "../../web/public/robots.txt");
    expect(existsSync(robotsPath)).toBe(true);

    const content = readFileSync(robotsPath, "utf-8");
    expect(content).toContain("User-agent: *");
    expect(content).toContain("Allow: /");
    expect(content).toContain("Disallow: /workspaces/");
    expect(content).toContain("Disallow: /transactions/");
    expect(content).toContain("Disallow: /auth/");
    expect(content).toContain("Sitemap: https://cash-book.my.id/sitemap.xml");
  });

  it("sitemap.xml exists in public directory and contains valid XML with indexable canonical URLs", () => {
    const sitemapPath = resolve(__dirname, "../../web/public/sitemap.xml");
    expect(existsSync(sitemapPath)).toBe(true);

    const content = readFileSync(sitemapPath, "utf-8");
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain("<urlset");
    expect(content).toContain("<loc>https://cash-book.my.id/</loc>");
    expect(content).toContain("<loc>https://cash-book.my.id/masuk</loc>");
    expect(content).toContain("<loc>https://cash-book.my.id/daftar</loc>");
    expect(content).toContain("<loc>https://cash-book.my.id/kebijakan-privasi</loc>");
    expect(content).toContain("<loc>https://cash-book.my.id/syarat-ketentuan</loc>");
    expect(content).toContain("<loc>https://cash-book.my.id/tentang</loc>");
    expect(content).not.toContain("/workspaces");
    expect(content).not.toContain("/transactions");
    expect(content).not.toContain("/auth/");
  });

  it("index.html contains valid primary metadata, canonical tag, Open Graph, and Twitter Cards", () => {
    const indexPath = resolve(__dirname, "../../web/index.html");
    expect(existsSync(indexPath)).toBe(true);

    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<link rel="canonical" href="https://cash-book.my.id/"');
    expect(html).toContain("<title>Cash-book.my.id — Catat Keuangan Bersama Pasangan dengan Lebih Transparan</title>");
    expect(html).toContain('name="description"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:url" content="https://cash-book.my.id/"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("index.html contains valid Schema.org JSON-LD structured data for WebSite, WebApplication, and FAQPage", () => {
    const indexPath = resolve(__dirname, "../../web/index.html");
    const html = readFileSync(indexPath, "utf-8");

    // Extract all JSON-LD scripts
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    const matches = [...html.matchAll(jsonLdRegex)];
    expect(matches.length).toBeGreaterThanOrEqual(3);

    const schemas = matches.map((m) => JSON.parse((m[1] ?? "").trim()));
    const types = schemas.map((s) => s["@type"]);

    expect(types).toContain("WebSite");
    expect(types).toContain("WebApplication");
    expect(types).toContain("FAQPage");

    const webAppSchema = schemas.find((s) => s["@type"] === "WebApplication");
    expect(webAppSchema?.name).toContain("Cash-book.my.id");
    expect(webAppSchema?.applicationCategory).toBe("FinanceApplication");
    expect(Array.isArray(webAppSchema?.featureList)).toBe(true);

    const faqSchema = schemas.find((s) => s["@type"] === "FAQPage");
    expect(Array.isArray(faqSchema?.mainEntity)).toBe(true);
    expect(faqSchema?.mainEntity.length).toBeGreaterThan(0);
  });

  it("index.html contains prerendered semantic HTML content for search crawlers", () => {
    const indexPath = resolve(__dirname, "../../web/index.html");
    const html = readFileSync(indexPath, "utf-8");

    expect(html).toContain("<header");
    expect(html).toContain("<h1");
    expect(html).toContain("Catat Keuangan Bersama Pasangan dengan Lebih Transparan");
    expect(html).toContain("<h2");
    expect(html).toContain("href=\"/daftar\"");
    expect(html).toContain("href=\"/masuk\"");
    expect(html).toContain("href=\"/kebijakan-privasi\"");
    expect(html).toContain("href=\"/syarat-ketentuan\"");
    expect(html).toContain("href=\"/tentang\"");
  });

  it("app server serves /robots.txt with correct Content-Type and directives", async () => {
    const res = await app.handle(new Request("http://localhost/robots.txt"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("Content-Type") || "";
    expect(contentType).toContain("text/plain");
    const text = await res.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Sitemap: https://cash-book.my.id/sitemap.xml");
  });

  it("app server serves /sitemap.xml with correct Content-Type and XML content", async () => {
    const res = await app.handle(new Request("http://localhost/sitemap.xml"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("Content-Type") || "";
    expect(contentType).toContain("xml");
    const text = await res.text();
    expect(text).toContain("<urlset");
    expect(text).toContain("<loc>https://cash-book.my.id/</loc>");
  });

  it("app server serves / with prerendered HTML and 200 OK", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("Content-Type") || "";
    expect(contentType).toContain("text/html");
    const text = await res.text();
    expect(text).toContain("Catat Keuangan Bersama Pasangan");
  });
});
