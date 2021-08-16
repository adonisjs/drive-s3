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

## Update `contracts/drive.ts` file

Next, you must inform the TypeScript static compiler about the disk that will be using the s3 driver.

Open the `contracts/drive.ts` file and paste the following code snippet inside it.

```ts
declare module '@ioc:Adonis/Core/Drive' {
  interface DisksList {
	  // ... other disks
	  s3: {
		  config: S3DriverConfig
		  implementation: S3DriverContract
	  }
  }
}
```

## Define config

Once you define the disk inside the contracts file. The TypeScript will automatically validate the drive config file and will force you to define the config for the disk as well.

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
