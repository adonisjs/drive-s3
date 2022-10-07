/*
 * @adonisjs/drive-s3
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/core/build/standalone'

export const fs = new Filesystem(join(__dirname, '__app'))

/**
 * Setup adonisjs application
 */
export async function setupApplication(options?: { autoProcessMultipartFiles?: boolean }) {
  const app = new Application(fs.basePath, 'web', {
    providers: ['@adonisjs/core'],
  })

  await fs.add(
    'config/app.ts',
    `export default {
        appKey: 'asecurerandomsecretkey',
        http: {
          cookie: {},
          trustProxy: () => true
        }
      }`
  )

  await fs.add(
    'config/bodyparser.ts',
    `export default {
      whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
      multipart: {
        autoProcess: ${options?.autoProcessMultipartFiles || false},
        processManually: [],
        types: [
          'multipart/form-data',
        ],
      }
    }`
  )

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}
