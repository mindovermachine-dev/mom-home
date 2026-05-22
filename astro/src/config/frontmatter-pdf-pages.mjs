import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function normalizePathname(value) {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withoutHash = trimmed.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  if (!withoutQuery) return null;

  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, "/");

  if (collapsed !== "/" && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getFrontmatter(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return "";

  const startOffset = content.startsWith("---\r\n") ? 5 : 4;
  const endMarker = content.indexOf("\n---", startOffset);
  if (endMarker === -1) return "";

  return content.slice(startOffset, endMarker);
}

function getScalarField(frontmatter, fieldName) {
  const pattern = new RegExp(`^${fieldName}:[\\t ]*(.+)$`, "m");
  const match = frontmatter.match(pattern);
  if (!match) return null;

  return stripQuotes(match[1]);
}

function getBooleanField(frontmatter, fieldName) {
  const value = getScalarField(frontmatter, fieldName);
  if (!value) return null;

  const normalized = value.toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function walkDocsFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_")) continue;

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDocsFiles(absolutePath));
      continue;
    }

    if (/\.(md|mdx|mdoc)$/i.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function routeFromFile(filePath, docsRoot, localePrefixes, slugValue) {
  const relative = path.relative(docsRoot, filePath).split(path.sep).join("/");
  const withoutExtension = relative.replace(/\.(md|mdx|mdoc)$/i, "");
  const segments = withoutExtension.split("/");

  let localePrefix = "";
  if (segments[0] && localePrefixes.has(segments[0])) {
    localePrefix = segments.shift();
  }

  if (segments.some((segment) => segment.startsWith("_"))) {
    return null;
  }

  const normalizedSlug = normalizePathname(slugValue);

  if (normalizedSlug) {
    if (
      localePrefix &&
      normalizedSlug !== `/${localePrefix}` &&
      !normalizedSlug.startsWith(`/${localePrefix}/`)
    ) {
      return normalizePathname(`/${localePrefix}${normalizedSlug}`);
    }

    return normalizedSlug;
  }

  if (segments[segments.length - 1] === "index") {
    segments.pop();
  }

  const joined = segments.join("/");
  const localePart = localePrefix ? `/${localePrefix}` : "";
  return normalizePathname(`${localePart}/${joined}`);
}

function toAbsolutePath(input) {
  if (input instanceof URL) {
    return fileURLToPath(input);
  }

  return path.resolve(String(input));
}

export function collectFrontmatterPdfPages({
  docsRoot,
  localePrefixes = ["da"],
  pdfField = "pdf",
} = {}) {
  const resolvedDocsRoot = docsRoot
    ? toAbsolutePath(docsRoot)
    : toAbsolutePath(new URL("../content/docs", import.meta.url));

  const localePrefixSet = new Set(localePrefixes);
  const pages = new Set();

  for (const filePath of walkDocsFiles(resolvedDocsRoot)) {
    const content = readFileSync(filePath, "utf8");
    const frontmatter = getFrontmatter(content);
    if (!frontmatter) continue;

    const shouldRenderPdf = getBooleanField(frontmatter, pdfField);
    if (!shouldRenderPdf) continue;

    const slugValue = getScalarField(frontmatter, "slug");
    const route = routeFromFile(
      filePath,
      resolvedDocsRoot,
      localePrefixSet,
      slugValue,
    );
    const normalizedRoute = normalizePathname(route);

    if (normalizedRoute) {
      pages.add(normalizedRoute);
    }
  }

  return [...pages];
}
