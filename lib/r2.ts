import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME || 'shahrazad-storage'
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')

let s3Client: S3Client | null = null

export function getR2Client(): S3Client {
  if (!s3Client) {
    const acc = process.env.R2_ACCOUNT_ID || accountId
    const key = process.env.R2_ACCESS_KEY_ID || accessKeyId
    const secret = process.env.R2_SECRET_ACCESS_KEY || secretAccessKey

    if (!acc || !key || !secret) {
      throw new Error('Cloudflare R2 credentials are not configured')
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${acc}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: key,
        secretAccessKey: secret,
      },
    })
  }
  return s3Client
}

export function isR2Configured(): boolean {
  return Boolean(
    (process.env.R2_ACCOUNT_ID || accountId) &&
    (process.env.R2_ACCESS_KEY_ID || accessKeyId) &&
    (process.env.R2_SECRET_ACCESS_KEY || secretAccessKey) &&
    (process.env.R2_PUBLIC_URL || publicUrl)
  )
}

export async function uploadToR2(
  pathname: string,
  buffer: Buffer,
  contentType: string,
  options?: { cacheControl?: string }
): Promise<{ url: string; pathname: string }> {
  const client = getR2Client()
  const cleanKey = pathname.replace(/^\/+/, '')
  const bucket = process.env.R2_BUCKET_NAME || bucketName
  const basePublicUrl = (process.env.R2_PUBLIC_URL || publicUrl).replace(/\/+$/, '')

  const cacheControl = options?.cacheControl || 'public, max-age=31536000, immutable'

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  )

  const url = `${basePublicUrl}/${cleanKey}`
  return { url, pathname: cleanKey }
}

export async function deleteFromR2(urlOrKey: string): Promise<void> {
  const client = getR2Client()
  const bucket = process.env.R2_BUCKET_NAME || bucketName
  let key = urlOrKey

  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrKey)
      key = parsed.pathname.replace(/^\/+/, '')
    } catch {
      key = urlOrKey
    }
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}

export async function getFromR2(keyOrUrl: string) {
  const client = getR2Client()
  const bucket = process.env.R2_BUCKET_NAME || bucketName
  let key = keyOrUrl

  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const parsed = new URL(keyOrUrl)
      key = parsed.pathname.replace(/^\/+/, '')
    } catch {
      key = keyOrUrl
    }
  }

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )

  return response
}
