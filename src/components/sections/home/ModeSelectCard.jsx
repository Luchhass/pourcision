export default function ModeSelectCard({
  title,
  description,
  selected = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      aria-pressed={!disabled ? selected : undefined}
      className={[
        "group flex min-h-[8.5rem] w-full min-w-0 flex-col justify-between p-4 text-left transition-colors duration-200 min-[520px]:min-h-[7.6rem] min-[520px]:p-5 lg:min-h-[9.25rem] lg:p-6",
        "focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
        selected
          ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
          : "bg-[#f7f7f2]/96 text-[#0d0d0c] hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14",
        disabled
          ? "cursor-not-allowed opacity-55"
          : "",
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="flex min-w-0 items-start">
        <span className="pc-choice-text min-w-0 text-[1rem] md:text-[1.08rem] lg:text-[1.14rem]">
          {title}
        </span>
      </span>
      <span
        className={[
          "pc-copy-strong mt-5 block max-w-[18rem] min-[520px]:mt-6",
          selected
            ? "text-white/76 dark:text-[#0d0d0c]/72"
            : "text-[#0d0d0c]/60 dark:text-[#f7f7f2]/62",
        ].join(" ")}
      >
        {description}
      </span>
    </button>
  );
}
