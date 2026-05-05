import client from './client';

export async function getUploadSignature() {
  const { data } = await client.get('/reviews/upload-signature');
  return data;
}

export async function uploadToCloudinary(file, sig) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sig.apiKey);
  fd.append('timestamp', sig.timestamp);
  fd.append('signature', sig.signature);
  fd.append('folder', sig.folder);
  fd.append('allowed_formats', sig.allowedFormats);
  fd.append('max_file_size', sig.maxFileSize);
  fd.append('resource_type', sig.resourceType);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('업로드 실패');
  return res.json();
}

// 단일 서명으로 0~3장 일괄 업로드
export async function uploadFiles(files) {
  if (!files.length) return [];
  const sig = await getUploadSignature();
  const results = await Promise.allSettled(files.map((f) => uploadToCloudinary(f, sig)));
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value.secure_url);
}
