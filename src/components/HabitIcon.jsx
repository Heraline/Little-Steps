// A habit's `icon` field is either a short emoji string (the default) or
// an https:// URL to a user-uploaded image (see AddHabitModal's upload
// picker). This component renders whichever it is, so every place that
// shows a habit's icon looks right without duplicating that check.
export function isCustomIconUrl(icon) {
  return typeof icon === 'string' && /^https?:\/\//.test(icon)
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
