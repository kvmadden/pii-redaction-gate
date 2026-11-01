// Ship byte-identical pure engine modules for a standalone docs static site.
import fs from 'node:fs'
const modules = ['engine','patterns','clinical-patterns','names','topics','profiles','send-guard']
fs.mkdirSync(new URL('../docs/runtime/',import.meta.url),{recursive:true})
for (const name of modules) fs.copyFileSync(new URL(`../src/${name}.js`,import.meta.url),new URL(`../docs/runtime/${name}.js`,import.meta.url))
fs.copyFileSync(new URL('../eval/comparison.md',import.meta.url),new URL('../docs/comparison.md',import.meta.url))
fs.copyFileSync(new URL('../eval/score.js',import.meta.url),new URL('../docs/runtime/score.js',import.meta.url))

fs.copyFileSync(new URL('../eval/comparison.json',import.meta.url),new URL('../docs/comparison.json',import.meta.url))
