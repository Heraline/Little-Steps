// A habit's `icon` field is either a short emoji string (the default) or
// a data: URI holding a small compressed image (see AddHabitModal's
// upload picker — images are resized client-side and embedded directly
// in the habit's Firestore document, since Firebase Storage now requires
// a paid Blaze plan just to provision a bucket).
export function isCustomIconUrl(icon) {
  return typeof icon === 'string' && /^(https?:|data:image\/)/.test(icon)
}

export default function HabitIcon({ icon, className, imgSize = '1em' }) {
  if (isCustomIconUrl(icon)) {
    return (
      <img
        src={icon}
        alt=""
        className={className}
        style={{
          width: imgSize,
          height: imgSize,
          objectFit: 'cover',
          borderRadius: '30%',
          display: 'inline-block',
        }}
      />
    )
  }
  return <span className={className}>{icon}</span>
}
