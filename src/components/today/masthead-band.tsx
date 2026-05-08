import Image from "next/image";

interface MastheadBandProps {
  now: Date;
  tagline: string;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long" });

export function MastheadBand({ now, tagline }: MastheadBandProps) {
  const weekday = WEEKDAY_FORMAT.format(now);
  const month = MONTH_FORMAT.format(now);
  const day = now.getDate();
  const year = now.getFullYear();

  return (
    <header className="mb-10">
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
        <div className="ink-art shrink-0">
          <Image
            src="/today/masthead-hero.png"
            alt=""
            width={720}
            height={720}
            priority
            className="h-[220px] w-[220px] md:h-[300px] md:w-[300px]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="almanac-eyebrow mb-2">The Daily Almanac</p>

          <h1 className="almanac-headline">
            <span>{weekday}</span>
            <span className="mx-3 text-[var(--ink-soft)]">·</span>
            <em className="month">{month}</em> {day},{" "}
            <span className="tabular-nums">{year}</span>
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Image
              src="/today/weather-mark.png"
              alt=""
              width={200}
              height={200}
              className="ink-art h-9 w-9 shrink-0 opacity-80"
            />
            <p className="almanac-tagline">{tagline}</p>
          </div>
        </div>
      </div>

      <div className="almanac-divider mt-8 mb-0">
        <Image
          src="/today/divider-sprig.png"
          alt=""
          width={1080}
          height={72}
          className="ink-art"
        />
      </div>
    </header>
  );
}
