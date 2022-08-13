The package has been configured successfully!

## Validating environment variables

The configuration for s3 relies on certain environment variables and it is usually a good practice to validate the presence of those environment variables.

Open `env.ts` file and paste the following code inside it.

```ts
S3_KEY: Env.schema.string(),
S3_SECRET: Env.schema.string(),
S3_BUCKET: Env.schema.string(),
S3_REGION: Env.schema.string(),
S3_ENDPOINT: Env.schema.string.optional(),
```
Update DRIVE_DISK
```diff
- DRIVE_DISK: Env.schema.enum(['local'] as const),
+ DRIVE_DISK: Env.schema.enum(['local','s3'] as const),
```


## Define config
Open the `config/drive.ts` and paste the following code snippet inside it.

```ts
{
  disks: {
    // ... other disk

    s3: {
      driver: 's3',
      visibility: 'private',
      key: Env.get('S3_KEY'),
      secret: Env.get('S3_SECRET'),
      region: Env.get('S3_REGION'),
      bucket: Env.get('S3_BUCKET'),
      endpoint: Env.get('S3_ENDPOINT'),
    }
  }
}
```
