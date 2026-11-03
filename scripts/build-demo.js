// Ship byte-identical pure engine modules for the standalone docs static site.
import fs from 'node:fs'
export const RUNTIME_MODULES = ['engine', 'patterns', 'clinical-patterns', 'names', 'topics', 'profiles', 'send-guard', 'scan', 'shapes', 'grammar', 'lexicon', 'lexicon-data', 'text-fold']
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  fs.mkdirSync(new URL('../docs/runtime/', import.meta.url), { recursive: true })
  for (const name of RUNTIME_MODULES) fs.copyFileSync(new URL(`../src/${name}.js`, import.meta.url), new URL(`../docs/runtime/${name}.js`, import.meta.url))
  fs.copyFileSync(new URL('../eval/comparison.md', import.meta.url), new URL('../docs/comparison.md', import.meta.url))
  fs.copyFileSync(new URL('../eval/score.js', import.meta.url), new URL('../docs/runtime/score.js', import.meta.url))
  fs.copyFileSync(new URL('../eval/comparison.json', import.meta.url), new URL('../docs/comparison.json', import.meta.url))
}
