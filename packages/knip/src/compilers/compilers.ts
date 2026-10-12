import type { CompilerSync } from './types.ts';

// Fenced code block: an opening fence of 3+ backticks (info string without backticks) or tildes at the start of a line,
// up to a closing fence of the same character that is at least as long, or the end of the text (CommonMark)
export const fencedCodeBlockMatcher =
  /^[ \t]*(([`~])\2{2,})(?:(?<=`)[^`\n]*|(?<=~)[^\n]*)$(?:[\s\S]*?^[ \t]*\1\2*[ \t]*\r?$|[\s\S]*)/gm;
// Code span: a run of backticks up to a run of the same length, not across a blank line (CommonMark)
export const inlineCodeMatcher = /(?<!`)(`+)(?!`)(?:(?!\n[ \t]*\r?\n)[\s\S])*?(?<!`)\1(?!`)/g;

// Match <script> blocks, capturing attributes (1) and body (2).
// Tag-attribute scan allows `>` inside quoted attribute values (e.g. Vue `generic="T extends F<X>"`).
export const scriptExtractor = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)(?<!\/)>([\s\S]*?)<\/script>/gi;
export const styleExtractor = /<style\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/style>/gi;
const langAttrMatcher = /\blang\s*=\s*["']([^"']+)["']/i;
export const blockCommentMatcher = /\/\*[\s\S]*?\*\//g;
export const lineCommentMatcher = /^[ \t]*\/\/.*$/gm;
export const importMatcher =
  /(?<![.\w$#])import\b(?!\s*\.)(?:\s*\(\s*['"][^'"]+['"][^)]*\)|(?!\s*\()[^'"]+['"][^'"]+['"])/g;

export const collectImports: CompilerSync = text => {
  if (!text.includes('import')) return '';
  const imports: string[] = [];
  importMatcher.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = importMatcher.exec(text))) imports.push(match[0]);
  return imports.join('\n');
};

export const importsWithinScripts: CompilerSync = (text: string) => {
  const scripts = [];
  scriptExtractor.lastIndex = 0;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptExtractor.exec(text))) {
    const scriptBody = scriptMatch[2];
    const body = scriptBody.replace(blockCommentMatcher, '').replace(lineCommentMatcher, '');
    let importMatch: RegExpExecArray | null;
    importMatcher.lastIndex = 0;
    while ((importMatch = importMatcher.exec(body))) scripts.push(importMatch[0]);
  }
  return scripts.join(';\n');
};

export const scriptBodies: CompilerSync = (text: string) => {
  const scripts = [];
  scriptExtractor.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = scriptExtractor.exec(text))) {
    const body = match[2];
    if (body) scripts.push(body);
  }
  return scripts.join(';\n');
};

export const getStyleLang = (attrs: string) => attrs.match(langAttrMatcher)?.[1]?.toLowerCase();

// Extract paths as imports from frontmatter for given keys (e.g., 'layout')
export const frontmatterMatcher = /^---\r?\n([\s\S]*?)\r?\n---/;
export const importsWithinFrontmatter = (text: string, keys: string[] = []) => {
  const frontmatter = text.match(frontmatterMatcher)?.[1];
  if (!frontmatter) return '';

  const imports = keys.flatMap(key => {
    const valueMatcher = new RegExp(`${key}:\\s*["']([^"']+)["']`, 'i');
    const match = frontmatter.match(valueMatcher);
    return match?.[1] ? [`import ${key} from "${match[1]}";`] : [];
  });
  return imports.join('\n');
};
