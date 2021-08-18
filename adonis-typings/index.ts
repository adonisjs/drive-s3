/*
 * @adonisjs/drive-s3
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Drive' {
  import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3'

  /**
   * Configuration accepted by the s3 driver
   */
  export type S3DriverConfig = S3ClientConfig & {
    driver: 's3'
    visibility: Visibility
    bucket: string
    cdnUrl?: string
    key?: string
    secret?: string
  }

  /**
   * The S3 driver implementation interface
   */
  export interface S3DriverContract extends DriverContract {
    name: 's3'
    adapter: S3Client
  }
}
