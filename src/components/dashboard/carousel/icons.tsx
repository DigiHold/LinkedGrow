"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faStar,
  faHeart,
  faBolt,
  faBullseye,
  faLightbulb,
  faChartLine,
  faTrophy,
  faRocket,
  faFire,
  faCircleCheck,
  faThumbsUp,
  faHandshake,
  faCrown,
  faGem,
  faBrain,
  faCompass,
  faFlag,
  faAward,
  faChartPie,
  faUsers,
  faClock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

// Icon wrapper component for consistent sizing
function IconWrapper({ icon, className }: { icon: typeof faArrowRight; className?: string }) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={cn("w-4 h-4", className)}
    />
  );
}

// Export individual icons as React components
export const ArrowRightIcon = ({ className }: IconProps) => <IconWrapper icon={faArrowRight} className={className} />;
export const CheckIcon = ({ className }: IconProps) => <IconWrapper icon={faCheck} className={className} />;
export const StarIcon = ({ className }: IconProps) => <IconWrapper icon={faStar} className={className} />;
export const HeartIcon = ({ className }: IconProps) => <IconWrapper icon={faHeart} className={className} />;
export const BoltIcon = ({ className }: IconProps) => <IconWrapper icon={faBolt} className={className} />;
export const TargetIcon = ({ className }: IconProps) => <IconWrapper icon={faBullseye} className={className} />;
export const LightbulbIcon = ({ className }: IconProps) => <IconWrapper icon={faLightbulb} className={className} />;
export const ChartIcon = ({ className }: IconProps) => <IconWrapper icon={faChartLine} className={className} />;
export const TrophyIcon = ({ className }: IconProps) => <IconWrapper icon={faTrophy} className={className} />;
export const RocketIcon = ({ className }: IconProps) => <IconWrapper icon={faRocket} className={className} />;
export const FireIcon = ({ className }: IconProps) => <IconWrapper icon={faFire} className={className} />;
export const CircleCheckIcon = ({ className }: IconProps) => <IconWrapper icon={faCircleCheck} className={className} />;
export const ThumbsUpIcon = ({ className }: IconProps) => <IconWrapper icon={faThumbsUp} className={className} />;
export const HandshakeIcon = ({ className }: IconProps) => <IconWrapper icon={faHandshake} className={className} />;
export const CrownIcon = ({ className }: IconProps) => <IconWrapper icon={faCrown} className={className} />;
export const GemIcon = ({ className }: IconProps) => <IconWrapper icon={faGem} className={className} />;
export const BrainIcon = ({ className }: IconProps) => <IconWrapper icon={faBrain} className={className} />;
export const CompassIcon = ({ className }: IconProps) => <IconWrapper icon={faCompass} className={className} />;
export const FlagIcon = ({ className }: IconProps) => <IconWrapper icon={faFlag} className={className} />;
export const AwardIcon = ({ className }: IconProps) => <IconWrapper icon={faAward} className={className} />;
export const PieChartIcon = ({ className }: IconProps) => <IconWrapper icon={faChartPie} className={className} />;
export const UsersIcon = ({ className }: IconProps) => <IconWrapper icon={faUsers} className={className} />;
export const ClockIcon = ({ className }: IconProps) => <IconWrapper icon={faClock} className={className} />;
export const ShieldIcon = ({ className }: IconProps) => <IconWrapper icon={faShieldHalved} className={className} />;

// SVG path data for adding to canvas (these render as actual SVG shapes, not text/emoji)
export const iconSvgPaths = {
  arrow: "M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z",
  check: "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z",
  star: "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L searching 329 474.6l104.3-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z",
  heart: "M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z",
  bolt: "M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z",
  target: "M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z",
  lightbulb: "M272 384c9.6-31.9 29.5-59.1 49.2-86.2l0 0c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4l0 0c19.8 27.1 39.7 54.4 49.2 86.2H272zM192 512c44.2 0 80-35.8 80-80V416H112v16c0 44.2 35.8 80 80 80z",
  chart: "M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z",
  trophy: "M400 0H176c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8H24C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.4 64.8 138.4 75.8c22.6 6.2 41.1 38.5 41.1 67.5v32H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H320V432c0-29.1 18.5-61.3 41.1-67.5c40-11 94.1-32.7 138.4-75.8C544.5 245 578 180.6 578 88c0-13.3-10.7-24-24-24H446.4c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0z",
  rocket: "M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z",
  fire: "M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 99.8 109.2 56 159.3 5.4zm24.7 539.8c76.5 0 138.5-62 138.5-138.5c0-38.7-22.3-82.8-50.6-118.6c-14.4-18.2-29.9-34.1-43.5-46.2c-5.4-4.8-10.4-9.1-15-12.7c-3.2 5.8-6.5 11.5-9.9 17.1C177.6 290.9 152 333 152 376.5c0 44.5 36 80.5 80.5 80.5c17.7 0 32-14.3 32-32s-14.3-32-32-32c-8.8 0-16.5-7.2-16.5-16.5c0-21.4 14.5-50.7 35.8-79.4c5.2-7 10.6-13.7 16-19.9c.2 .2 .4 .5 .6 .7c2.8 3.6 5.9 7.5 9.1 11.7c13.4 17.3 28.8 39.1 41.3 60.4c13.5 22.8 23.2 45.2 23.2 61.1c0 93-75.5 168.5-168.5 168.5c-93 0-168.5-75.5-168.5-168.5c0-68.8 46.2-146.3 98.3-207c26.5-30.9 54.6-57.4 78.7-76.6c-11.8 16-22.5 32.9-31.9 49.9C112.8 183.6 80 244.2 80 276.5C80 369.4 155.6 445.2 248.5 545.2z",
  circleCheck: "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z",
  thumbsUp: "M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z",
  handshake: "M272.2 64.6l-51.1 51.1c-15.3 4.2-29.5 11.9-41.5 22.5L153 161.9C142.8 171 129.5 176 115.8 176H96V304c20.4 .6 39.8 8.9 54.3 23.4l35.6 35.6 7 7 0 0L219.9 397c6.2 6.2 16.4 6.2 22.6 0c1.7-1.7 3-3.7 3.7-5.8c2.8-7.7 9.3-13.5 17.3-15.3s16.4 .6 22.2 6.5L296.5 393c11.6 11.6 30.4 11.6 42 0c5.4-5.4 8.3-12.3 8.6-19.4c.4-8.8 5.6-16.6 13.6-20.4s17.3-3 24.4 2.1c9.4 6.7 22.5 5.8 30.9-2.6c9.4-9.4 9.4-24.6 0-33.9L340.1 243l-35.8 33c-27.3 25.2-69.2 25.6-97 1.2l0 0c-31.9-28.1-32.8-77.5-1.6-106.7l18.5-17.4c27.8-26.2 18-75.2-17.8-89zM304 336c-22.1 0-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40s-17.9-40-40-40z",
  crown: "M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z",
  gem: "M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8H376c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-5.9 6.5-15.6 6.5-21.6 0l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4l112-152zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5l57.4 95.6L63.3 192c-4.1 .3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16c.4 0 .9 0 1.3 0l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8L301.5 179.8l57.4-95.6c2.1-3.5 1.2-8-2.1-10.5s-7.9-2-10.7 1L288 140.4V24c0-4.4-3.6-8-8-8s-8 3.6-8 8V140.4l-58.1-65.6c-2.9-3.2-7.5-3.7-10.7-1z",
};

// Icon definitions for the toolbar - using Font Awesome icons as React components
// These display in the UI toolbar, and the SVG path data is used for adding to canvas
export interface IconDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  // SVG path for rendering on canvas (viewBox is 0 0 512 512 for most FA icons)
  svgPath?: string;
  viewBox?: string;
}

export const faIcons: IconDefinition[] = [
  { id: 'arrow', label: 'Arrow', icon: <ArrowRightIcon />, svgPath: iconSvgPaths.arrow, viewBox: '0 0 448 512' },
  { id: 'check', label: 'Check', icon: <CheckIcon />, svgPath: iconSvgPaths.check, viewBox: '0 0 448 512' },
  { id: 'star', label: 'Star', icon: <StarIcon />, svgPath: iconSvgPaths.star, viewBox: '0 0 576 512' },
  { id: 'heart', label: 'Heart', icon: <HeartIcon />, svgPath: iconSvgPaths.heart, viewBox: '0 0 512 512' },
  { id: 'bolt', label: 'Bolt', icon: <BoltIcon />, svgPath: iconSvgPaths.bolt, viewBox: '0 0 384 512' },
  { id: 'target', label: 'Target', icon: <TargetIcon />, svgPath: iconSvgPaths.target, viewBox: '0 0 512 512' },
  { id: 'lightbulb', label: 'Idea', icon: <LightbulbIcon />, svgPath: iconSvgPaths.lightbulb, viewBox: '0 0 384 512' },
  { id: 'chart', label: 'Chart', icon: <ChartIcon />, svgPath: iconSvgPaths.chart, viewBox: '0 0 512 512' },
  { id: 'trophy', label: 'Trophy', icon: <TrophyIcon />, svgPath: iconSvgPaths.trophy, viewBox: '0 0 576 512' },
  { id: 'rocket', label: 'Rocket', icon: <RocketIcon />, svgPath: iconSvgPaths.rocket, viewBox: '0 0 512 512' },
  { id: 'fire', label: 'Fire', icon: <FireIcon />, svgPath: iconSvgPaths.fire, viewBox: '0 0 448 512' },
  { id: 'circleCheck', label: 'Done', icon: <CircleCheckIcon />, svgPath: iconSvgPaths.circleCheck, viewBox: '0 0 512 512' },
  { id: 'thumbsUp', label: 'Like', icon: <ThumbsUpIcon />, svgPath: iconSvgPaths.thumbsUp, viewBox: '0 0 512 512' },
  { id: 'handshake', label: 'Deal', icon: <HandshakeIcon />, svgPath: iconSvgPaths.handshake, viewBox: '0 0 640 512' },
  { id: 'crown', label: 'Crown', icon: <CrownIcon />, svgPath: iconSvgPaths.crown, viewBox: '0 0 576 512' },
  { id: 'gem', label: 'Gem', icon: <GemIcon />, svgPath: iconSvgPaths.gem, viewBox: '0 0 512 512' },
  { id: 'brain', label: 'Brain', icon: <BrainIcon /> },
  { id: 'compass', label: 'Compass', icon: <CompassIcon /> },
  { id: 'flag', label: 'Flag', icon: <FlagIcon /> },
  { id: 'award', label: 'Award', icon: <AwardIcon /> },
  { id: 'pieChart', label: 'Stats', icon: <PieChartIcon /> },
  { id: 'users', label: 'Team', icon: <UsersIcon /> },
  { id: 'clock', label: 'Time', icon: <ClockIcon /> },
  { id: 'shield', label: 'Shield', icon: <ShieldIcon /> },
];
