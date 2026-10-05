import { putTrackedBlob } from '@/lib/usage'

export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  const filename = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const { url } = await putTrackedBlob(filename, file, {
    access: 'public',
  }, folder === 'branding' ? 'branding' : 'product', file.size)
  return url
}
