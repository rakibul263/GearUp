import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const distDir = path.resolve("dist");

const candidates = (target) => [
  target,
  `${target}.js`,
  path.join(target, "index.js"),
];

const resolveSpecifier = async (fromFile, spec) => {
  const base = path.resolve(path.dirname(fromFile), spec);

  for (const candidate of candidates(base)) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) {
        const rel = path.relative(path.dirname(fromFile), candidate);
        return rel.startsWith(".") ? rel : `./${rel}`;
      }
    } catch {
      // keep looking
    }
  }

  return null;
};

const fixFile = async (file) => {
  const original = await readFile(file, "utf8");
  const pattern = /(from\s*|import\s*\(\s*|import\s+|export\s+)(["'])(\.\.?\/[^"']+)\2/g;

  const replacements = await Promise.all(
    [...original.matchAll(pattern)].map(async (match) => {
      const spec = match[3];
      if (spec.endsWith(".js") || spec.endsWith(".json") || spec.endsWith(".node")) {
        return null;
      }

      const fixed = await resolveSpecifier(file, spec);
      if (!fixed) {
        console.warn(`  ! could not resolve "${spec}" in ${path.relative(process.cwd(), file)}`);
        return null;
      }

      return [match[0], `${match[1]}${match[2]}${fixed}${match[2]}`];
    }),
  );

  let updated = original;
  for (const [from, to] of replacements.filter(Boolean)) {
    updated = updated.replace(from, to);
  }

  if (updated !== original) {
    await writeFile(file, updated);
    return true;
  }

  return false;
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(full);
    }
  }

  return files;
};

const files = await walk(distDir);
let fixed = 0;

for (const file of files) {
  if (await fixFile(file)) fixed += 1;
}

console.log(`ESM specifier fix: ${fixed}/${files.length} files updated`);
