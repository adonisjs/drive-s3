/*
 * @adonisjs/drive-s3
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { S3Driver } from '../src/Drivers/S3'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class S3Provider {
  constructor(protected app: ApplicationContract) {}

  public boot() {
    this.app.container.withBindings(['Adonis/Core/Drive'], (Drive) => {
      Drive.extend('s3', (_, __, config) => {
        return new S3Driver(config)
      })
    })
  }
}
