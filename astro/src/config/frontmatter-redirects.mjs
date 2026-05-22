import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function normalizePath(value) {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return null;

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

function getListField(frontmatter, fieldName) {
  const lines = frontmatter.split(/\r?\n/);
  const values = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!new RegExp(`^${fieldName}:[\\t ]*$`).test(lines[i])) continue;

    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j];
      const itemMatch = line.match(/^\s*-\s+(.+)$/);

      if (itemMatch) {
        values.push(stripQuotes(itemMatch[1]));
        continue;
      }

      if (line.trim() === "" || line.trim().startsWith("#")) {
        continue;
      }

      break;
    }
  }

  return values;
}

function getFieldValues(frontmatter, fieldName) {
  const values = [];
  const scalar = getScalarField(frontmatter, fieldName);

  if (scalar) {
    if (scalar.startsWith("[") && scalar.endsWith("]")) {
      for (const value of scalar.slice(1, -1).split(",")) {
        const parsed = stripQuotes(value);
        if (parsed) values.push(parsed);
      }
    } else {
      values.push(scalar);
    }
  }

  values.push(...getListField(frontmatter, fieldName));
  return [...new Set(values)].filter(Boolean);
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

  const normalizedSlug = normalizePath(slugValue);

  if (normalizedSlug) {
    if (
      localePrefix &&
      normalizedSlug !== `/${localePrefix}` &&
      !normalizedSlug.startsWith(`/${localePrefix}/`)
    ) {
      return normalizePath(`/${localePrefix}${normalizedSlug}`);
    }

    return normalizedSlug;
  }

  if (segments[segments.length - 1] === "index") {
    segments.pop();
  }

  const joined = segments.join("/");
  const localePart = localePrefix ? `/${localePrefix}` : "";
  return normalizePath(`${localePart}/${joined}`);
}

function toAbsolutePath(input) {
  if (input instanceof URL) {
    return fileURLToPath(input);
  }

  return path.resolve(String(input));
}

export function collectFrontmatterRedirects({
  docsRoot,
  localePrefixes = ["da"],
  redirectFields = ["redirect-from", "redirectFrom"],
  onConflict,
} = {}) {
  const resolvedDocsRoot = docsRoot
    ? toAbsolutePath(docsRoot)
    : toAbsolutePath(new URL("../content/docs", import.meta.url));

  const localePrefixSet = new Set(localePrefixes);
  const redirects = {};

  for (const filePath of walkDocsFiles(resolvedDocsRoot)) {
    const content = readFileSync(filePath, "utf8");
    const frontmatter = getFrontmatter(content);
    if (!frontmatter) continue;

    const slugValue = getScalarField(frontmatter, "slug");
    const target = routeFromFile(
      filePath,
      resolvedDocsRoot,
      localePrefixSet,
      slugValue,
    );
    if (!target) continue;

    const redirectFromValues = redirectFields.flatMap((field) =>
      getFieldValues(frontmatter, field),
    );

    for (const sourceValue of redirectFromValues) {
      const source = normalizePath(sourceValue);
      if (!source || source === target) continue;

      if (redirects[source] && redirects[source] !== target) {
        if (onConflict) {
          onConflict({
            source,
            existing: redirects[source],
            incoming: target,
            filePath,
          });
        }
        continue;
      }

      redirects[source] = target;
    }
  }

  return redirects;
}
