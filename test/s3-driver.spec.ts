/*
 * @adonisjs/drive-s3
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got from 'got'
import test from 'japa'
import dotenv from 'dotenv'
import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { HeadObjectCommand } from '@aws-sdk/client-s3'

import { S3Driver } from '../src/Drivers/S3'

const fs = new Filesystem(join(__dirname, '__app'))
dotenv.config()

const AWS_KEY = process.env.AWS_KEY!
const AWS_SECRET = process.env.AWS_SECRET!
const AWS_BUCKET = process.env.AWS_BUCKET!
const AWS_ENDPOINT = process.env.AWS_ENDPOINT!

test.group('S3 driver | put', () => {
  test('write file to the destination', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')
    await driver.getUrl('foo.txt')

    const contents = await driver.get('foo.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('write to nested path', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('bar/baz/foo.txt', 'hello world')

    const contents = await driver.get('bar/baz/foo.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('bar/baz/foo.txt')
  }).timeout(6000)

  test('overwrite destination when already exists', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('bar/baz/foo.txt', 'hello world')
    await driver.put('bar/baz/foo.txt', 'hi world')

    const contents = await driver.get('bar/baz/foo.txt')
    assert.equal(contents.toString(), 'hi world')

    await driver.delete('bar/baz/foo.txt')
  }).timeout(6000)

  test('set custom content-type for the file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', '{ "hello": "world" }', {
      contentType: 'application/json',
    })

    const response = await driver.adapter.send(
      new HeadObjectCommand({ Key: 'foo.txt', Bucket: AWS_BUCKET })
    )

    assert.equal(response.ContentType, 'application/json')
    await driver.delete('foo.txt')
  }).timeout(6000)
})

test.group('S3 driver | putStream', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('write file to the destination', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await fs.add('foo.txt', 'hello stream')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.putStream('foo.txt', stream)

    const contents = await driver.get('foo.txt')
    assert.equal(contents.toString(), 'hello stream')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('write to nested path', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await fs.add('foo.txt', 'hello stream')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.putStream('bar/baz/foo.txt', stream)

    const contents = await driver.get('bar/baz/foo.txt')
    assert.equal(contents.toString(), 'hello stream')

    await driver.delete('bar/baz/foo.txt')
  }).timeout(6000)

  test('overwrite destination when already exists', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await fs.add('foo.txt', 'hi stream')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.put('bar/baz/foo.txt', 'hello world')
    await driver.putStream('bar/baz/foo.txt', stream)

    const contents = await driver.get('bar/baz/foo.txt')
    assert.equal(contents.toString(), 'hi stream')

    await driver.delete('bar/baz/foo.txt')
  }).timeout(6000)

  test('set custom content-type for the file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await fs.add('foo.txt', '{ "hello": "world" }')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.putStream('foo.txt', stream, {
      contentType: 'application/json',
    })

    const response = await driver.adapter.send(
      new HeadObjectCommand({ Key: 'foo.txt', Bucket: AWS_BUCKET })
    )
    assert.equal(response.ContentType, 'application/json')

    await driver.delete('foo.txt')
  }).timeout(6000)
})

test.group('S3 driver | exists', () => {
  test('return true when a file exists', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('bar/baz/foo.txt', 'bar')
    assert.isTrue(await driver.exists('bar/baz/foo.txt'))

    await driver.delete('bar/baz/foo.txt')
  }).timeout(6000)

  test("return false when a file doesn't exists", async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    assert.isFalse(await driver.exists('foo.txt'))
  }).timeout(6000)

  test("return false when a file parent directory doesn't exists", async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    assert.isFalse(await driver.exists('bar/baz/foo.txt'))
  }).timeout(6000)

  test('raise exception when credentials are incorrect', async (assert) => {
    assert.plan(1)

    const config = {
      key: 'foo',
      secret: 'bar',
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    try {
      await driver.exists('bar/baz/foo.txt')
    } catch (error) {
      assert.equal(error.original.$metadata.httpStatusCode, 403)
    }
  }).timeout(6000)
})

test.group('S3 driver | delete', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('remove file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('bar/baz/foo.txt', 'bar')
    await driver.delete('bar/baz/foo.txt')

    assert.isFalse(await driver.exists('bar/baz/foo.txt'))
  }).timeout(6000)

  test('do not error when trying to remove a non-existing file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.delete('foo.txt')
    assert.isFalse(await driver.exists('foo.txt'))
  }).timeout(6000)

  test("do not error when file parent directory doesn't exists", async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.delete('bar/baz/foo.txt')
    assert.isFalse(await driver.exists('bar/baz/foo.txt'))
  }).timeout(6000)
})

test.group('S3 driver | copy', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('copy file from within the disk root', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world')
    await driver.copy('foo.txt', 'bar.txt')

    const contents = await driver.get('bar.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('foo.txt')
    await driver.delete('bar.txt')
  }).timeout(6000)

  test('create intermediate directories when copying a file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world')
    await driver.copy('foo.txt', 'baz/bar.txt')

    const contents = await driver.get('baz/bar.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('foo.txt')
    await driver.delete('baz/bar.txt')
  }).timeout(6000)

  test("return error when source doesn't exists", async (assert) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    try {
      await driver.copy('foo.txt', 'bar.txt')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_COPY_FILE: Cannot copy file from "foo.txt" to "bar.txt"'
      )
    }
  }).timeout(6000)

  test('overwrite destination when already exists', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world')
    await driver.put('bar.txt', 'hi world')
    await driver.copy('foo.txt', 'bar.txt')

    const contents = await driver.get('bar.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('foo.txt')
    await driver.delete('bar.txt')
  }).timeout(6000)

  test('retain source acl during copy', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world', { visibility: 'public' })
    await driver.copy('foo.txt', 'bar.txt')

    const visibility = await driver.getVisibility('bar.txt')
    assert.equal(visibility, 'public')

    await driver.delete('foo.txt')
    await driver.delete('bar.txt')
  }).timeout(6000)

  test('retain source content-type during copy', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world', { contentType: 'application/json' })
    await driver.copy('foo.txt', 'bar.txt')

    const metaData = await driver.adapter.send(
      new HeadObjectCommand({ Key: 'bar.txt', Bucket: AWS_BUCKET })
    )
    assert.equal(metaData.ContentType, 'application/json')

    await driver.delete('foo.txt')
    await driver.delete('bar.txt')
  }).timeout(6000)
})

test.group('S3 driver | move', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('move file from within the disk root', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world')
    await driver.move('foo.txt', 'bar.txt')

    const contents = await driver.get('bar.txt')
    assert.equal(contents.toString(), 'hello world')
    assert.isFalse(await driver.exists('foo.txt'))

    await driver.delete('bar.txt')
  }).timeout(6000)

  test('create intermediate directories when moving a file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world')
    await driver.move('foo.txt', 'baz/bar.txt')

    const contents = await driver.get('baz/bar.txt')
    assert.equal(contents.toString(), 'hello world')
    assert.isFalse(await driver.exists('foo.txt'))

    await driver.delete('baz/bar.txt')
  }).timeout(6000)

  test("return error when source doesn't exists", async (assert) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    try {
      await driver.move('foo.txt', 'baz/bar.txt')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_MOVE_FILE: Cannot move file from "foo.txt" to "baz/bar.txt"'
      )
    }
  }).timeout(6000)

  test('overwrite destination when already exists', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world')
    await driver.put('baz/bar.txt', 'hi world')

    await driver.move('foo.txt', 'baz/bar.txt')

    const contents = await driver.get('baz/bar.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('baz/bar.txt')
  }).timeout(6000)

  test('retain source acl during move', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world', { visibility: 'public' })
    await driver.move('foo.txt', 'bar.txt')

    const visibility = await driver.getVisibility('bar.txt')
    assert.equal(visibility, 'public')

    await driver.delete('bar.txt')
  }).timeout(6000)

  test('retain source content-type during move', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    await driver.put('foo.txt', 'hello world', { contentType: 'application/json' })
    await driver.move('foo.txt', 'bar.txt')

    const metaData = await driver.adapter.send(
      new HeadObjectCommand({ Key: 'bar.txt', Bucket: AWS_BUCKET })
    )
    assert.equal(metaData.ContentType, 'application/json')

    await driver.delete('bar.txt')
  }).timeout(6000)
})

test.group('S3 driver | get', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('get file contents', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const contents = await driver.get('foo.txt')
    assert.equal(contents.toString(), 'hello world')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('get file contents as a stream', async (assert, done) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const stream = await driver.getStream('foo.txt')
    await driver.delete('foo.txt')

    stream.on('data', (chunk) => {
      assert.equal(chunk, 'hello world')
      done()
    })
  }).timeout(6000)

  test("return error when file doesn't exists", async (assert) => {
    assert.plan(1)
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    try {
      await driver.get('foo.txt')
    } catch (error) {
      assert.equal(error.message, 'E_CANNOT_READ_FILE: Cannot read file from location "foo.txt"')
    }

    await driver.delete('foo.txt')
  }).timeout(6000)
})

test.group('S3 driver | getStats', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('get file stats', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const stats = await driver.getStats('foo.txt')
    assert.equal(stats.size, 11)
    assert.instanceOf(stats.modified, Date)

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('return error when file is missing', async (assert) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    try {
      await driver.getStats('foo.txt')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_GET_METADATA: Unable to retrieve the "stats" for file at location "foo.txt"'
      )
    }
  }).timeout(6000)
})

test.group('S3 driver | getVisibility', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('get visibility for private file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const visibility = await driver.getVisibility('foo.txt')
    assert.equal(visibility, 'private')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('get visibility for public file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'public' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const visibility = await driver.getVisibility('foo.txt')
    assert.equal(visibility, 'public')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('return error when file is missing', async (assert) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    try {
      await driver.getVisibility('foo.txt')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_GET_METADATA: Unable to retrieve the "visibility" for file at location "foo.txt"'
      )
    }
  }).timeout(6000)
})

test.group('S3 driver | setVisibility', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('set file visibility', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')
    assert.equal(await driver.getVisibility('foo.txt'), 'private')

    await driver.setVisibility('foo.txt', 'public')
    assert.equal(await driver.getVisibility('foo.txt'), 'public')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('return error when file is missing', async (assert) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)

    try {
      await driver.setVisibility('foo.txt', 'public')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_SET_VISIBILITY: Unable to set visibility for file at location "foo.txt"'
      )
    }
  }).timeout(6000)
})

test.group('S3 driver | getUrl', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('get url to a given file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'public' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const url = await driver.getUrl('foo.txt')
    const response = await got.get(url)
    assert.equal(response.body, 'hello world')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('deny access to private files', async (assert) => {
    assert.plan(1)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const url = await driver.getUrl('foo.txt')

    try {
      await got.get(url)
    } catch (error) {
      assert.equal(error.response.statusCode, 403)
    }

    await driver.delete('foo.txt')
  }).timeout(6000)
})

test.group('Local driver | getSignedUrl', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('get signed url to a file in private disk', async (assert) => {
    assert.plan(2)

    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    try {
      await got.get(await driver.getUrl('foo.txt'))
    } catch (error) {
      assert.equal(error.response.statusCode, 403)
    }

    const response = await got.get(await driver.getSignedUrl('foo.txt'))
    assert.equal(response.body, 'hello world')

    await driver.delete('foo.txt')
  }).timeout(6000)

  test('define custom content headers for the file', async (assert) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const driver = new S3Driver(config)
    await driver.put('foo.txt', 'hello world')

    const response = await got.get(
      await driver.getSignedUrl('foo.txt', {
        contentType: 'application/json',
        contentDisposition: 'attachment',
      })
    )

    assert.equal(response.headers['content-type'], 'application/json')
    assert.equal(response.headers['content-disposition'], 'attachment')
    assert.equal(response.body, 'hello world')
    await driver.delete('foo.txt')
  }).timeout(6000)
})
