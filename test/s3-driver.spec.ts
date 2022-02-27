/*
 * @adonisjs/drive-s3
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'reflect-metadata'

import got from 'got'
import { test } from '@japa/runner'
import dotenv from 'dotenv'
import { join } from 'path'
import supertest from 'supertest'
import { createServer } from 'http'
import { Logger } from '@adonisjs/logger/build/index'
import { string } from '@poppinss/utils/build/helpers'
import { HeadObjectCommand } from '@aws-sdk/client-s3'

import { S3Driver } from '../src/Drivers/S3'
import { setupApplication, fs } from '../test-helpers'

const logger = new Logger({ enabled: true, name: 'adonisjs', level: 'info' })

dotenv.config()

const AWS_KEY = process.env.AWS_KEY!
const AWS_SECRET = process.env.AWS_SECRET!
const AWS_BUCKET = process.env.AWS_BUCKET!
const AWS_ENDPOINT = process.env.AWS_ENDPOINT!

test.group('S3 driver | put', () => {
  test('write file to the destination', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.getUrl(fileName)

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName)
  }).timeout(6000)

  test('write to nested path', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName)
  }).timeout(6000)

  test('overwrite destination when already exists', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')
    await driver.put(fileName, 'hi world')

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hi world')

    await driver.delete(fileName)
  }).timeout(6000)

  test('set custom content-type for the file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, '{ "hello": "world" }', {
      contentType: 'application/json',
    })

    const response = await driver.adapter.send(
      new HeadObjectCommand({ Key: fileName, Bucket: AWS_BUCKET })
    )

    assert.equal(response.ContentType, 'application/json')
    await driver.delete(fileName)
  }).timeout(6000)
})

test.group('S3 driver | putStream', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('write file to the destination', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await fs.add('foo.txt', 'hello stream')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.putStream(fileName, stream)

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hello stream')

    await driver.delete(fileName)
  }).timeout(6000)

  test('write to nested path', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await fs.add('foo.txt', 'hello stream')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.putStream(fileName, stream)

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hello stream')

    await driver.delete(fileName)
  }).timeout(6000)

  test('overwrite destination when already exists', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await fs.add('foo.txt', 'hi stream')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.put(fileName, 'hello world')
    await driver.putStream(fileName, stream)

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hi stream')

    await driver.delete(fileName)
  }).timeout(6000)

  test('set custom content-type for the file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await fs.add('foo.txt', '{ "hello": "world" }')
    const stream = fs.fsExtra.createReadStream(join(fs.basePath, 'foo.txt'))
    await driver.putStream(fileName, stream, {
      contentType: 'application/json',
    })

    const response = await driver.adapter.send(
      new HeadObjectCommand({ Key: fileName, Bucket: AWS_BUCKET })
    )
    assert.equal(response.ContentType, 'application/json')

    await driver.delete(fileName)
  }).timeout(6000)
})

test.group('S3 driver | multipartStream', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('write file to the destination', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const fileName = `${string.generateRandom(10)}.json`
    const driver = new S3Driver(config, logger)

    const app = await setupApplication()
    const Route = app.container.resolveBinding('Adonis/Core/Route')
    const Server = app.container.resolveBinding('Adonis/Core/Server')

    Server.middleware.register([
      async () => {
        return {
          default: app.container.resolveBinding('Adonis/Core/BodyParser'),
        }
      },
    ])

    Route.post('/', async ({ request }) => {
      request.multipart.onFile('package', {}, async (part, reportChunk) => {
        part.pause()
        part.on('data', reportChunk)
        await driver.putStream(fileName, part, { multipart: true, queueSize: 2 })
      })

      await request.multipart.process()
    })

    Server.optimize()

    const server = createServer(Server.handle.bind(Server))
    await supertest(server).post('/').attach('package', join(__dirname, '..', 'package.json'))

    const contents = await driver.get(fileName)
    assert.equal(
      contents.toString(),
      await fs.fsExtra.readFile(join(__dirname, '..', 'package.json'), 'utf-8')
    )

    await driver.delete(fileName)
  }).timeout(6000)

  test('cleanup stream when validation fails', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }

    const fileName = `${string.generateRandom(10)}.json`
    const driver = new S3Driver(config, logger)

    const app = await setupApplication()
    const Route = app.container.resolveBinding('Adonis/Core/Route')
    const Server = app.container.resolveBinding('Adonis/Core/Server')

    Server.middleware.register([
      async () => {
        return {
          default: app.container.resolveBinding('Adonis/Core/BodyParser'),
        }
      },
    ])

    Route.post('/', async ({ request }) => {
      request.multipart.onFile('package', { extnames: ['png'] }, async (part, reportChunk) => {
        part.pause()
        part.on('data', reportChunk)
        await driver.putStream(fileName, part, { multipart: true, queueSize: 2 })
      })

      await request.multipart.process()
      assert.isTrue(request.file('package')?.hasErrors)
    })

    Server.optimize()

    const server = createServer(Server.handle.bind(Server))
    await supertest(server).post('/').attach('package', join(__dirname, '..', 'package.json'))

    await driver.delete(fileName)
  }).timeout(6000)
})

test.group('S3 driver | exists', () => {
  test('return true when a file exists', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'bar')
    assert.isTrue(await driver.exists(fileName))

    await driver.delete(fileName)
  }).timeout(6000)

  test("return false when a file doesn't exists", async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    assert.isFalse(await driver.exists(fileName))
  }).timeout(6000)

  test("return false when a file parent directory doesn't exists", async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    assert.isFalse(await driver.exists(fileName))
  }).timeout(6000)

  test('raise exception when credentials are incorrect', async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)
    try {
      await driver.exists('bar/baz/foo.txt')
    } catch (error) {
      assert.equal(error.original.$metadata.httpStatusCode, 403)
    }
  }).timeout(6000)
})

test.group('S3 driver | delete', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('remove file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'bar')
    await driver.delete(fileName)

    assert.isFalse(await driver.exists(fileName))
  }).timeout(6000)

  test('do not error when trying to remove a non-existing file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.delete(fileName)
    assert.isFalse(await driver.exists(fileName))
  }).timeout(6000)

  test("do not error when file parent directory doesn't exists", async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `bar/baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.delete(fileName)
    assert.isFalse(await driver.exists(fileName))
  }).timeout(6000)
})

test.group('S3 driver | copy', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('copy file from within the disk root', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.copy(fileName, fileName1)

    const contents = await driver.get(fileName1)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName)
    await driver.delete(fileName1)
  }).timeout(6000)

  test('create intermediate directories when copying a file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.copy(fileName, fileName1)

    const contents = await driver.get(fileName1)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName)
    await driver.delete(fileName1)
  }).timeout(6000)

  test("return error when source doesn't exists", async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)

    try {
      await driver.copy('foo.txt', 'bar.txt')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_COPY_FILE: Cannot copy file from "foo.txt" to "bar.txt"'
      )
    }
  }).timeout(6000)

  test('overwrite destination when already exists', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.put(fileName1, 'hi world')
    await driver.copy(fileName, fileName1)

    const contents = await driver.get(fileName1)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName)
    await driver.delete(fileName1)
  }).timeout(6000)

  test('retain source acl during copy', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world', { visibility: 'public' })
    await driver.copy(fileName, fileName1)

    const visibility = await driver.getVisibility(fileName1)
    assert.equal(visibility, 'public')

    await driver.delete(fileName)
    await driver.delete(fileName1)
  }).timeout(6000)

  test('retain source content-type during copy', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world', { contentType: 'application/json' })
    await driver.copy(fileName, fileName1)

    const metaData = await driver.adapter.send(
      new HeadObjectCommand({ Key: fileName1, Bucket: AWS_BUCKET })
    )
    assert.equal(metaData.ContentType, 'application/json')

    await driver.delete(fileName)
    await driver.delete(fileName1)
  }).timeout(6000)
})

test.group('S3 driver | move', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('move file from within the disk root', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.move(fileName, fileName1)

    const contents = await driver.get(fileName1)
    assert.equal(contents.toString(), 'hello world')
    assert.isFalse(await driver.exists(fileName))

    await driver.delete(fileName1)
  }).timeout(6000)

  test('create intermediate directories when moving a file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.move(fileName, fileName1)

    const contents = await driver.get(fileName1)
    assert.equal(contents.toString(), 'hello world')
    assert.isFalse(await driver.exists(fileName))

    await driver.delete(fileName1)
  }).timeout(6000)

  test("return error when source doesn't exists", async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)

    try {
      await driver.move('foo.txt', 'baz/bar.txt')
    } catch (error) {
      assert.equal(
        error.message,
        'E_CANNOT_MOVE_FILE: Cannot move file from "foo.txt" to "baz/bar.txt"'
      )
    }
  }).timeout(6000)

  test('overwrite destination when already exists', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `baz/${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world')
    await driver.put(fileName1, 'hi world')

    await driver.move(fileName, fileName1)

    const contents = await driver.get(fileName1)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName1)
  }).timeout(6000)

  test('retain source acl during move', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world', { visibility: 'public' })
    await driver.move(fileName, fileName1)

    const visibility = await driver.getVisibility(fileName1)
    assert.equal(visibility, 'public')

    await driver.delete(fileName1)
  }).timeout(6000)

  test('retain source content-type during move', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`
    const fileName1 = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)

    await driver.put(fileName, 'hello world', { contentType: 'application/json' })
    await driver.move(fileName, fileName1)

    const metaData = await driver.adapter.send(
      new HeadObjectCommand({ Key: fileName1, Bucket: AWS_BUCKET })
    )
    assert.equal(metaData.ContentType, 'application/json')

    await driver.delete(fileName1)
  }).timeout(6000)
})

test.group('S3 driver | get', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('get file contents', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const contents = await driver.get(fileName)
    assert.equal(contents.toString(), 'hello world')

    await driver.delete(fileName)
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
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const stream = await driver.getStream(fileName)

    stream.on('data', (chunk) => {
      assert.equal(chunk, 'hello world')
    })
    stream.on('end', async () => {
      await driver.delete(fileName)
      done()
    })
    stream.on('error', (error) => {
      done(error)
    })
  }).timeout(6000)

  test("return error when file doesn't exists", async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)

    try {
      await driver.get('foo.txt')
    } catch (error) {
      assert.equal(error.message, 'E_CANNOT_READ_FILE: Cannot read file from location "foo.txt"')
    }
  }).timeout(6000)
})

test.group('S3 driver | getStats', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('get file stats', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const stats = await driver.getStats(fileName)
    assert.equal(stats.size, 11)
    assert.instanceOf(stats.modified, Date)

    await driver.delete(fileName)
  }).timeout(6000)

  test('return error when file is missing', async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)
    const fileName = `${string.generateRandom(10)}.txt`

    try {
      await driver.getStats(fileName)
    } catch (error) {
      assert.equal(
        error.message,
        `E_CANNOT_GET_METADATA: Unable to retrieve the "stats" for file at location "${fileName}"`
      )
    }
  }).timeout(6000)
})

test.group('S3 driver | getVisibility', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('get visibility for private file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const visibility = await driver.getVisibility(fileName)
    assert.equal(visibility, 'private')

    await driver.delete(fileName)
  }).timeout(6000)

  test('get visibility for public file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'public' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const visibility = await driver.getVisibility(fileName)
    assert.equal(visibility, 'public')

    await driver.delete(fileName)
  }).timeout(6000)

  test('return error when file is missing', async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)
    const fileName = `${string.generateRandom(10)}.txt`

    try {
      await driver.getVisibility(fileName)
    } catch (error) {
      assert.equal(
        error.message,
        `E_CANNOT_GET_METADATA: Unable to retrieve the "visibility" for file at location "${fileName}"`
      )
    }
  }).timeout(6000)
})

test.group('S3 driver | setVisibility', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('set file visibility', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')
    assert.equal(await driver.getVisibility(fileName), 'private')

    await driver.setVisibility(fileName, 'public')
    assert.equal(await driver.getVisibility(fileName), 'public')

    await driver.delete(fileName)
  }).timeout(6000)

  test('return error when file is missing', async ({ assert }) => {
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

    const driver = new S3Driver(config, logger)
    const fileName = `${string.generateRandom(10)}.txt`

    try {
      await driver.setVisibility(fileName, 'public')
    } catch (error) {
      assert.equal(
        error.message,
        `E_CANNOT_SET_VISIBILITY: Unable to set visibility for file at location "${fileName}"`
      )
    }
  }).timeout(6000)
})

test.group('S3 driver | getUrl', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('get url to a given file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'public' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const url = await driver.getUrl(fileName)
    const response = await got.get(url)
    assert.equal(response.body, 'hello world')

    await driver.delete(fileName)
  }).timeout(6000)

  test('deny access to private files', async ({ assert }) => {
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
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const url = await driver.getUrl(fileName)

    try {
      await got.get(url)
    } catch (error) {
      assert.equal(error.response.statusCode, 403)
    }

    await driver.delete(fileName)
  }).timeout(6000)
})

test.group('S3 driver | getSignedUrl', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('get signed url to a file in private disk', async ({ assert }) => {
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
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    try {
      await got.get(await driver.getUrl(fileName))
    } catch (error) {
      assert.equal(error.response.statusCode, 403)
    }

    const response = await got.get(await driver.getSignedUrl(fileName))
    assert.equal(response.body, 'hello world')

    await driver.delete(fileName)
  }).timeout(6000)

  test('define custom content headers for the file', async ({ assert }) => {
    const config = {
      key: AWS_KEY,
      secret: AWS_SECRET,
      bucket: AWS_BUCKET,
      endpoint: AWS_ENDPOINT,
      region: 'sgp1',
      driver: 's3' as const,
      visibility: 'private' as const,
    }
    const fileName = `${string.generateRandom(10)}.txt`

    const driver = new S3Driver(config, logger)
    await driver.put(fileName, 'hello world')

    const signedUrl = await driver.getSignedUrl(fileName, {
      contentType: 'application/json',
      contentDisposition: 'attachment',
    })

    const response = await got.get(signedUrl)

    assert.equal(response.headers['content-type'], 'application/json')
    assert.equal(response.headers['content-disposition'], 'attachment')
    assert.equal(response.body, 'hello world')
    await driver.delete(fileName)
  }).timeout(6000)
})
