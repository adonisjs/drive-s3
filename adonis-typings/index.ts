/*
 * @adonisjs/drive-s3
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Drive' {
  import {
    S3Client,
    S3ClientConfig,
    CommonPrefix,
    ListObjectsV2CommandOutput,
  } from '@aws-sdk/client-s3'

  /**
   * Configuration accepted by the s3 driver
   */
  export type S3DriverConfig = S3ClientConfig & {
    driver: 's3'
    visibility?: Visibility
    bucket: string
    cdnUrl?: string
    key?: string
    secret?: string
    prefix?: string
  }

  /**
   * List item returned from local disk driver
   */
  export interface S3DriveListItem
    extends DriveListItem<
      Required<ListObjectsV2CommandOutput>['Contents'][number] | CommonPrefix
    > {}

  /**
   * The S3 driver implementation interface
   */
  export interface S3DriverContract extends DriverContract {
    name: 's3'
    adapter: S3Client

    /**
     * Returns a new instance of the s3 driver with a custom runtime
     * bucket
     */
    bucket(bucket: string): S3DriverContract

    /**
     * Return a listing directory iterator for given location.
     * @experimental
     */
    list(location: string): DirectoryListingContract<this, S3DriveListItem>
  }

  interface DriversList {
    s3: {
      implementation: S3DriverContract
      config: S3DriverConfig
    }
  }
}
