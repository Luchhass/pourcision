function getLargestTextFontSize(row) {
  if (!(row instanceof HTMLElement)) return 16;

  const candidates = [row, ...Array.from(row.querySelectorAll("*"))].filter(
    (element) =>
      element instanceof HTMLElement &&
      element.getClientRects().length > 0 &&
      (element.textContent || "").trim().length > 0,
  );

  return candidates.reduce((largest, element) => {
    const fontSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    return Number.isFinite(fontSize) ? Math.max(largest, fontSize) : largest;
  }, 16);
}

function getRevealRowMaskClipPath(row) {
  const fontSize = getLargestTextFontSize(row);
  const top = Math.ceil(fontSize * 0.24);
  const right = Math.ceil(Math.min(Math.max(fontSize * 0.08, 3), 18));
  const bottom = Math.ceil(fontSize * 0.76);

  return `inset(-${top}px -${right}px -${bottom}px -${right}px)`;
}

export function setRevealRowMasks(gsap, rows) {
  if (!rows?.length) return;

  rows.forEach((row) => {
    if (!(row instanceof HTMLElement)) return;

    gsap.set(row, {
      clipPath: getRevealRowMaskClipPath(row),
      overflow: "visible",
      willChange: "clip-path",
    });
  });
}

export function releaseRevealRowMasks(gsap, rows) {
  if (!rows?.length) return;

  gsap.set(rows, {
    clearProps: "clipPath,willChange",
    overflow: "visible",
  });
}
