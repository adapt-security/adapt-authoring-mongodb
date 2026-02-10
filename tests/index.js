// Test runner entry point
import { run } from 'node:test'
import { spec as specReporter } from 'node:test/reporters'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const stream = run({
  files: [
    join(__dirname, 'MongoDBModule.spec.js'),
    join(__dirname, 'ObjectIdUtils.spec.js')
  ],
  concurrency: true
})

await pipeline(stream, specReporter(), process.stdout)
