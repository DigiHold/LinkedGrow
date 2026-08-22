"use client";

import { useMemo, useState } from "react";

/**
 * The chat's emoji panel: search, category tabs, grid.
 *
 * Hand-rolled rather than a dependency because the stack stays small, and a
 * support chat needs a couple of hundred common emojis, not eight thousand.
 * Search matches the keywords next to each emoji.
 */

type Emoji = { e: string; k: string };
type Category = { icon: string; name: string; emojis: Emoji[] };

const CATEGORIES: Category[] = [
  {
    icon: "\u{1F600}",
    name: "Smileys & People",
    emojis: [
      { e: "\u{1F600}", k: "grinning happy smile" },
      { e: "\u{1F603}", k: "smiley happy open mouth" },
      { e: "\u{1F604}", k: "smile happy joy eyes" },
      { e: "\u{1F601}", k: "beaming grin teeth" },
      { e: "\u{1F606}", k: "laughing squint haha" },
      { e: "\u{1F605}", k: "sweat smile relief" },
      { e: "\u{1F923}", k: "rofl laugh floor" },
      { e: "\u{1F602}", k: "joy tears laugh" },
      { e: "\u{1F642}", k: "slight smile" },
      { e: "\u{1F643}", k: "upside down silly" },
      { e: "\u{1F609}", k: "wink" },
      { e: "\u{1F60A}", k: "blush happy smile" },
      { e: "\u{1F607}", k: "halo angel innocent" },
      { e: "\u{1F970}", k: "hearts love smiling" },
      { e: "\u{1F60D}", k: "heart eyes love" },
      { e: "\u{1F929}", k: "star struck wow" },
      { e: "\u{1F618}", k: "kiss blow heart" },
      { e: "\u{1F617}", k: "kissing" },
      { e: "\u{1F61A}", k: "kiss closed eyes" },
      { e: "\u{1F619}", k: "kiss smiling eyes" },
      { e: "\u{1F972}", k: "smiling tear touched" },
      { e: "\u{1F60B}", k: "yum tongue tasty" },
      { e: "\u{1F61B}", k: "tongue out" },
      { e: "\u{1F61C}", k: "wink tongue crazy" },
      { e: "\u{1F92A}", k: "zany wild crazy" },
      { e: "\u{1F61D}", k: "squint tongue" },
      { e: "\u{1F911}", k: "money mouth rich" },
      { e: "\u{1F917}", k: "hug open hands" },
      { e: "\u{1F92D}", k: "hand over mouth giggle" },
      { e: "\u{1F92B}", k: "shush quiet secret" },
      { e: "\u{1F914}", k: "thinking hmm" },
      { e: "\u{1F910}", k: "zipper mouth sealed" },
      { e: "\u{1F928}", k: "raised eyebrow skeptic" },
      { e: "\u{1F610}", k: "neutral face" },
      { e: "\u{1F611}", k: "expressionless" },
      { e: "\u{1F636}", k: "no mouth blank" },
      { e: "\u{1F60F}", k: "smirk" },
      { e: "\u{1F612}", k: "unamused meh" },
      { e: "\u{1F644}", k: "eye roll" },
      { e: "\u{1F62C}", k: "grimace awkward" },
      { e: "\u{1F925}", k: "lying nose pinocchio" },
      { e: "\u{1F614}", k: "pensive sad" },
      { e: "\u{1F62A}", k: "sleepy tired" },
      { e: "\u{1F924}", k: "drooling" },
      { e: "\u{1F634}", k: "sleeping zzz" },
      { e: "\u{1F637}", k: "mask sick" },
      { e: "\u{1F912}", k: "thermometer sick fever" },
      { e: "\u{1F915}", k: "bandage hurt" },
      { e: "\u{1F922}", k: "nauseated green sick" },
      { e: "\u{1F92E}", k: "vomit sick" },
      { e: "\u{1F927}", k: "sneeze tissue" },
      { e: "\u{1F975}", k: "hot sweat heat" },
      { e: "\u{1F976}", k: "cold freezing ice" },
      { e: "\u{1F974}", k: "woozy dizzy drunk" },
      { e: "\u{1F635}", k: "dizzy knocked out" },
      { e: "\u{1F92F}", k: "exploding head mind blown" },
      { e: "\u{1F920}", k: "cowboy hat" },
      { e: "\u{1F973}", k: "party celebration" },
      { e: "\u{1F60E}", k: "sunglasses cool" },
      { e: "\u{1F913}", k: "nerd glasses" },
      { e: "\u{1F9D0}", k: "monocle inspect" },
      { e: "\u{1F615}", k: "confused" },
      { e: "\u{1F61F}", k: "worried" },
      { e: "\u{1F641}", k: "frown sad" },
      { e: "\u{1F62E}", k: "open mouth wow" },
      { e: "\u{1F632}", k: "astonished shocked" },
      { e: "\u{1F633}", k: "flushed embarrassed" },
      { e: "\u{1F97A}", k: "pleading puppy eyes" },
      { e: "\u{1F626}", k: "frowning open mouth" },
      { e: "\u{1F628}", k: "fearful scared" },
      { e: "\u{1F630}", k: "anxious sweat" },
      { e: "\u{1F625}", k: "sad relieved" },
      { e: "\u{1F622}", k: "crying tear sad" },
      { e: "\u{1F62D}", k: "sobbing crying loud" },
      { e: "\u{1F631}", k: "scream fear" },
      { e: "\u{1F616}", k: "confounded" },
      { e: "\u{1F623}", k: "persevere" },
      { e: "\u{1F61E}", k: "disappointed" },
      { e: "\u{1F613}", k: "downcast sweat" },
      { e: "\u{1F629}", k: "weary tired" },
      { e: "\u{1F62B}", k: "exhausted" },
      { e: "\u{1F971}", k: "yawn bored" },
      { e: "\u{1F624}", k: "triumph steam" },
      { e: "\u{1F621}", k: "pouting angry red" },
      { e: "\u{1F620}", k: "angry mad" },
      { e: "\u{1F92C}", k: "cursing swearing symbols" },
      { e: "\u{1F608}", k: "devil smiling horns" },
      { e: "\u{1F480}", k: "skull dead" },
      { e: "\u{1F4A9}", k: "poop pile" },
      { e: "\u{1F921}", k: "clown" },
      { e: "\u{1F47B}", k: "ghost boo" },
      { e: "\u{1F47D}", k: "alien ufo" },
      { e: "\u{1F916}", k: "robot bot" },
    ],
  },
  {
    icon: "\u{1F44B}",
    name: "Gestures",
    emojis: [
      { e: "\u{1F44B}", k: "wave hello hi bye" },
      { e: "\u{1F91A}", k: "raised back hand" },
      { e: "\u{270B}", k: "raised hand stop" },
      { e: "\u{1F596}", k: "vulcan spock" },
      { e: "\u{1F44C}", k: "ok perfect" },
      { e: "\u{1F90C}", k: "pinched fingers italian" },
      { e: "\u{270C}\u{FE0F}", k: "victory peace" },
      { e: "\u{1F91E}", k: "crossed fingers luck" },
      { e: "\u{1F918}", k: "rock horns" },
      { e: "\u{1F919}", k: "call me shaka" },
      { e: "\u{1F448}", k: "point left" },
      { e: "\u{1F449}", k: "point right" },
      { e: "\u{1F446}", k: "point up" },
      { e: "\u{1F447}", k: "point down" },
      { e: "\u{261D}\u{FE0F}", k: "index up" },
      { e: "\u{1F44D}", k: "thumbs up like yes" },
      { e: "\u{1F44E}", k: "thumbs down dislike no" },
      { e: "\u{270A}", k: "fist" },
      { e: "\u{1F44A}", k: "fist bump punch" },
      { e: "\u{1F91B}", k: "left fist" },
      { e: "\u{1F91C}", k: "right fist" },
      { e: "\u{1F44F}", k: "clap applause bravo" },
      { e: "\u{1F64C}", k: "raised hands celebrate" },
      { e: "\u{1F450}", k: "open hands" },
      { e: "\u{1F932}", k: "palms up" },
      { e: "\u{1F91D}", k: "handshake deal" },
      { e: "\u{1F64F}", k: "pray thanks please" },
      { e: "\u{270D}\u{FE0F}", k: "writing hand" },
      { e: "\u{1F4AA}", k: "muscle strong flex" },
      { e: "\u{1F9E0}", k: "brain smart" },
      { e: "\u{1F440}", k: "eyes looking" },
      { e: "\u{1F441}\u{FE0F}", k: "eye" },
      { e: "\u{1F5E3}\u{FE0F}", k: "speaking head" },
      { e: "\u{1F464}", k: "silhouette person" },
    ],
  },
  {
    icon: "\u{2764}\u{FE0F}",
    name: "Hearts & Symbols",
    emojis: [
      { e: "\u{2764}\u{FE0F}", k: "red heart love" },
      { e: "\u{1F9E1}", k: "orange heart" },
      { e: "\u{1F49B}", k: "yellow heart" },
      { e: "\u{1F49A}", k: "green heart" },
      { e: "\u{1F499}", k: "blue heart" },
      { e: "\u{1F49C}", k: "purple heart" },
      { e: "\u{1F5A4}", k: "black heart" },
      { e: "\u{1F90D}", k: "white heart" },
      { e: "\u{1F494}", k: "broken heart" },
      { e: "\u{2763}\u{FE0F}", k: "heart exclamation" },
      { e: "\u{1F495}", k: "two hearts" },
      { e: "\u{1F49E}", k: "revolving hearts" },
      { e: "\u{1F493}", k: "beating heart" },
      { e: "\u{1F497}", k: "growing heart" },
      { e: "\u{1F496}", k: "sparkling heart" },
      { e: "\u{1F498}", k: "cupid arrow heart" },
      { e: "\u{1F49D}", k: "heart ribbon gift" },
      { e: "\u{1F4AF}", k: "hundred 100 score" },
      { e: "\u{1F4A5}", k: "collision boom" },
      { e: "\u{1F4AB}", k: "dizzy stars" },
      { e: "\u{1F4A6}", k: "sweat droplets" },
      { e: "\u{1F4A8}", k: "dash wind fast" },
      { e: "\u{2728}", k: "sparkles magic" },
      { e: "\u{1F389}", k: "party popper tada celebrate" },
      { e: "\u{1F38A}", k: "confetti ball" },
      { e: "\u{1F525}", k: "fire hot lit" },
      { e: "\u{26A1}", k: "lightning zap bolt" },
      { e: "\u{1F31F}", k: "glowing star" },
      { e: "\u{2B50}", k: "star" },
      { e: "\u{1F4A1}", k: "light bulb idea" },
      { e: "\u{2705}", k: "check mark done yes" },
      { e: "\u{274C}", k: "cross no wrong" },
      { e: "\u{2757}", k: "exclamation" },
      { e: "\u{2753}", k: "question mark" },
      { e: "\u{1F4AC}", k: "speech bubble message" },
      { e: "\u{1F4AD}", k: "thought bubble" },
    ],
  },
  {
    icon: "\u{1F436}",
    name: "Animals & Nature",
    emojis: [
      { e: "\u{1F436}", k: "dog puppy" },
      { e: "\u{1F431}", k: "cat kitten" },
      { e: "\u{1F42D}", k: "mouse" },
      { e: "\u{1F439}", k: "hamster" },
      { e: "\u{1F430}", k: "rabbit bunny" },
      { e: "\u{1F98A}", k: "fox" },
      { e: "\u{1F43B}", k: "bear" },
      { e: "\u{1F43C}", k: "panda" },
      { e: "\u{1F428}", k: "koala" },
      { e: "\u{1F42F}", k: "tiger" },
      { e: "\u{1F981}", k: "lion" },
      { e: "\u{1F42E}", k: "cow" },
      { e: "\u{1F437}", k: "pig" },
      { e: "\u{1F438}", k: "frog" },
      { e: "\u{1F435}", k: "monkey" },
      { e: "\u{1F414}", k: "chicken" },
      { e: "\u{1F427}", k: "penguin" },
      { e: "\u{1F426}", k: "bird" },
      { e: "\u{1F986}", k: "duck" },
      { e: "\u{1F985}", k: "eagle" },
      { e: "\u{1F989}", k: "owl" },
      { e: "\u{1F98B}", k: "butterfly" },
      { e: "\u{1F41D}", k: "bee honeybee" },
      { e: "\u{1F41E}", k: "ladybug" },
      { e: "\u{1F422}", k: "turtle slow" },
      { e: "\u{1F419}", k: "octopus" },
      { e: "\u{1F420}", k: "tropical fish" },
      { e: "\u{1F42C}", k: "dolphin" },
      { e: "\u{1F433}", k: "whale" },
      { e: "\u{1F984}", k: "unicorn" },
      { e: "\u{1F335}", k: "cactus" },
      { e: "\u{1F332}", k: "evergreen tree" },
      { e: "\u{1F334}", k: "palm tree" },
      { e: "\u{1F340}", k: "four leaf clover luck" },
      { e: "\u{1F339}", k: "rose flower" },
      { e: "\u{1F33B}", k: "sunflower" },
      { e: "\u{1F338}", k: "cherry blossom" },
      { e: "\u{1F31E}", k: "sun face" },
      { e: "\u{1F319}", k: "crescent moon" },
      { e: "\u{1F308}", k: "rainbow" },
      { e: "\u{2600}\u{FE0F}", k: "sun sunny" },
      { e: "\u{26C5}", k: "sun cloud" },
      { e: "\u{1F327}\u{FE0F}", k: "rain cloud" },
      { e: "\u{2744}\u{FE0F}", k: "snowflake cold" },
      { e: "\u{1F30A}", k: "wave ocean water" },
    ],
  },
  {
    icon: "\u{1F354}",
    name: "Food & Drink",
    emojis: [
      { e: "\u{1F34F}", k: "green apple" },
      { e: "\u{1F34E}", k: "red apple" },
      { e: "\u{1F34A}", k: "orange tangerine" },
      { e: "\u{1F34B}", k: "lemon" },
      { e: "\u{1F34C}", k: "banana" },
      { e: "\u{1F349}", k: "watermelon" },
      { e: "\u{1F347}", k: "grapes" },
      { e: "\u{1F353}", k: "strawberry" },
      { e: "\u{1F352}", k: "cherries" },
      { e: "\u{1F351}", k: "peach" },
      { e: "\u{1F34D}", k: "pineapple" },
      { e: "\u{1F965}", k: "coconut" },
      { e: "\u{1F951}", k: "avocado" },
      { e: "\u{1F346}", k: "eggplant" },
      { e: "\u{1F955}", k: "carrot" },
      { e: "\u{1F33D}", k: "corn" },
      { e: "\u{1F35E}", k: "bread" },
      { e: "\u{1F950}", k: "croissant" },
      { e: "\u{1F9C0}", k: "cheese" },
      { e: "\u{1F373}", k: "fried egg cooking" },
      { e: "\u{1F953}", k: "bacon" },
      { e: "\u{1F354}", k: "hamburger burger" },
      { e: "\u{1F35F}", k: "fries" },
      { e: "\u{1F355}", k: "pizza slice" },
      { e: "\u{1F32E}", k: "taco" },
      { e: "\u{1F32F}", k: "burrito" },
      { e: "\u{1F35C}", k: "ramen noodles" },
      { e: "\u{1F35D}", k: "spaghetti pasta" },
      { e: "\u{1F363}", k: "sushi" },
      { e: "\u{1F366}", k: "ice cream soft" },
      { e: "\u{1F370}", k: "cake shortcake" },
      { e: "\u{1F382}", k: "birthday cake" },
      { e: "\u{1F36B}", k: "chocolate" },
      { e: "\u{1F36A}", k: "cookie" },
      { e: "\u{1F37F}", k: "popcorn" },
      { e: "\u{2615}", k: "coffee hot" },
      { e: "\u{1F375}", k: "tea" },
      { e: "\u{1F37A}", k: "beer" },
      { e: "\u{1F377}", k: "wine" },
      { e: "\u{1F942}", k: "clinking glasses cheers champagne" },
    ],
  },
  {
    icon: "\u{26BD}",
    name: "Activities",
    emojis: [
      { e: "\u{26BD}", k: "soccer football" },
      { e: "\u{1F3C0}", k: "basketball" },
      { e: "\u{1F3C8}", k: "american football" },
      { e: "\u{26BE}", k: "baseball" },
      { e: "\u{1F3BE}", k: "tennis" },
      { e: "\u{1F3D0}", k: "volleyball" },
      { e: "\u{1F3B1}", k: "billiards pool" },
      { e: "\u{1F3D3}", k: "ping pong" },
      { e: "\u{1F3F8}", k: "badminton" },
      { e: "\u{26F3}", k: "golf" },
      { e: "\u{1F3F9}", k: "archery bow" },
      { e: "\u{1F3A3}", k: "fishing" },
      { e: "\u{1F94A}", k: "boxing glove" },
      { e: "\u{1F6B4}", k: "cycling bike" },
      { e: "\u{1F3CA}", k: "swimming" },
      { e: "\u{1F3C4}", k: "surfing" },
      { e: "\u{1F3C6}", k: "trophy win champion" },
      { e: "\u{1F947}", k: "gold medal first" },
      { e: "\u{1F3AF}", k: "target bullseye dart" },
      { e: "\u{1F3AE}", k: "video game controller" },
      { e: "\u{1F3B2}", k: "dice game" },
      { e: "\u{265F}\u{FE0F}", k: "chess pawn" },
      { e: "\u{1F3A8}", k: "art palette paint" },
      { e: "\u{1F3AC}", k: "clapper movie" },
      { e: "\u{1F3A4}", k: "microphone sing" },
      { e: "\u{1F3A7}", k: "headphones music" },
      { e: "\u{1F3B8}", k: "guitar" },
      { e: "\u{1F3B9}", k: "piano keyboard" },
      { e: "\u{1F941}", k: "drum" },
      { e: "\u{1F3B5}", k: "music note" },
    ],
  },
  {
    icon: "\u{2708}\u{FE0F}",
    name: "Travel & Places",
    emojis: [
      { e: "\u{1F697}", k: "car" },
      { e: "\u{1F695}", k: "taxi" },
      { e: "\u{1F68C}", k: "bus" },
      { e: "\u{1F3CE}\u{FE0F}", k: "race car fast" },
      { e: "\u{1F693}", k: "police car" },
      { e: "\u{1F691}", k: "ambulance" },
      { e: "\u{1F692}", k: "fire truck" },
      { e: "\u{1F6B2}", k: "bicycle" },
      { e: "\u{1F6F5}", k: "scooter" },
      { e: "\u{1F682}", k: "train locomotive" },
      { e: "\u{1F686}", k: "train" },
      { e: "\u{1F681}", k: "helicopter" },
      { e: "\u{2708}\u{FE0F}", k: "airplane plane travel" },
      { e: "\u{1F680}", k: "rocket launch ship" },
      { e: "\u{1F6F8}", k: "ufo flying saucer" },
      { e: "\u{26F5}", k: "sailboat" },
      { e: "\u{1F6A2}", k: "ship cruise" },
      { e: "\u{2693}", k: "anchor" },
      { e: "\u{1F3D6}\u{FE0F}", k: "beach umbrella" },
      { e: "\u{1F3DD}\u{FE0F}", k: "desert island" },
      { e: "\u{26F0}\u{FE0F}", k: "mountain" },
      { e: "\u{1F3D5}\u{FE0F}", k: "camping tent" },
      { e: "\u{1F3E0}", k: "house home" },
      { e: "\u{1F3E2}", k: "office building" },
      { e: "\u{1F3E5}", k: "hospital" },
      { e: "\u{1F3EB}", k: "school" },
      { e: "\u{1F5FC}", k: "tokyo tower" },
      { e: "\u{1F5FD}", k: "statue liberty" },
      { e: "\u{1F5FA}\u{FE0F}", k: "world map" },
      { e: "\u{1F30D}", k: "globe earth europe africa" },
      { e: "\u{1F30E}", k: "globe americas" },
      { e: "\u{1F303}", k: "night stars city" },
      { e: "\u{1F309}", k: "bridge night" },
    ],
  },
  {
    icon: "\u{1F4A1}",
    name: "Objects",
    emojis: [
      { e: "\u{231A}", k: "watch" },
      { e: "\u{1F4F1}", k: "phone mobile iphone" },
      { e: "\u{1F4BB}", k: "laptop computer" },
      { e: "\u{2328}\u{FE0F}", k: "keyboard" },
      { e: "\u{1F5A5}\u{FE0F}", k: "desktop computer" },
      { e: "\u{1F5A8}\u{FE0F}", k: "printer" },
      { e: "\u{1F4F7}", k: "camera photo" },
      { e: "\u{1F3A5}", k: "movie camera" },
      { e: "\u{1F4FA}", k: "television tv" },
      { e: "\u{1F50B}", k: "battery" },
      { e: "\u{1F50C}", k: "plug electric" },
      { e: "\u{1F4A1}", k: "bulb idea light" },
      { e: "\u{1F526}", k: "flashlight" },
      { e: "\u{1F4B0}", k: "money bag" },
      { e: "\u{1F4B5}", k: "dollar bill money" },
      { e: "\u{1F4B3}", k: "credit card" },
      { e: "\u{1F48E}", k: "gem diamond" },
      { e: "\u{2696}\u{FE0F}", k: "scale balance justice" },
      { e: "\u{1F527}", k: "wrench tool" },
      { e: "\u{1F528}", k: "hammer" },
      { e: "\u{2699}\u{FE0F}", k: "gear settings" },
      { e: "\u{1F9F2}", k: "magnet" },
      { e: "\u{1F52D}", k: "telescope" },
      { e: "\u{1F52C}", k: "microscope science" },
      { e: "\u{1F48A}", k: "pill medicine" },
      { e: "\u{1F6CF}\u{FE0F}", k: "bed sleep" },
      { e: "\u{1F6C1}", k: "bathtub bath" },
      { e: "\u{1F511}", k: "key" },
      { e: "\u{1F510}", k: "locked key" },
      { e: "\u{1F513}", k: "unlocked" },
      { e: "\u{1F4E6}", k: "package box" },
      { e: "\u{1F4E7}", k: "email envelope" },
      { e: "\u{1F4DD}", k: "memo note write" },
      { e: "\u{1F4C5}", k: "calendar date" },
      { e: "\u{1F4CC}", k: "pushpin pin" },
      { e: "\u{1F4CE}", k: "paperclip attach" },
      { e: "\u{2702}\u{FE0F}", k: "scissors cut" },
      { e: "\u{1F4DA}", k: "books study" },
      { e: "\u{1F4D6}", k: "open book read" },
      { e: "\u{1F381}", k: "gift present" },
      { e: "\u{1F388}", k: "balloon" },
      { e: "\u{1F4E3}", k: "megaphone announce" },
      { e: "\u{1F514}", k: "bell notification" },
    ],
  },
];

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out: Emoji[] = [];
    for (const cat of CATEGORIES) {
      for (const item of cat.emojis) {
        if (item.k.includes(q)) out.push(item);
        if (out.length >= 64) return out;
      }
    }
    return out;
  }, [query]);

  const shown = results ?? CATEGORIES[category].emojis;

  return (
    <div className="flex h-80 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="p-3 pb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
      {!results && (
        <div className="flex items-center gap-0.5 border-b border-slate-100 px-3 pb-2 dark:border-slate-800">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setCategory(i)}
              title={cat.name}
              aria-label={cat.name}
              className={
                "flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors " +
                (i === category
                  ? "bg-slate-100 dark:bg-slate-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60")
              }
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!results && (
          <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {CATEGORIES[category].name}
          </p>
        )}
        {shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No emoji found</p>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {shown.map((item) => (
              <button
                key={item.e}
                type="button"
                onClick={() => onPick(item.e)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={item.k}
              >
                {item.e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
