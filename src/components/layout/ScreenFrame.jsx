const frameSizes = {
  default: "max-w-[700px]",
  compact: "max-w-[620px]",
};

export default function ScreenFrame({
  children,
  className = "",
  size = "default",
}) {
  return (
    <section
      className={[
        "flex h-[82%] min-h-0 w-full min-w-0 flex-col justify-between sm:h-[84%]",
        frameSizes[size] ?? frameSizes.default,
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
