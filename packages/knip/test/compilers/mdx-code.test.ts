import assert from 'node:assert/strict';
import test from 'node:test';
import MDX from '../../src/compilers/mdx.ts';
import astroMdxCompiler from '../../src/plugins/astro/compiler-mdx.ts';

const compilers = [
  ['mdx', (text: string) => MDX.compiler(text)],
  ['astro mdx', (text: string) => astroMdxCompiler(text)],
] as const;

for (const [name, compile] of compilers) {
  test(`Code block with a longer fence around an example fence (${name})`, () => {
    const source = `import A from './a.js';

\`\`\`\`md
\`\`\`js
import { inner } from 'inner-module';
\`\`\`
\`\`\`\`

\`\`\`js
import { example } from 'example-module';
\`\`\`

import B from './b.js';
`;
    assert.equal(compile(source), "import A from './a.js'\nimport B from './b.js'");
  });

  test(`Triple backticks in a paragraph do not open a code block (${name})`, () => {
    const source = `import A from './a.js';

A code block starts with <code>\`\`\`</code> on its own line.

\`\`\`js
import { example } from 'example-module';
\`\`\`

import B from './b.js';
`;
    assert.equal(compile(source), "import A from './a.js'\nimport B from './b.js'");
  });

  test(`Code spans with triple backticks (${name})`, () => {
    const source = `import { Tabs, TabItem } from './tabs.js';

<Tabs>
	<TabItem label="npm">\`\`\`sh npm install pkg \`\`\`</TabItem>
	<TabItem label="pnpm">\`\`\`sh pnpm add pkg \`\`\`</TabItem>
</Tabs>

Use \`\`import x from 'y'\`\` or \`import z from 'w'\` in your code.

import B from './b.js';
`;
    assert.equal(compile(source), "import { Tabs, TabItem } from './tabs.js'\nimport B from './b.js'");
  });

  test(`Tilde fences and fences in list items (${name})`, () => {
    const source = `import A from './a.js';

1. Add the configuration:

   ~~~js
   import { tilde } from 'tilde-module';
   ~~~

2. Or this one:

   \`\`\`js
   import { indented } from 'indented-module';
   \`\`\`

import B from './b.js';
`;
    assert.equal(compile(source), "import A from './a.js'\nimport B from './b.js'");
  });

  test(`Code blocks in CRLF files (${name})`, () => {
    const source = [
      "import A from './a.js';",
      '',
      '````md',
      '```js',
      "import { inner } from 'inner-module';",
      '```',
      '````',
      '',
      "import B from './b.js';",
      '',
    ].join('\r\n');
    assert.equal(compile(source), "import A from './a.js'\nimport B from './b.js'");
  });

  test(`Unclosed code block runs to the end (${name})`, () => {
    const source = `import A from './a.js';

\`\`\`js
import { unclosed } from 'unclosed-module';
`;
    assert.equal(compile(source), "import A from './a.js'");
  });
}
