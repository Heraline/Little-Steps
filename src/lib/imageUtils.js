// Resizes and compresses an image file entirely in the browser (canvas),
// returning a small JPEG data: URI. Used to let people upload a custom
// habit icon without needing Firebase Storage (which now requires a paid
// Blaze plan just to provision a bucket) — the result is small enough to
// embed directly as a string field on the habit's Firestore document,
// which has a 1 MiB document size limit.
export function resizeImageToDataUrl(file, { maxDim = 128, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width))
          width = maxDim
        } else if (height >= width && height > maxDim) {
          width = Math.round(width * (maxDim / height))
          height = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
