"use client";

export default function SectionWord({
  className = "",
  desktopColorClass = "text-[#0d0d0c] dark:text-[#f7f7f2]/36",
  mobileColorClass = "text-[#0d0d0c] dark:text-[#f7f7f2]/36",
  primary,
  secondary,
}) {
  return (
    <div
      aria-hidden="true"
      className={[
        "pc-section-word justify-self-end text-right md:justify-self-start md:text-left",
        className,
      ].join(" ")}
      data-screen-reveal="water-content"
      data-screen-reveal-direction="down"
      data-screen-reveal-section-word="true"
    >
      <div className={["grid gap-0.5", mobileColorClass, "md:hidden"].join(" ")}>
        <span className="block overflow-hidden" data-screen-reveal-row="true">
          <span className="block">{secondary}</span>
        </span>
        <span className="block overflow-hidden" data-screen-reveal-row="true">
          <span className="block">{primary}</span>
        </span>
      </div>

      <div
        className={[
          "hidden flex-row items-start gap-2",
          desktopColorClass,
          "md:flex",
        ].join(" ")}
      >
        <span className="block overflow-hidden" data-screen-reveal-row="true">
          <span className="block [text-orientation:mixed] [writing-mode:vertical-rl]">
            {primary}
          </span>
        </span>
        <span className="block overflow-hidden" data-screen-reveal-row="true">
          <span className="block [text-orientation:mixed] [writing-mode:vertical-rl]">
            {secondary}
          </span>
        </span>
      </div>
    </div>
  );
}
