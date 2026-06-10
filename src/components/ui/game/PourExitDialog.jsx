"use client";

export default function PourExitDialog({ onCancel, onExit }) {
  return (
    <section
      className="absolute inset-0 z-[80] grid place-items-center bg-[#0d0d0c]/24 p-6 md:p-8"
      data-game-control="true"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-lg border border-[#0d0d0c]/14 bg-[#f7f7f2] p-5 text-[#0d0d0c] shadow-[0_24px_60px_rgba(13,13,12,0.22)]">
        <p className="pc-label text-[#0d0d0c]/54">
          Exit run
        </p>
        <h2 className="pc-card-title mt-3">
          Leave game?
        </h2>
        <p className="pc-copy mt-4 text-[#0d0d0c]/62">
          Are you sure you want to return to the main menu? This run will be
          dropped.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="pc-action inline-flex items-center justify-center rounded-lg border border-[#0d0d0c]/16 bg-white/40 text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c]"
            onClick={onCancel}
            type="button"
          >
            Stay
          </button>
          <button
            className="pc-action inline-flex items-center justify-center rounded-lg bg-[#0d0d0c] text-white shadow-[0_10px_22px_rgba(13,13,12,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c]"
            onClick={onExit}
            type="button"
          >
            Exit
          </button>
        </div>
      </div>
    </section>
  );
}
