const buttonVariants = {
  primary:
    "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:hover:bg-[#ffffff]",
  secondary:
    "border border-[#0d0d0c]/16 bg-white/40 text-[#0d0d0c] dark:border-[#f7f7f2]/16 dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14",
};

export default function Button({
  children,
  className = "",
  disabled = false,
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      className={[
        "pc-action inline-flex w-full items-center justify-center rounded-lg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        buttonVariants[variant] ?? buttonVariants.primary,
        className,
      ].join(" ")}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
