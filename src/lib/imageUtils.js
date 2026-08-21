// Reads a raw file into a data: URI without resizing — used to hand the
// original image to the crop/zoom editor (IconCropEditor.jsx), which does
// its own resizing/compression when the person confirms their crop.
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

