const pillVariants = {
  dark: "bg-[#0d0d0c] text-white",
  light: "bg-white text-[#0d0d0c]",
};

export default function Pill({ children, className = "", variant = "dark" }) {
  return (
    <span
      className={[
        "pc-label inline-flex rounded-md px-3 py-2",
        pillVariants[variant] ?? pillVariants.dark,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
