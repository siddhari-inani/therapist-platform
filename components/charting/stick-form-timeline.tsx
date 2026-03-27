"use client";

import React, { useId } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type StickJoint = {
  x: number; // 0-1, relative
  y: number; // 0-1, relative
};

export type StickFrame = {
  id: string;
  label: string; // e.g. "Visit 3 – Squat"
  timestamp?: string; // ISO or human readable
  joints: {
    head: StickJoint;
    neck: StickJoint;
    shoulderL: StickJoint;
    shoulderR: StickJoint;
    hipL: StickJoint;
    hipR: StickJoint;
    kneeL: StickJoint;
    kneeR: StickJoint;
    ankleL: StickJoint;
    ankleR: StickJoint;
  };
};

type FormPattern = "squat" | "shoulder" | "knee" | "gait";

interface StickFormTimelineProps {
  frames: StickFrame[];
  title?: string;
  pattern?: FormPattern;
}

const WIDTH = 80;
const HEIGHT = 160;

/** Fixed dimensions for every stick figure so all form timelines match */
const FIGURE_WIDTH = 64;
const FIGURE_HEIGHT = 112;

/** Fixed dimensions for each frame block (same across squat, shoulder, knee, gait) */
const BLOCK_WIDTH = 120;
const BLOCK_MIN_HEIGHT = 160;

/** Skin tones for a realistic person (works in light/dark) */
const SKIN = {
  light: "#f5e6d7",
  mid: "#e8d0bc",
  shadow: "#c9a88a",
  outline: "rgba(120, 90, 70, 0.4)",
};

function px(p: StickJoint) {
  return p.x * WIDTH;
}
function py(p: StickJoint) {
  return p.y * HEIGHT;
}


/** Realistic human figure: skin tones, curved torso, proper limbs and feet */
function BodyFigure({ frame, pattern }: { frame: StickFrame; pattern?: FormPattern }) {
  const uid = useId().replace(/:/g, "-");
  const j = frame.joints;

  const patternClass =
    pattern === "squat"
      ? "stick-figure-squat"
      : pattern === "shoulder"
      ? "stick-figure-shoulder"
      : pattern === "knee"
      ? "stick-figure-knee"
      : pattern === "gait"
      ? "stick-figure-gait"
      : "";

  const headX = px(j.head);
  const headY = py(j.head);
  const neckX = px(j.neck);
  const neckY = py(j.neck);
  const shL = { x: px(j.shoulderL), y: py(j.shoulderL) };
  const shR = { x: px(j.shoulderR), y: py(j.shoulderR) };
  const hipL = { x: px(j.hipL), y: py(j.hipL) };
  const hipR = { x: px(j.hipR), y: py(j.hipR) };
  const kneeL = { x: px(j.kneeL), y: py(j.kneeL) };
  const kneeR = { x: px(j.kneeR), y: py(j.kneeR) };
  const ankleL = { x: px(j.ankleL), y: py(j.ankleL) };
  const ankleR = { x: px(j.ankleR), y: py(j.ankleR) };

  const shoulderMidX = (shL.x + shR.x) / 2;
  const shoulderMidY = (shL.y + shR.y) / 2;
  const hipMidX = (hipL.x + hipR.x) / 2;
  const hipMidY = (hipL.y + hipR.y) / 2;
  const waistY = (shoulderMidY + hipMidY) / 2;
  const waistInset = 3;

  const thighW = 5.5;
  const calfW = 4.5;
  const armW = 3.5;
  const headRx = 5.5;
  const headRy = 6.5;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={patternClass}
      style={{ width: FIGURE_WIDTH, height: FIGURE_HEIGHT }}
    >
      <defs>
        <filter id={`person-shadow-${uid}`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx={0} dy={2} stdDeviation={2} floodColor="#000" floodOpacity={0.15} />
        </filter>
        <linearGradient id={`skin-body-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={SKIN.light} />
          <stop offset="50%" stopColor={SKIN.mid} />
          <stop offset="100%" stopColor={SKIN.shadow} />
        </linearGradient>
        <linearGradient id={`skin-limb-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={SKIN.light} />
          <stop offset="50%" stopColor={SKIN.mid} />
          <stop offset="100%" stopColor={SKIN.light} />
        </linearGradient>
        <radialGradient id={`skin-head-${uid}`} cx="40%" cy="38%" r="65%">
          <stop offset="0%" stopColor={SKIN.light} />
          <stop offset="70%" stopColor={SKIN.mid} />
          <stop offset="100%" stopColor={SKIN.shadow} />
        </radialGradient>
      </defs>

      <g className="stick-body" filter={`url(#person-shadow-${uid})`}>
        {/* Ground shadow */}
        <ellipse
          cx={WIDTH / 2}
          cy={HEIGHT - 1}
          rx={WIDTH * 0.4}
          ry={5}
          fill="#000"
          opacity={0.1}
        />
        <line
          x1={4}
          y1={HEIGHT - 6}
          x2={WIDTH - 4}
          y2={HEIGHT - 6}
          stroke={SKIN.outline}
          strokeWidth={1}
          strokeDasharray="5,6"
          opacity={0.5}
          strokeLinecap="round"
        />

        {/* Torso first (behind legs) – shoulders to hips with slight waist curve */}
        <path
          d={`
            M ${shL.x} ${shL.y}
            L ${shR.x} ${shR.y}
            Q ${hipR.x + waistInset} ${waistY} ${hipR.x} ${hipR.y}
            L ${hipL.x} ${hipL.y}
            Q ${hipL.x - waistInset} ${waistY} ${shL.x} ${shL.y}
            Z
          `}
          fill={`url(#skin-body-${uid})`}
          stroke={SKIN.outline}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />

        {/* Legs – natural thickness with clean outline */}
        <g strokeLinecap="round">
          {/* Left thigh */}
          <path d={`M ${hipL.x} ${hipL.y} L ${kneeL.x} ${kneeL.y}`} fill="none" stroke={SKIN.outline} strokeWidth={thighW * 2 + 1.8} />
          <path d={`M ${hipL.x} ${hipL.y} L ${kneeL.x} ${kneeL.y}`} fill="none" stroke={SKIN.mid} strokeWidth={thighW * 2} />
          {/* Left calf */}
          <path d={`M ${kneeL.x} ${kneeL.y} L ${ankleL.x} ${ankleL.y}`} fill="none" stroke={SKIN.outline} strokeWidth={calfW * 2 + 1.8} />
          <path d={`M ${kneeL.x} ${kneeL.y} L ${ankleL.x} ${ankleL.y}`} fill="none" stroke={SKIN.mid} strokeWidth={calfW * 2} />
          {/* Right thigh */}
          <path d={`M ${hipR.x} ${hipR.y} L ${kneeR.x} ${kneeR.y}`} fill="none" stroke={SKIN.outline} strokeWidth={thighW * 2 + 1.8} />
          <path d={`M ${hipR.x} ${hipR.y} L ${kneeR.x} ${kneeR.y}`} fill="none" stroke={SKIN.mid} strokeWidth={thighW * 2} />
          {/* Right calf */}
          <path d={`M ${kneeR.x} ${kneeR.y} L ${ankleR.x} ${ankleR.y}`} fill="none" stroke={SKIN.outline} strokeWidth={calfW * 2 + 1.8} />
          <path d={`M ${kneeR.x} ${kneeR.y} L ${ankleR.x} ${ankleR.y}`} fill="none" stroke={SKIN.mid} strokeWidth={calfW * 2} />
        </g>

        {/* Feet – oval (heel to toe) */}
        {[ankleL, ankleR].map((ank, i) => (
          <ellipse
            key={i}
            cx={ank.x + 0.5}
            cy={ank.y + 2.5}
            rx={5}
            ry={2.8}
            fill={SKIN.mid}
            stroke={SKIN.outline}
            strokeWidth={0.6}
          />
        ))}

        {/* Neck – extends from head bottom to shoulders */}
        {(() => {
          const headBottom = headY + headRy;
          const neckTop = Math.min(headBottom, neckY);
          const neckBottom = shoulderMidY;
          const neckCenterY = (neckTop + neckBottom) / 2;
          const neckHeight = neckBottom - neckTop;
          return (
            <ellipse
              cx={neckX}
              cy={neckCenterY}
              rx={4}
              ry={neckHeight / 2 + 0.5}
              fill={`url(#skin-body-${uid})`}
              stroke={SKIN.outline}
              strokeWidth={0.7}
            />
          );
        })()}

        {/* Arms – upper arm + forearm + hand (pose-aware) */}
        {(() => {
          // Detect if shoulders are raised (shoulder exercise) - shoulders higher and wider
          const shoulderSpread = Math.abs(shR.x - shL.x);
          const shoulderHeight = (shL.y + shR.y) / 2;
          const isRaised = shoulderHeight < neckY + 2 && shoulderSpread > 20; // Raised and wide = shoulder exercise
          
          // Left arm
          let elbowL, wristL;
          if (isRaised) {
            // Arms raised overhead (shoulder exercise)
            elbowL = {
              x: shL.x + (shL.x < neckX ? -6 : 6),
              y: shL.y - 8, // Elbow above shoulder
            };
            wristL = {
              x: elbowL.x + (elbowL.x - shL.x) * 0.7,
              y: elbowL.y - 10, // Wrist above elbow
            };
          } else {
            // Normal/outward arms
            const armDirX = shL.x < neckX ? -1 : 1;
            elbowL = {
              x: shL.x + armDirX * 8,
              y: shL.y + 10,
            };
            wristL = {
              x: elbowL.x + armDirX * 6,
              y: elbowL.y + 8,
            };
          }
          
          // Right arm
          let elbowR, wristR;
          if (isRaised) {
            elbowR = {
              x: shR.x + (shR.x > neckX ? 6 : -6),
              y: shR.y - 8,
            };
            wristR = {
              x: elbowR.x + (elbowR.x - shR.x) * 0.7,
              y: elbowR.y - 10,
            };
          } else {
            const armDirX = shR.x > neckX ? 1 : -1;
            elbowR = {
              x: shR.x + armDirX * 8,
              y: shR.y + 10,
            };
            wristR = {
              x: elbowR.x + armDirX * 6,
              y: elbowR.y + 8,
            };
          }
          
          return (
            <>
              {/* Left arm */}
              <path d={`M ${shL.x} ${shL.y} L ${elbowL.x} ${elbowL.y}`} fill="none" stroke={SKIN.shadow} strokeWidth={armW + 1.2} strokeLinecap="round" />
              <path d={`M ${shL.x} ${shL.y} L ${elbowL.x} ${elbowL.y}`} fill="none" stroke={SKIN.mid} strokeWidth={armW} strokeLinecap="round" />
              <path d={`M ${elbowL.x} ${elbowL.y} L ${wristL.x} ${wristL.y}`} fill="none" stroke={SKIN.shadow} strokeWidth={armW * 0.85 + 1} strokeLinecap="round" />
              <path d={`M ${elbowL.x} ${elbowL.y} L ${wristL.x} ${wristL.y}`} fill="none" stroke={SKIN.mid} strokeWidth={armW * 0.85} strokeLinecap="round" />
              <ellipse cx={wristL.x} cy={wristL.y} rx={2.5} ry={3} fill={SKIN.mid} stroke={SKIN.outline} strokeWidth={0.5} />
              {/* Right arm */}
              <path d={`M ${shR.x} ${shR.y} L ${elbowR.x} ${elbowR.y}`} fill="none" stroke={SKIN.shadow} strokeWidth={armW + 1.2} strokeLinecap="round" />
              <path d={`M ${shR.x} ${shR.y} L ${elbowR.x} ${elbowR.y}`} fill="none" stroke={SKIN.mid} strokeWidth={armW} strokeLinecap="round" />
              <path d={`M ${elbowR.x} ${elbowR.y} L ${wristR.x} ${wristR.y}`} fill="none" stroke={SKIN.shadow} strokeWidth={armW * 0.85 + 1} strokeLinecap="round" />
              <path d={`M ${elbowR.x} ${elbowR.y} L ${wristR.x} ${wristR.y}`} fill="none" stroke={SKIN.mid} strokeWidth={armW * 0.85} strokeLinecap="round" />
              <ellipse cx={wristR.x} cy={wristR.y} rx={2.5} ry={3} fill={SKIN.mid} stroke={SKIN.outline} strokeWidth={0.5} />
            </>
          );
        })()}

        {/* Head – connects seamlessly to neck */}
        <ellipse
          cx={headX}
          cy={headY}
          rx={headRx}
          ry={headRy}
          fill={`url(#skin-head-${uid})`}
          stroke={SKIN.outline}
          strokeWidth={0.9}
        />
        <ellipse cx={headX - 2} cy={headY - 2} rx={2} ry={2.5} fill="rgba(255,255,255,0.4)" />
      </g>
    </svg>
  );
}

export function StickFormTimeline({ frames, title, pattern }: StickFormTimelineProps) {
  if (!frames.length) return null;

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title ?? "Form over time"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {frames.map((frame) => (
            <div
              key={frame.id}
              className="flex flex-col items-center justify-start gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 shrink-0"
              style={{
                width: BLOCK_WIDTH,
                minWidth: BLOCK_WIDTH,
                minHeight: BLOCK_MIN_HEIGHT,
                height: BLOCK_MIN_HEIGHT,
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ width: FIGURE_WIDTH, height: FIGURE_HEIGHT }}
              >
                <BodyFigure frame={frame} pattern={pattern} />
              </div>
              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 text-center line-clamp-2 min-h-[2.25rem] flex items-center justify-center">
                {frame.label}
              </div>
              {frame.timestamp ? (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center shrink-0">
                  {frame.timestamp}
                </div>
              ) : (
                <div className="shrink-0 min-h-[14px]" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

