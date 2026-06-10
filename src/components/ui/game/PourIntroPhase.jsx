"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useTranslation } from "@/hooks/useLanguage";
import { playIntroStep } from "@/lib/sound";

const INTRO_STEPS = ["game.ready", "game.set", "game.go"];

export default function PourIntroPhase({ onComplete }) {
  const { t } = useTranslation();
  const onCompleteRef = useRef(onComplete);
  const scopeRef = useRef(null);
  const wordRefs = useRef([]);
  const steps = useMemo(() => INTRO_STEPS.map((step) => t(step)), [t]);
  const widestStep = useMemo(
    () =>
      steps.reduce(
        (widest, step) => (step.length > widest.length ? step : widest),
        steps[0],
      ),
    [steps],
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const words = wordRefs.current.filter(Boolean);

      gsap.set(words, {
        yPercent: -120,
        force3D: true,
      });

      const timeline = gsap.timeline({
        onComplete: () => {
          onCompleteRef.current?.();
        },
      });

      timeline
        .addLabel("ready")
        .to(
          words[0],
          {
            yPercent: 0,
            duration: 0.58,
            ease: "power4.out",
          },
          "ready",
        )
        .call(() => playIntroStep(0), undefined, "ready+=0.33")
        .to({}, { duration: 0.16 })
        .addLabel("set")
        .to(
          words[0],
          {
            yPercent: 120,
            duration: 0.62,
            ease: "power4.inOut",
          },
          "set",
        )
        .to(
          words[1],
          {
            yPercent: 0,
            duration: 0.62,
            ease: "power4.inOut",
          },
          "set",
        )
        .call(() => playIntroStep(1), undefined, "set+=0.42")
        .to({}, { duration: 0.16 })
        .addLabel("go")
        .to(
          words[1],
          {
            yPercent: 120,
            duration: 0.62,
            ease: "power4.inOut",
          },
          "go",
        )
        .to(
          words[2],
          {
            yPercent: 0,
            duration: 0.62,
            ease: "power4.inOut",
          },
          "go",
        )
        .call(() => playIntroStep(2), undefined, "go+=0.42")
        .to({}, { duration: 0.28 });
    }, scopeRef);

    return () => ctx.revert();
  }, [steps]);

  return (
    <section
      className="absolute inset-0 z-50 overflow-hidden bg-black p-6 text-white md:p-8"
      data-game-control="true"
      ref={scopeRef}
    >
      <div className="pc-page-title ml-auto text-right text-[clamp(4.25rem,18vw,7.5rem)] text-white md:text-[clamp(6.25rem,14vw,10.5rem)] xl:text-[clamp(8rem,12vw,13rem)]">
        <div className="relative overflow-hidden pb-[0.12em]">
          <span className="invisible block select-none" aria-hidden="true">
            {widestStep}
          </span>

          {steps.map((step, index) => (
            <span
              className="absolute inset-0 flex items-start justify-end whitespace-nowrap will-change-transform"
              key={`${step}-${index}`}
              ref={(element) => {
                wordRefs.current[index] = element;
              }}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
