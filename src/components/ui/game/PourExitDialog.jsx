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
      <div className="grid w-full max-w-sm gap-5 bg-[#f7f7f2] p-5 text-[#0d0d0c] shadow-[0_28px_80px_rgba(13,13,12,0.28)] dark:bg-[#161616] dark:text-[#f7f7f2]">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="pc-label text-[#0d0d0c]/54 dark:text-[#f7f7f2]/58">
              Exit run
            </p>
            <h2 className="pc-card-title mt-3">
              Leave game?
            </h2>
          </div>
          <button
            aria-label="Stay in game"
            className="grid size-10 shrink-0 place-items-center bg-[#0d0d0c] text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
            onClick={onCancel}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="pc-icon"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <p className="pc-copy text-[#0d0d0c]/62 dark:text-[#f7f7f2]/64">
          Are you sure you want to return to the main menu? This run will be
          dropped.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            className="pc-action inline-flex items-center justify-center bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
            onClick={onCancel}
            type="button"
          >
            Stay
          </button>
          <button
            className="pc-action inline-flex items-center justify-center bg-[#0d0d0c] text-[#f7f7f2] shadow-[0_18px_42px_rgba(13,13,12,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
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
