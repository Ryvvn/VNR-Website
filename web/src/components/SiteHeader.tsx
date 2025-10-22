import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/globe.svg" alt="Logo" width={22} height={22} className="opacity-80" />
            <span className="font-semibold tracking-tight">Dòng thời gian</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="#timeline" className="text-gray-700 hover:text-gray-900 transition-colors">Timeline</Link>
            <Link href="/game" className="text-gray-700 hover:text-gray-900 transition-colors">Game</Link>
            <Link href="/leaderboard" className="text-gray-700 hover:text-gray-900 transition-colors">Leaderboard</Link>
            <Link href="/tutorial" className="text-gray-700 hover:text-gray-900 transition-colors">Tutorial</Link>
          </nav>
        </div>
      </div>
      {/* Accent bar for delightful visual cue */}
      <div className="h-[3px] w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500" />
    </header>
  );
}