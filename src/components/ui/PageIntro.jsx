import Pill from "@/components/ui/Pill";

export default function PageIntro({ description, eyebrow, title }) {
  const titleText = title.toUpperCase();

  return (
    <div
      className="pc-title-band min-w-0"
      style={{ "--pc-title-length": titleText.length }}
    >
      <Pill className="mb-4">{eyebrow}</Pill>
      <h1 className="pc-page-title pc-page-title-fit text-[#0d0d0c]">
        {titleText}
      </h1>
      <p className="pc-copy mt-5 max-w-[18rem] text-[#0d0d0c]/66 sm:max-w-sm">
        {description}
      </p>
    </div>
  );
}
