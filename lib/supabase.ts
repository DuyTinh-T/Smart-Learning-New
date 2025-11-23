import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * List all storage buckets (for debugging)
 */
export async function listBuckets() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage.listBuckets()
  
  if (error) {
    console.error('Error listing buckets:', error)
    return []
  }
  
  return data
}

/**
 * Check if bucket exists
 */
export async function checkBucket(bucketName: string) {
  const buckets = await listBuckets()
  return buckets.find(b => b.name === bucketName)
}

/**
 * Upload file to Supabase Storage (Client-side only)
 * @param file - File to upload
 * @param bucket - Storage bucket name (default: 'course-thumbnails')
 * @param folder - Optional folder path within bucket
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string = 'course-thumbnails',
  folder?: string
): Promise<string> {
  const supabase = getSupabaseClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  if (process.env.NODE_ENV === 'development') {
    console.log('📤 Uploading to Supabase:', {
      bucket,
      filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('❌ Upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Upload success:', data)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Public URL:', publicUrl)
  }

  return publicUrl
}

/**
 * Delete file from Supabase Storage (Client-side only)
 * @param filePath - Path to file in storage
 * @param bucket - Storage bucket name
 */
export async function deleteFile(
  filePath: string,
  bucket: string = 'course-thumbnails'
): Promise<void> {
  const supabase = getSupabaseClient()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ Deleting from Supabase:', {
      bucket,
      filePath
    })
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) {
    console.error('❌ Delete error:', error)
    throw new Error(`Delete failed: ${error.message}`)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ File deleted successfully')
  }
}
