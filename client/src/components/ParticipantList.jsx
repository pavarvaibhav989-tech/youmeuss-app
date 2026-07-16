export default function ParticipantList({ participants, hostId, currentUserId }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium px-2 mb-1">
        Participants ({participants.length})
      </h3>

      {participants.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-600/50 transition-colors"
        >
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white
                          ${p.id === currentUserId ? 'gradient-brand' : 'bg-surface-400'}`}
            >
              {p.username?.charAt(0).toUpperCase()}
            </div>
            {/* Presence indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-700
                          ${p.isOnline ? 'bg-success' : 'bg-surface-300'}`}
            />
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {p.username}
              {p.id === currentUserId && (
                <span className="text-text-muted text-xs ml-1">(you)</span>
              )}
            </p>
          </div>

          {/* Host badge */}
          {p.id === hostId && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full
                           gradient-brand text-white">
              Host
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
